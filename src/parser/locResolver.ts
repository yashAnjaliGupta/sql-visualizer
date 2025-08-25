// Build highlight ranges for columns using AST locations when available,
// and falling back to regex-based matching when locations are missing.
import { Graph } from './types';
import { Parser } from 'node-sql-parser';

export interface TextPoint { line: number; column: number }
export interface TextRange {
  start: TextPoint;
  end: TextPoint;
  startOffset?: number;
  endOffset?: number;
}

type AnyAst = any;

function hasAnyLoc(ast: AnyAst): boolean {
  const stack = [ast];
  const seen = new Set<any>();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== 'object') continue;
    if (seen.has(cur)) continue;
    seen.add(cur);
    if ((cur as any).loc || (cur as any).location) return true;
    for (const k of Object.keys(cur)) {
      const v = (cur as any)[k];
      if (v && typeof v === 'object') stack.push(v);
    }
  }
  return false;
}

function getNodeRange(node: any): TextRange | undefined {
  const loc = node?.loc || node?.location;
  if (!loc || !loc.start || !loc.end) return undefined;
  const start = loc.start;
  const end = loc.end;
  return {
    start: { line: start.line ?? 1, column: start.column ?? 1 },
    end: { line: end.line ?? (start.line ?? 1), column: end.column ?? ((start.column ?? 1) + 1) },
    startOffset: start.offset,
    endOffset: end.offset,
  };
}

function extractAliasMap(ast: AnyAst): Map<string, string> {
  const map = new Map<string, string>();
  const visitSelect = (selectNode: any) => {
    if (!selectNode) return;
    const from = Array.isArray(selectNode?.from) ? selectNode.from : [];
    for (const item of from) {
      const as = item?.as;
      if (item?.expr?.ast && as) {
        // Subquery in FROM; use alias as the real table name for qualifiers
        map.set(as, as);
        // Recurse into subquery to collect deeper aliases
        visitSelect(item.expr.ast);
      } else {
        const real = item?.table;
        if (as && real) map.set(as, real);
      }
    }
  };

  const root = Array.isArray(ast) ? ast[0] : ast;
  visitSelect(root);

  // CTE names as self-mapped and recurse into their statements
  const withList = Array.isArray(root?.with)
    ? root?.with
    : root?.with?.with && Array.isArray(root?.with?.with)
      ? root?.with?.with
      : [];
  for (const cte of withList) {
    const name = cte?.name?.value;
    if (name) map.set(name, name);
    if (cte?.stmt?.ast) visitSelect(cte.stmt.ast);
  }

  return map;
}

function collectColumnRefs(ast: AnyAst): Array<{ table?: string; column: string; node: any }> {
  const out: Array<{ table?: string; column: string; node: any }> = [];
  const stack = [ast];
  let guard = 0;
  while (stack.length && guard < 20000) {
    guard++;
    const cur = stack.pop();
    if (!cur || typeof cur !== 'object') continue;
    if (cur.type === 'column_ref' && typeof cur.column === 'string') {
      out.push({ table: cur.table, column: cur.column, node: cur });
    }
    for (const k of Object.keys(cur)) {
      const v = (cur as any)[k];
      if (v && typeof v === 'object') stack.push(v);
    }
  }
  return out;
}

function findDefaultFrom(root: any): string | undefined {
  const f = Array.isArray(root?.from) ? root.from : [];
  if (f.length === 1) return f[0]?.as || f[0]?.table;
  return undefined;
}

function computeLineStarts(sql: string): number[] {
  const arr = [0];
  for (let i = 0; i < sql.length; i++) if (sql[i] === '\n') arr.push(i + 1);
  return arr;
}

function toLineCol(offset: number, lineStarts: number[]): TextPoint {
  // binary search
  let lo = 0, hi = lineStarts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lineStarts[mid] <= offset) lo = mid + 1; else hi = mid - 1;
  }
  const lineIdx = Math.max(0, hi);
  return { line: lineIdx + 1, column: offset - lineStarts[lineIdx] + 1 };
}

function regexRanges(sql: string, qualifiers: string[], column: string, requireQualifier = true): TextRange[] {
  const safe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const qualParts = qualifiers.filter(Boolean).map(q => `(?:\\b${safe(q)}\\b\\s*\\.\\s*)`);
  const qualifierGroup = qualParts.length > 0 ? `(?:${qualParts.join('|')})` : '';
  const pattern = requireQualifier && qualifierGroup
    ? `${qualifierGroup}\\b${safe(column)}\\b`
    : `${qualifierGroup}?\\b${safe(column)}\\b`;
  const re = new RegExp(pattern, 'gi');
  const lineStarts = computeLineStarts(sql);
  const ranges: TextRange[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    const startOffset = m.index;
    const endOffset = m.index + m[0].length;
    const start = toLineCol(startOffset, lineStarts);
    const end = toLineCol(endOffset, lineStarts);
    ranges.push({ start, end, startOffset, endOffset });
  }
  return ranges;
}

export function buildColumnHighlightMap(
  sql: string,
  ast: AnyAst,
  graph?: Graph
): Record<string, TextRange[]> {
  const result: Record<string, TextRange[]> = {};
  const push = (id: string, r?: TextRange) => {
    if (!r) return;
    if (!result[id]) result[id] = [];
    const dup = result[id].some(x => x.startOffset === r.startOffset && x.endOffset === r.endOffset);
    if (!dup) result[id].push(r);
  };

  const inputRoot = Array.isArray(ast) ? ast[0] : ast;
  let root = inputRoot;
  if (!hasAnyLoc(inputRoot)) {
    try {
      const p = new Parser();
      const locAst = p.astify(sql, { parseOptions: { includeLocations: true } as any });
      root = Array.isArray(locAst) ? locAst[0] : locAst;
    } catch {
      root = inputRoot;
    }
  }
  const aliasMap = extractAliasMap(root);
  // Build reverse alias map: real table => set of aliases
  const reverseAlias = new Map<string, Set<string>>();
  for (const [alias, real] of Array.from(aliasMap.entries())) {
    if (!reverseAlias.has(real)) reverseAlias.set(real, new Set());
    reverseAlias.get(real)!.add(alias);
  }
  const defaultFromRaw = findDefaultFrom(root);

  const refs = collectColumnRefs(root);
  const hasLocInfo = hasAnyLoc(root);

  for (const ref of refs) {
    const tableRaw = ref.table as string | undefined;
    const resolvedTable = tableRaw ? (aliasMap.get(tableRaw) || tableRaw) : defaultFromRaw;
    const colId = resolvedTable ? `${resolvedTable}_${ref.column}` : undefined;

    if (colId) {
      if (hasLocInfo) {
        const r = getNodeRange(ref.node);
        if (r) { push(colId, r); continue; }
      }
      // Fallback: only highlight qualified references for this resolved table
      const aliasSet = reverseAlias.get(resolvedTable || '') || new Set<string>();
      const qualifiers = Array.from(aliasSet);
      if (resolvedTable) qualifiers.push(resolvedTable);
      const ranges = regexRanges(sql, qualifiers, ref.column, true);
      for (const rr of ranges) push(colId, rr);
    }
  }

  // Additionally, highlight output columns for each SELECT block
  const pushOutputColumns = (selectNode: any, outputTable: string) => {
    if (!selectNode?.columns || !Array.isArray(selectNode.columns)) return;
    for (const col of selectNode.columns) {
      if (col?.expr?.type === 'star') continue;
      const outName = col?.as || (col?.expr?.type === 'column_ref' ? col.expr.column : undefined);
      if (!outName) continue;
      const r = getNodeRange(col) || getNodeRange(col?.expr);
      if (!r) continue;
      push(`${outputTable}_${outName}`, r);
    }
  };

  // Root SELECT outputs -> Result
  pushOutputColumns(root, 'Result');

  // CTE outputs
  const withList = Array.isArray(root?.with)
    ? root?.with
    : root?.with?.with && Array.isArray(root?.with?.with)
      ? root?.with?.with
      : [];
  for (const cte of withList) {
    const name = cte?.name?.value;
    if (name && cte?.stmt?.ast) pushOutputColumns(cte.stmt.ast, name);
  }

  // Subquery in FROM outputs -> alias name as table
  const from = Array.isArray(root?.from) ? root.from : [];
  for (const item of from) {
    if (item?.expr?.ast && item?.as) pushOutputColumns(item.expr.ast, item.as);
  }

  if (graph) {
    const valid = new Set(Object.keys(graph.columnNodes));
    for (const k of Object.keys(result)) if (!valid.has(k)) delete result[k];
  }
  return result;
}
