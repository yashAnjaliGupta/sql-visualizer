import { Graph, GraphEdge, GraphNode } from '../types';

export class GraphBuilder {
  private nodes = new Map<string, GraphNode>();
  private edges = new Set<string>();
  private graph: Graph = { nodes: [], edges: [], tableNodes: {}, columnNodes: {} };

  ensureTable(name: string, kind: 'table'|'cte'|'union'|'temp' = 'table', extra?: any): string {
    const id = `table_${name}`;
    if (!this.nodes.has(id)) {
      const node: GraphNode = { id, type: kind === 'cte' ? 'cte' : 'table', name, ...extra };
      this.nodes.set(id, node);
      this.graph.nodes.push(node);
      this.graph.tableNodes[name] = node;
    }
    return id;
  }

  ensureColumn(tableName: string, column: string): string {
    const id = `${tableName}_${column}`;
    if (!this.nodes.has(id)) {
      const node: GraphNode = { id, type: 'column', name: column, tableId: `table_${tableName}` };
      this.nodes.set(id, node);
      this.graph.nodes.push(node);
      this.graph.columnNodes[id] = node;
    }
    return id;
  }

  linkTables(sourceId: string, targetId: string, type: GraphEdge['type'] = 'table_TO_table', label?: string) {
    if (type === 'table_TO_table' && sourceId === targetId) return;
    const edgeId = `edge_${sourceId}_to_${targetId}_${type}`;
    if (this.edges.has(edgeId)) return;
    this.graph.edges.push({ id: edgeId, source: sourceId, target: targetId, type, label });
    this.edges.add(edgeId);
  }

  linkColumns(srcTable: string, srcCol: string, dstTableId: string, dstColName: string, type: 'column_mapping'|'condition' = 'column_mapping') {
    const sourceHandle = `source-${srcTable}_${srcCol}`;
    const targetHandle = `target-${dstTableId.replace('table_', '')}_${dstColName}`;
    const edgeId = `edge_${sourceHandle}_to_${targetHandle}_${type}`;
    if (this.edges.has(edgeId)) return;
    this.graph.edges.push({ id: edgeId, source: `table_${srcTable}`, target: dstTableId, type, sourceHandle, targetHandle });
    this.edges.add(edgeId);
  }

  getGraph(): Graph { return this.graph; }
}
