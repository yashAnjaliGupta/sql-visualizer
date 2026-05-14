export type EdgeType = 'table_TO_table' | 'column_mapping' | 'condition';

export interface GraphNode {
  id: string;
  type: string;
  name?: string;
  tableId?: string;
  [key: string]: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string | null;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  tableNodes: { [key: string]: GraphNode };
  columnNodes: { [key: string]: GraphNode };
}

export interface TableNode {
  id: string;
  type: string;
  data: { tableName: string; columns: { name: string; columnId: string }[] };
  position: { x: number; y: number };
}
