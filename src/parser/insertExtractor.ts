// Extracts structured data from INSERT INTO (and REPLACE INTO) ASTs

export interface InsertDef {
  tableName: string;
  schema?: string;
  /** Column names from the column list; empty if not specified */
  columns: string[];
  /** Rows of display-ready values */
  rows: (string | number | boolean | null)[][];
  /** True when the insert source is a SELECT, not a VALUES list */
  fromSelect: boolean;
}

// ── helpers ────────────────────────────────────────────────────────────────

function displayValue(val: any): string | number | boolean | null {
  if (val === null || val === undefined) return null;
  switch (val.type) {
    case 'null':
      return null;
    case 'number':
      return val.value;
    case 'bool':
      return val.value === true || String(val.value).toLowerCase() === 'true';
    case 'single_quote_string':
    case 'double_quote_string':
    case 'string':
      return `'${val.value}'`;
    case 'column_ref':
      return val.table ? `${val.table}.${val.column}` : String(val.column);
    case 'function':
    case 'aggr_func': {
      const fname = val.name || val.aggr_func || 'fn';
      return `${fname}(…)`;
    }
    case 'binary_expr':
      return `${displayValue(val.left)} ${val.operator} ${displayValue(val.right)}`;
    default:
      if (val.value !== undefined) return val.value;
      return '…';
  }
}

// ── main extractor ─────────────────────────────────────────────────────────

export function extractInsert(ast: any): InsertDef | null {
  if (ast?.type !== 'insert' && ast?.type !== 'replace') return null;

  const tblArr = Array.isArray(ast.table) ? ast.table : [ast.table];
  const tblInfo = tblArr[0] ?? {};
  const tableName: string = tblInfo.table || tblInfo.name || 'unknown';
  const schema: string | undefined = tblInfo.db || tblInfo.schema || undefined;

  const columns: string[] = Array.isArray(ast.columns)
    ? ast.columns.map((c: any) => (typeof c === 'string' ? c : c?.column ?? String(c)))
    : [];

  const fromSelect = !!ast.select || (ast.values === undefined && ast.rows === undefined);

  const rows: (string | number | boolean | null)[][] = [];

  // node-sql-parser actual shape for MySQL: ast.values = { type:'values', values:[...expr_list...] }
  // or for some DB types: ast.values = [{type:'expr_list', value:[...]}, ...]
  let rawValueSets: any[] = [];
  const rawValues = ast.values ?? ast.rows;
  if (Array.isArray(rawValues)) {
    // Old shape: direct array of expr_list rows
    rawValueSets = rawValues;
  } else if (rawValues && typeof rawValues === 'object') {
    // MySQL shape: { type: 'values', values: [...] }
    if (Array.isArray(rawValues.values)) rawValueSets = rawValues.values;
    // Alternative wrapper shape: { type: 'values', value: [...] }
    else if (Array.isArray(rawValues.value)) rawValueSets = rawValues.value;
  }

  for (const rowSet of rawValueSets) {
    // Each rowSet is {type:'expr_list', value:[...]} or a plain array
    const vals: any[] = Array.isArray(rowSet) ? rowSet : (rowSet?.value ?? []);
    rows.push(Array.isArray(vals) ? vals.map(displayValue) : []);
  }

  return { tableName, schema, columns, rows, fromSelect };
}

export function extractAllInserts(asts: any[]): InsertDef[] {
  return asts
    .filter(a => a?.type === 'insert' || a?.type === 'replace')
    .map(extractInsert)
    .filter((i): i is InsertDef => i !== null);
}
