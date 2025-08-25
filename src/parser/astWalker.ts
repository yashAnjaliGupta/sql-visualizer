import { Graph } from './types';
import { GraphBuilder } from './graph/GraphBuilder';
import { AliasResolver } from './alias';
import { collectSetChain } from './setOps';

export interface WalkCtx {
  builder: GraphBuilder;
  aliases: AliasResolver;
}

export function processAST(ast: any, ctx: WalkCtx, opts?: { isNested?: boolean; providedName?: string; providedId?: string }): string {
  const isNested = !!opts?.isNested;
  const providedName = opts?.providedName;
  const providedId = opts?.providedId;
  // Collapse pattern: SELECT ... FROM (subquery) alias  => reuse alias as this SELECT's result
  const fromSubqueryAlias = !providedName && Array.isArray(ast.from) && ast.from.length === 1 && ast.from[0]?.expr?.ast && ast.from[0]?.as
    ? (ast.from[0].as as string)
    : undefined;

  const resultName = providedName || fromSubqueryAlias || (!ast._next && !isNested ? 'Result' : `Result_${Math.random().toString(36).slice(2,7)}`);
  const resultId = providedId || ctx.builder.ensureTable(resultName, 'table', { setOperation: ast.set_op || null });

  // WITH / CTEs
  const withItems: any[] = Array.isArray(ast.with)
    ? ast.with
    : ast.with?.with && Array.isArray(ast.with.with)
      ? ast.with.with
      : [];
  withItems.forEach(cte => {
    const cteName = cte.name.value;
    const cteId = ctx.builder.ensureTable(cteName, 'cte', { isCTE: true });
    if (cte.stmt?.ast) {
      const nestedId = processAST(cte.stmt.ast, ctx, { isNested: true, providedName: cteName, providedId: cteId });
      if (nestedId && nestedId !== cteId) ctx.builder.linkTables(nestedId, cteId, 'table_TO_table');
    }
  });

  // Set ops
  if (ast._next) {
    const { op, parts } = collectSetChain(ast);
    const unionId = resultId; // union collapses into result node
    const unionName = resultName;
    for (let i = 0; i < parts.length; i++) {
      const partId = processAST(parts[i], ctx, { isNested: true });
      // best-effort: map columns by name
      const g = ctx.builder.getGraph();
      const partCols = g.nodes
        .filter(n => n.type === 'column' && n.tableId === partId)
        .map(col => (typeof col.name === 'string' ? (col.name as string) : undefined))
        .filter((n): n is string => !!n);

      const incoming = g.edges.filter(e => e.type === 'table_TO_table' && e.target === partId);
      const partIsUnionLike = incoming.length >= 2; // heuristic for inner UNION alias like special_union

      if (partIsUnionLike) {
        // Link only alias union (e.g., special_union) to outer union; do not lift its sources
        ctx.builder.linkTables(partId, unionId, 'table_TO_table');
        const srcTable = (partId || '').replace('table_', '');
        partCols.forEach(cn => {
          ctx.builder.ensureColumn(unionName, cn);
          ctx.builder.linkColumns(srcTable, cn, unionId, cn);
        });
      } else {
        // Default: map from the part result to the union result and lift its sources
        const srcTable = (partId || '').replace('table_', '');
        partCols.forEach(cn => {
          if (srcTable) {
            ctx.builder.ensureColumn(unionName, cn);
            ctx.builder.linkColumns(srcTable, cn, unionId, cn);
          }
        });
        ctx.builder.linkTables(partId, unionId, 'table_TO_table');
        incoming.forEach(e => ctx.builder.linkTables(e.source, unionId, 'table_TO_table'));
      }
    }
    return unionId;
  }

  // FROM
  if (ast.from) {
    ast.from.forEach((item: any, idx: number) => {
      if (item.expr?.ast) {
        // Ensure subquery in FROM always has a stable table name (alias). If not provided, synthesize one.
        if (!item.as) item.as = `subq_${idx + 1}`;
        ctx.builder.ensureTable(item.as, 'table');
        const subId = processAST(item.expr.ast, ctx, { isNested: true, providedName: item.as, providedId: `table_${item.as}` });
        ctx.builder.linkTables(subId, resultId, 'table_TO_table');
        return;
      }
      const realName = item.table;
      const id = ctx.builder.ensureTable(realName, 'table', { alias: item.as, db: item.db });
      ctx.aliases.register(item.as, realName);
      ctx.builder.linkTables(id, resultId, 'table_TO_table');
    });
  }

  // SELECT columns
  if (ast.columns) {
    const defaultFromRaw = (ast.from?.[0]?.as || ast.from?.[0]?.table) as string | undefined;
    const defaultFrom = defaultFromRaw ? (ctx.aliases.resolve(defaultFromRaw) || defaultFromRaw) : undefined;
    ast.columns.forEach((col: any) => {
      if (col.expr?.type === 'star') return;
      const outName = col.as || (col.expr?.type === 'column_ref' ? col.expr.column : `expr_${Math.random().toString(36).slice(2,7)}`);
      ctx.builder.ensureColumn(resultName, outName);

      // If this SELECT item is a subquery, process it and map its columns to this output column
      const subAst = col.expr?.ast || col.ast;
      console.log(subAst);
      if (subAst) {
        const providedName = `Table_${col.as}`; // respect alias if given
        const providedId = providedName ? `table_${providedName}` : undefined;
        console.log('baat kr', providedId, providedName);
        const subId = processAST(subAst, ctx, { isNested: true, providedName: providedName, providedId });
        ctx.builder.ensureTable(providedName || `subquery_${Math.random().toString(36).slice(2,7)}`, 'table', { alias: providedName, db: col.db });
        console.log('baat kr li',subId);
        // Link subquery result table to this SELECT's result table
        ctx.builder.linkTables(subId, resultId, 'table_TO_table');
        // Map each source column from subquery result to this output column name
        const g = ctx.builder.getGraph();
        g.nodes
          .filter(n => n.type === 'column' && n.tableId === subId)
          .forEach(srcCol => {
            if (typeof srcCol.name === 'string') {
              const srcTableName = subId.replace('table_', '');
              ctx.builder.linkColumns(srcTableName, srcCol.name, resultId, outName, 'column_mapping');
            }
          });
        return; // done handling this column
      }

      const collect = (e: any) => {
        if (!e) return;
        if (e.type === 'column_ref') {
          const tCandidate = e.table ? (ctx.aliases.resolve(e.table) || e.table) : defaultFrom;
          const tResolved = tCandidate ? (ctx.aliases.resolve(tCandidate) || tCandidate) : undefined;
          if (tResolved) {
            ctx.builder.ensureColumn(tResolved, e.column);
            ctx.builder.linkColumns(tResolved, e.column, resultId, outName, 'column_mapping');
          }
          return;
        }
        if (e.type === 'binary_expr') { collect(e.left); collect(e.right); return; }
        if (e.type === 'function' && e.args) {
          if (Array.isArray(e.args.value)) e.args.value.forEach(collect);
          else collect(e.args.value);
        }
        if (e.type === 'aggr_func' && e.args?.expr) collect(e.args.expr);
        if (e.type === 'case') {
          if (e.expr) collect(e.expr);
          if (Array.isArray(e.args)) e.args.forEach((a: any) => { if (a.cond) collect(a.cond); if (a.result) collect(a.result); });
        }
      };
      collect(col.expr);
    });
  }

//   // WHERE -> condition edges
//   const addWhere = (node: any) => {
//     if (!node) return;
//     if (node.type === 'binary_expr') { addWhere(node.left); addWhere(node.right); return; }
//     if (node.type === 'column_ref') {
//       const t = node.table ? (ctx.aliases.resolve(node.table) || node.table) : undefined;
//       const col = node.column;
//       if (t) {
//         ctx.builder.ensureColumn(t, col);
//         ctx.builder.linkColumns(t, col, resultId, `${resultName}_condition`, 'condition');
//       }
//     }
//   };
//   if (ast.where) addWhere(ast.where);

  return resultId;
}

export function astToGraph(ast: any): Graph {
  const builder = new GraphBuilder();
  const aliases = new AliasResolver();
  const root = Array.isArray(ast) ? ast[0] : ast;
  processAST(root, { builder, aliases });
  console.log('GraphBuilder', builder.getGraph());
  return builder.getGraph();
}
