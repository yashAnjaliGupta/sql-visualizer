// Extracts structured schema info from CREATE TABLE ASTs (node-sql-parser)

export interface ColumnDef {
  name: string;
  dataType: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  autoIncrement: boolean;
  defaultValue?: string;
  /** Inline REFERENCES clause */
  foreignKey?: { refTable: string; refColumn: string };
}

export interface ForeignKeyDef {
  column: string;
  refTable: string;
  refColumn: string;
}

export interface CreateTableDef {
  tableName: string;
  schema?: string;
  columns: ColumnDef[];
  /** All PK column names (from inline + standalone PRIMARY KEY constraint) */
  primaryKeys: string[];
  /** All FK relationships (from inline REFERENCES + standalone FOREIGN KEY) */
  foreignKeys: ForeignKeyDef[];
  /** Standalone UNIQUE key groups */
  uniqueKeys: string[][];
}

// ── helpers ────────────────────────────────────────────────────────────────

function colName(col: any): string {
  if (!col) return '';
  if (typeof col === 'string') return col;
  // column_ref node from node-sql-parser
  if (col.type === 'column_ref') return String(col.column ?? '');
  // column definition wrapper  { column: { expr: { type: 'column_ref', column: '...' } } }
  if (col.column) return colName(col.column);
  if (col.expr) return colName(col.expr);
  if (col.value !== undefined) return String(col.value);
  return '';
}

function dataType(def: any): string {
  if (!def) return '';
  const base = (def.dataType || '').toUpperCase();
  if (!base) return '';
  if (def.length !== undefined && def.length !== null) {
    return def.scale !== undefined && def.scale !== null
      ? `${base}(${def.length},${def.scale})`
      : `${base}(${def.length})`;
  }
  return base;
}

function resolveFunctionName(nameNode: any): string {
  if (!nameNode) return 'fn';
  if (typeof nameNode === 'string') return nameNode;
  // {name: [{type:'origin', value:'CURRENT_TIMESTAMP'}, ...]}
  if (nameNode.name && Array.isArray(nameNode.name)) {
    return nameNode.name.map((p: any) => p.value ?? String(p)).join('.');
  }
  if (Array.isArray(nameNode)) {
    return nameNode.map((p: any) => p.value ?? String(p)).join('.');
  }
  if (nameNode.value) return String(nameNode.value);
  return String(nameNode);
}

function defaultVal(d: any): string | undefined {
  if (d === undefined || d === null) return undefined;
  // d is the default_val node: { type:'default', value: <actual_value_node> }
  const v = (d.type === 'default' || d.type === 'keyword') ? d.value : (d.value ?? d);
  if (v === null || v === undefined) return undefined;
  if (typeof v !== 'object') return String(v);

  // Function: {type:'function', name: {name:[{type:'origin', value:'CURRENT_TIMESTAMP'}]}}
  if (v.type === 'function') return `${resolveFunctionName(v.name)}()`;
  // Keyword / origin literal
  if (v.type === 'origin' || v.type === 'keyword') return String(v.value ?? '');
  if (typeof v.value !== 'undefined' && typeof v.value !== 'object') return String(v.value);
  return undefined; // suppress [object Object]
}

function refTableCol(ref: any): { refTable: string; refColumn: string } {
  const tbl = Array.isArray(ref.table) ? ref.table[0] : ref.table;
  const refTable = tbl?.table || tbl?.name || String(tbl || '');
  const defCols = ref.definition || [];
  const refColumn = defCols.length ? colName(defCols[0]) : '';
  return { refTable, refColumn };
}

// ── main extractor ─────────────────────────────────────────────────────────

export function extractCreateTable(ast: any): CreateTableDef | null {
  if (ast?.type !== 'create' || ast?.keyword !== 'table') return null;

  const tblArr = Array.isArray(ast.table) ? ast.table : [ast.table];
  const tblInfo = tblArr[0] ?? {};
  const tableName: string = tblInfo.table || tblInfo.name || 'unknown';
  const schema: string | undefined = tblInfo.db || tblInfo.schema || undefined;

  const columns: ColumnDef[] = [];
  const primaryKeys: string[] = [];
  const foreignKeys: ForeignKeyDef[] = [];
  const uniqueKeys: string[][] = [];

  const defs: any[] = ast.create_definitions || [];

  for (const d of defs) {
    const resource = (d.resource || '').toLowerCase();

    // ── standalone constraint / index ──────────────────────────────────────
    if (resource === 'constraint' || resource === 'index') {
      const ct = (d.constraint_type || '').toLowerCase();
      const defCols: string[] = (d.definition || []).map(colName);

      if (ct.includes('primary')) {
        defCols.forEach(c => { if (c && !primaryKeys.includes(c)) primaryKeys.push(c); });
      } else if (ct.includes('unique')) {
        if (defCols.length) uniqueKeys.push(defCols);
      } else if (ct.includes('foreign')) {
        if (defCols.length && d.reference_definition) {
          const { refTable, refColumn } = refTableCol(d.reference_definition);
          foreignKeys.push({ column: defCols[0], refTable, refColumn });
        }
      }
      continue;
    }

    // ── column definition ──────────────────────────────────────────────────
    const name = colName(d.column);
    if (!name) continue;

    const type = dataType(d.definition);
    const nullable = !String(d.nullable?.value ?? '').toLowerCase().includes('not null');
    const isPK = !!(d.primary_key || String(d.unique_or_primary ?? '').toLowerCase().includes('primary'));
    const isUnique = !!(d.unique || String(d.unique_or_primary ?? '').toLowerCase() === 'unique');
    const autoIncrement = !!(d.auto_increment || d.auto_increment_value);
    const defValue = defaultVal(d.default_val);

    let fk: ColumnDef['foreignKey'] | undefined;
    if (d.reference_definition) {
      const { refTable, refColumn } = refTableCol(d.reference_definition);
      fk = { refTable, refColumn };
      foreignKeys.push({ column: name, refTable, refColumn });
    }

    if (isPK && !primaryKeys.includes(name)) primaryKeys.push(name);

    columns.push({
      name,
      dataType: type,
      nullable,
      primaryKey: isPK,
      unique: isUnique,
      autoIncrement,
      defaultValue: defValue,
      foreignKey: fk,
    });
  }

  // Mark columns that appear in standalone PK / FK / UNIQUE constraints
  columns.forEach(col => {
    if (primaryKeys.includes(col.name)) col.primaryKey = true;
    const fkDef = foreignKeys.find(f => f.column === col.name);
    if (fkDef && !col.foreignKey) {
      col.foreignKey = { refTable: fkDef.refTable, refColumn: fkDef.refColumn };
    }
    for (const uk of uniqueKeys) {
      if (uk.length === 1 && uk[0] === col.name) col.unique = true;
    }
  });

  return { tableName, schema, columns, primaryKeys, foreignKeys, uniqueKeys };
}

export function extractAllCreateTables(asts: any[]): CreateTableDef[] {
  return asts
    .filter(a => a?.type === 'create' && a?.keyword === 'table')
    .map(extractCreateTable)
    .filter((t): t is CreateTableDef => t !== null);
}
