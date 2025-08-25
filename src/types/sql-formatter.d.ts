declare module 'sql-formatter' {
  export interface FormatOptions {
    language?: string;
    keywordCase?: 'upper' | 'lower' | 'preserve';
    linesBetweenQueries?: number;
    indentStyle?: 'standard' | 'tabularLeft' | 'tabularRight';
    [key: string]: any;
  }
  export function format(sql: string, options?: FormatOptions): string;
}
