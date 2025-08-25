import { Parser } from "node-sql-parser";
import { Graph, TableNode } from './types';
import { astToGraph } from './astWalker';

function assignPositionsWithTopologicalSort(
  nodes: TableNode[], 
  edges: { 
    id: string; 
    source: string; 
    target: string; 
    sourceHandle: string; 
    targetHandle: string; 
  }[]
): TableNode[] {
  const HORIZONTAL_SPACING = 400;
  const BASE_NODE_HEIGHT = 50;
  const HEIGHT_PER_COLUMN = 30;
  const VERTICAL_PADDING = 70;
  
  const calculateNodeHeight = (node: TableNode): number => {
    return BASE_NODE_HEIGHT + (node.data.columns.length * HEIGHT_PER_COLUMN);
  };
  
  const graph: { [id: string]: string[] } = {};
  const inDegree: { [id: string]: number } = {};
  
  nodes.forEach(node => {
    graph[node.id] = [];
    inDegree[node.id] = 0;
  });
  
  edges.forEach(edge => {
    if (graph[edge.source] !== undefined && graph[edge.target] !== undefined) {
      graph[edge.target].push(edge.source);
      inDegree[edge.source]++;
    }
  });
  
  const queue: string[] = [];
  const layerMap: { [id: string]: number } = {};
  
  Object.keys(inDegree).forEach(nodeId => {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
      layerMap[nodeId] = 0;
    }
  });
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    graph[current].forEach(neighbor => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
        layerMap[neighbor] = layerMap[current] - 1;
      }
    });
  }
  
  nodes.forEach(node => {
    if (layerMap[node.id] === undefined) {
      const maxLayer = Math.max(...Object.values(layerMap), 0);
      layerMap[node.id] = maxLayer + 1;
    }
  });
  
  const layerGroups: { [layer: number]: TableNode[] } = {};
  nodes.forEach(node => {
    const layer = layerMap[node.id];
    if (!layerGroups[layer]) {
      layerGroups[layer] = [];
    }
    layerGroups[layer].push(node);
  });
  
  const layerHeights: { [layer: number]: number } = {};
  const layerNodeHeights: { [nodeId: string]: number } = {};
  const verticalPositions: { [id: string]: number } = {};
  
  Object.entries(layerGroups).forEach(([layer, layerNodes]) => {
    layerNodes.sort((a, b) => b.data.columns.length - a.data.columns.length);
    let totalLayerHeight = 0;
    const layerIndex = parseInt(layer);
    layerNodes.forEach(node => {
      const nodeHeight = calculateNodeHeight(node);
      layerNodeHeights[node.id] = nodeHeight;
      totalLayerHeight += nodeHeight + VERTICAL_PADDING;
    });
    if (layerNodes.length > 0) {
      totalLayerHeight -= VERTICAL_PADDING;
    }
    layerHeights[layerIndex] = totalLayerHeight;
    if (layerNodes.length === 1) {
      verticalPositions[layerNodes[0].id] = 0;
    } else {
      let currentY = -totalLayerHeight / 2;
      layerNodes.forEach(node => {
        verticalPositions[node.id] = currentY;
        currentY += layerNodeHeights[node.id] + VERTICAL_PADDING;
      });
    }
  });
  
  return nodes.map(node => ({
    ...node,
    position: {
      x: layerMap[node.id] * HORIZONTAL_SPACING,
      y: verticalPositions[node.id]
    }
  }));
}

// Normalize common database identifiers to the exact strings expected by node-sql-parser
function normalizeDatabaseName(db?: string): string | undefined {
  if (!db) return undefined;
  const key = db.trim().toLowerCase();
  const map: { [k: string]: string } = {
    // MySQL family
    mysql: 'MySQL',
    mariadb: 'MariaDB',
    // Postgres
    postgres: 'PostgresQL',
    postgresql: 'PostgresQL',
    'postgresql (pgsql)': 'PostgresQL',
    pg: 'PostgresQL',
    // SQLite
    sqlite: 'Sqlite',
    // Redshift
    redshift: 'Redshift',
    // Microsoft / T-SQL
    mssql: 'TransactSQL',
    sqlserver: 'TransactSQL',
    tsql: 'TransactSQL',
    transactsql: 'TransactSQL',
    // Others
    hive: 'Hive',
    db2: 'DB2',
    bigquery: 'BigQuery',
    athena: 'Athena',
    flink: 'FlinkSQL',
    flinksql: 'FlinkSQL',
    snowflake: 'Snowflake',
    noql: 'Noql',
  };
  // Allow exact expected values as-is
  const allowed = new Set([
    'MySQL','MariaDB','PostgresQL','Sqlite','Redshift','TransactSQL','Hive','DB2','BigQuery','Athena','FlinkSQL','Snowflake','Noql'
  ]);
  const normalized = map[key];
  if (normalized) return normalized;
  if (allowed.has(db)) return db;
  // Unknown or unsupported (e.g., Oracle) => do not pass database option
  return undefined;
}

export function codeToAst(code: string, database: string): any {
  const parser = new Parser();
  try {
    const normalizedDb = normalizeDatabaseName(database);
    const options: any = {
      ...(normalizedDb ? { database: normalizedDb } : {}),
      parseOptions: { includeLocations: true },
    };
    const ast = parser.astify(code, options);
    console.log('LOC', ast);
    return ast;
  } catch (error) {
    return error;
  }
}

export function sqlAstToGraph(ast: any, graphID: number = 1): Graph {
  const rootAst = Array.isArray(ast) ? ast[0] : ast;
  return astToGraph(rootAst);
}
export function getAllTableNodesAsTableNodes(graph: Graph): TableNode[] {
    // Use a Map to track unique table nodes by ID
    const uniqueNodes = new Map<string, TableNode>();
    
    // Process all table nodes and keep only unique ones
    Object.values(graph.tableNodes).forEach((node) => {
        // Skip if we already have this node
        if (uniqueNodes.has(node.id)) return;
        
        // Create a new TableNode and add it to our unique nodes
        uniqueNodes.set(node.id, {
            id: node.id,
            type: 'customTable',
            data: {
                tableName: node.name || '',
        columns: Object.values(graph.nodes)
          .filter(colNode => colNode.tableId === node.id)
          .map(colNode => ({
            name: (colNode.name as string) || '',
            columnId: colNode.id
          }))
            },
            position: { x: 0, y: 0 }
        });
    });

    // Convert the map values to an array
    const nodes = Array.from(uniqueNodes.values());
    
    // Calculate positions
    const edges = getFilteredEdges(graph);
    console.log('Filtered nodes:', nodes);
    console.log('Filtered edges:', edges);
    return assignPositionsWithTopologicalSort(nodes, edges);
}
export function getFilteredEdges(graph: Graph): { 
  id: string; 
  source: string; 
  target: string; 
  sourceHandle: string; 
  targetHandle: string; 
}[] {
  return graph.edges
    .filter(edge => 
      edge.type === 'column_mapping' && 
      edge.sourceHandle && 
      edge.targetHandle
    )
    .map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle as string,
      targetHandle: edge.targetHandle as string
    }));
}