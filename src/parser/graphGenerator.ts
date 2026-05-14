import { Parser } from "node-sql-parser";

interface GraphNode {
    id: string;
    type: string;
    [key: string]: any;
}

interface TableNode {
    id: string;
    type: string;
    data: { tableName: string; columns: { name: string; columnId: string }[] };
    position: { x: number; y: number };
}

interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type: string;
    sourceHandle?: string;
    targetHandle?: string;
    label?: string | null;
}

interface Graph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    tableNodes: { [key: string]: GraphNode };
    columnNodes: { [key: string]: GraphNode };
}

interface Position {
    x: number;
    y: number;
}

interface LayeredNode extends TableNode {
    layer: number;
    column: number;
}


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
  
  // Calculate approximate height for each node based on column count
  function calculateNodeHeight(node: TableNode): number {
    const columnCount = node.data.columns.length;
    return BASE_NODE_HEIGHT + (columnCount * HEIGHT_PER_COLUMN);
  }
  
  // Build adjacency list from table relationships
  const graph: { [id: string]: string[] } = {};
  nodes.forEach(node => {
    graph[node.id] = [];
  });
  
  // Add edges to graph
  edges.forEach(edge => {
    if (graph[edge.source] !== undefined && graph[edge.target] !== undefined) {
      graph[edge.target].push(edge.source);
    }
  });
  
  // Calculate in-degree for each node
  const inDegree: { [id: string]: number } = {};
  nodes.forEach(node => {
    inDegree[node.id] = 0;
  });
  
  Object.keys(graph).forEach(nodeId => {
    graph[nodeId].forEach(neighbor => {
      inDegree[neighbor]++;
    });
  });
  
  // Topological sort using Kahn's algorithm
  const queue: string[] = [];
  const sortedNodes: string[] = [];
  const layerMap: { [id: string]: number } = {};
  
  // Start with nodes having no dependencies
  Object.keys(inDegree).forEach(nodeId => {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
      layerMap[nodeId] = 0;
    }
  });
  console.log("layerGroups queue", queue);
  // Process the queue
  while (queue.length > 0) {
    const current = queue.shift()!;
    sortedNodes.push(current);
    
    graph[current].forEach(neighbor => {
      inDegree[neighbor]--;
      
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
        layerMap[neighbor] = layerMap[current] - 1;
      }
    });
  }
  
  // Handle cycles
  nodes.forEach(node => {
    if (layerMap[node.id] === undefined) {
      const maxLayer = Math.max(...Object.values(layerMap), 0);
      layerMap[node.id] = maxLayer + 1;
      sortedNodes.push(node.id);
    }
  });
  
  // Group nodes by layer
  const layerGroups: { [layer: number]: TableNode[] } = {};
  nodes.forEach(node => {
    const layer = layerMap[node.id];
    if (!layerGroups[layer]) {
      layerGroups[layer] = [];
    }
    layerGroups[layer].push(node);
  });
  console.log("layerGroups", layerGroups);
  // Calculate exact space needed for each layer
  const layerHeights: { [layer: number]: number } = {};
  const layerNodeHeights: { [nodeId: string]: number } = {};
  
  // First pass: calculate height of each node and total height per layer
  Object.entries(layerGroups).forEach(([layer, layerNodes]) => {
    // Sort nodes by column count for better layout
    layerNodes.sort((a, b) => b.data.columns.length - a.data.columns.length);
    
    let totalLayerHeight = 0;
    layerNodes.forEach(node => {
      const nodeHeight = calculateNodeHeight(node);
      layerNodeHeights[node.id] = nodeHeight;
      totalLayerHeight += nodeHeight + VERTICAL_PADDING;
    });
    
    // Remove the last padding
    if (layerNodes.length > 0) {
      totalLayerHeight -= VERTICAL_PADDING;
    }
    
    layerHeights[parseInt(layer)] = totalLayerHeight;
  });
  
  // Find the maximum layer height
  const maxLayerHeight = Math.max(...Object.values(layerHeights), 0);
  
  // Calculate vertical positions, centered around y=0
  const verticalPositions: { [id: string]: number } = {};
  
  Object.entries(layerGroups).forEach(([layer, layerNodes]) => {
    // Start position for this layer (centered around y=0)
    const layerHeight = layerHeights[parseInt(layer)];
    let currentY = -layerHeight / 2;
    
    // Assign positions for each node in this layer
    layerNodes.forEach(node => {
      const nodeHeight = layerNodeHeights[node.id];
      
      // If this is the only node in the layer, center it at y=0
      if (layerNodes.length === 1) {
        verticalPositions[node.id] = 0;
      } else {
        // Position the node at its center point
        verticalPositions[node.id] = currentY;
        // Move to position for next node
        currentY += nodeHeight + VERTICAL_PADDING;
      }
    });
  });

  console.log("layerHeights", layerHeights);
  console.log("layerNodeHeights", layerNodeHeights);
    console.log("verticalPositions", verticalPositions);
  // Update node positions based on their layer and calculated vertical position
  const updatedNodes = nodes.map(node => ({
    ...node,
    position: {
      x: layerMap[node.id] * HORIZONTAL_SPACING,
      y: verticalPositions[node.id]
    }
  }));
  console.log("updatedNodes", updatedNodes);
  return updatedNodes;
}
export function codeToAst(code: string, database : string): any {
    const parser = new Parser();

    let ast;
    try {
    console.log("database", database);
    ast = parser.astify(code, { database: database });
    return ast
    } catch (error) {
    console.error("Failed to parse code:", error);
    return error
    }
    
}

function findAllFromClauses(ast: any): any[] {
    const fromClauses: any[] = [];
    function traverse(node: any) {
        if (!node || typeof node !== 'object') return;

        // Check if the current node has a 'from' property
        if (node.from && Array.isArray(node.from)) {
            fromClauses.push(node.from);
        }

        // Handle arrays
        if (Array.isArray(node)) {
            node.forEach(item => traverse(item));
        }
        // Traverse all other properties
        Object.values(node).forEach(value => {
            if (typeof value === 'object' && value !== null) {
                traverse(value);
            }
        });
    }
    traverse(ast);
    return fromClauses;
}
export function sqlAstToGraph(ast: any, graphID: number = 1): any {
    
    const graph: Graph = {
        nodes: [],
        edges: [],
        tableNodes: {},
        columnNodes: {},
    };

    
    // Keep track of column references for each table
    const tableColumnsMap: { [tableName: string]: Set<string> } = {};
    
    // Helper function to add column to tracking map
    function trackColumnReference(tableName: string, columnName: string): void {
        if (!tableColumnsMap[tableName]) {
            tableColumnsMap[tableName] = new Set<string>();
        }
        tableColumnsMap[tableName].add(columnName);
    }
    
    interface NodeProps {
        [key: string]: any;
    }

    function createNode(id: string, type: string, props: NodeProps): GraphNode {
        if (type === 'table' || type === 'cte') {
            const name = props.name;
            const alias = props.alias;
            // console.log("check for existing node",id,type,props,);
            const existingTableNode = Object.values(graph.tableNodes).find(node => 
              node.id === id 
          );
            // console.log("check for existing node",props,existingTableNode);
            if (existingTableNode) {
                return existingTableNode;
            }
        }
        // console.log("----------------------")
        // If no existing node found, create a new one
        const node: GraphNode = { id, type, ...props };
        graph.nodes.push(node);
        return node;
    }

    function createEdge(source: string, target: string, type: string, sourceHandle?: string, targetHandle?: string, label: string | null = null): GraphEdge {
        const edgeId = `edge_${sourceHandle || source}_to_${targetHandle || target}_${type}`;
        // check if the source and target are the same
        if (source === target && sourceHandle && targetHandle && sourceHandle.substring(7) === targetHandle.substring(7)) {
            return null as any; // Skip self-loop edges
        }

        const edge: GraphEdge = {
            id: edgeId,
            source,
            target,
            type,
            sourceHandle, 
            targetHandle,
            label
        };
        graph.edges.push(edge);
        return edge;
    }

    function processSourceTables(sourceTables: any, currentTableID: string): void {
        // console.log("sourceTables", JSON.stringify(sourceTables));
        sourceTables.forEach((tableItem: any) => {
            const tableName = tableItem.table;
            const tableAlias = tableItem.as;
            const tableId = `table_${tableName}`;
           
            // Create or get the source table node
            const sourceTableNode = createNode(tableId, 'table', {
                name: tableName,
                alias: tableAlias,
                db: tableItem.db
            });
            
            graph.tableNodes[tableAlias || tableName] = sourceTableNode;
            
            // Create edge from source table to target table (CTE or Result)
            createEdge(tableId, currentTableID, 'table_TO_table', 
                      'null', 'null', `${tableAlias || tableName} → ${currentTableID.replace('table_', '')}`);
        });
    }
    // function processColumns(columns: any, tableId: string,tableName:string): void {
    //     columns.forEach((column: any) => {
    //         console.log('column', column);
    //         let ColumnName: string;
    //         let sourceInfo: { table: string; column: string } | null = null;
    //         if (column.expr.type === 'column_ref') {
    //             if (column.as) {
    //                 ColumnName = column.as;
    //             } else {
    //                 ColumnName = column.expr.column;
    //             }
    //             // Check if the table reference is an alias
    //             let sourceTable = column.expr.table;
    //             console.log( 'column sourceTable', sourceTable);
    //             const tableNode = Object.values(graph.tableNodes).find(node => 
    //                 node.alias === sourceTable
    //             );
    //             if (tableNode) {
    //                 sourceTable = tableNode.name; // Use the actual table name instead of alias
    //             }
    //             console.log( 'column sourceTable 2', sourceTable);
    //             sourceInfo = {
    //                 table: sourceTable,
    //                 column: column.expr.column
    //             };
    //             console.log( 'column sourceInfo', sourceInfo);
    //         } else {
    //             // Handle expressions or computed columns
    //             ColumnName = `expr_${Math.random().toString(36).substring(2, 10)}`;
    //         }
            
    //         // Create CTE column node
    //         const ColumnId = `${tableName}_${ColumnName}`;
    //             graph.columnNodes[ColumnId] = createNode(ColumnId, 'column', {
    //             name: ColumnName,
    //             tableId: tableId,
    //             isCteColumn: true
    //         });
            
    //         // If this is a direct column reference, create a relationship
    //         if (sourceInfo && sourceInfo.table) {
    //             const sourceColumnId = `${sourceInfo.table}_${sourceInfo.column}`;
    //             if (!graph.columnNodes[sourceColumnId]) {
    //                 graph.columnNodes[sourceColumnId] = createNode(sourceColumnId, 'column', {
    //                 name: sourceInfo.column,
    //                 tableId: `table_${sourceInfo.table}`
    //                 });
    //             }
    //             // Create edge from source column to CTE column
    //             createEdge(`table_${sourceInfo.table}`, `table_${tableName}`, 'column_mapping', `source-${sourceColumnId}`, `target-${ColumnId}`);
    //         }
    //     });
    // }
    
    function processColumns(columns: any, tableId: string, tableName: string, defaultSourceTable: any = null): void {
    columns.forEach((column: any) => {
        let columnName: string;
        let sourceInfo: { table: string; column: string }[] = [];
        
        // Extract column name from alias or generate one for expressions
        if (column.as) {
            columnName = column.as;
        } else if (column.expr.type === 'column_ref') {
            columnName = column.expr.column;
        } else {
            // For complex expressions without alias, create a descriptive name
            columnName = `expr_${Math.random().toString(36).substring(2, 7)}`;
        }
        
        // Create the column node
        const columnId = `${tableName}_${columnName}`;
        graph.columnNodes[columnId] = createNode(columnId, 'column', {
            name: columnName,
            tableId: tableId,
            isCteColumn: tableId.includes('_cte_') || tableId.includes('table_Result')
        });
        
        // Process different expression types to track source columns
        collectSourceColumns(column.expr, sourceInfo);
        
        // Create edges for all source column references
        sourceInfo.forEach(source => {
            if (source.column) {
                // If source table is missing but we have a default source table, use it
                if (!source.table && defaultSourceTable) {
                    source.table = defaultSourceTable.as || defaultSourceTable.table;
                }
                
                if (source.table) {
                    // Check if the table reference is an alias
                    let sourceTable = source.table;
                    const tableNode = Object.values(graph.tableNodes).find(node => 
                        node.alias === sourceTable
                    );
                    if (tableNode) {
                        sourceTable = tableNode.name;
                    }
                    
                    const sourceColumnId = `${sourceTable}_${source.column}`;
                    // Create source column node if it doesn't exist
                    if (!graph.columnNodes[sourceColumnId]) {
                        graph.columnNodes[sourceColumnId] = createNode(sourceColumnId, 'column', {
                            name: source.column,
                            tableId: `table_${sourceTable}`
                        });
                    }
                    
                    // Create edge from source column to target column
                    createEdge(
                        `table_${sourceTable}`, 
                        tableId, 
                        'column_mapping', 
                        `source-${sourceColumnId}`, 
                        `target-${columnId}`
                    );
                }
            }
        });
    });
    }

// Helper function to recursively collect all source columns from expressions
function collectSourceColumns(expr: any, sourceColumns: { table: string; column: string }[]): void {
    if (!expr) return;
    
    switch (expr.type) {
        case 'column_ref':
            sourceColumns.push({
                table: expr.table,
                column: expr.column
            });
            break;
        
        case 'function':
            // Process function arguments
            if (expr.args && expr.args.value) {
                if (Array.isArray(expr.args.value)) {
                    expr.args.value.forEach((arg: any) => 
                        collectSourceColumns(arg, sourceColumns)
                    );
                } else {
                    collectSourceColumns(expr.args.value, sourceColumns);
                }
            }
            
            // Handle special functions (like OVER clause in window functions)
            if (expr.over) {
                collectSourceColumns(expr.over, sourceColumns);
            }
            break;
        
        case 'binary_expr':
            // Process both sides of the binary expression
            collectSourceColumns(expr.left, sourceColumns);
            collectSourceColumns(expr.right, sourceColumns);
            break;
        
        case 'case':
            // Process CASE expression
            if (expr.expr) {
                collectSourceColumns(expr.expr, sourceColumns);
            }
            
            // Process WHEN/THEN conditions and results
            if (expr.args && Array.isArray(expr.args)) {
                expr.args.forEach((arg: any) => {
                    if (arg.type === 'when') {
                        collectSourceColumns(arg.cond, sourceColumns);
                        collectSourceColumns(arg.result, sourceColumns);
                    } else if (arg.type === 'else') {
                        collectSourceColumns(arg.result, sourceColumns);
                    }
                });
            }
            break;
        
        case 'aggr_func':
            // Handle aggregate functions (SUM, COUNT, etc.)
            if (expr.args && expr.args.expr) {
                collectSourceColumns(expr.args.expr, sourceColumns);
            }
            break;
    }
}
    
    function mergeGraphs(graph1: Graph): void {
        // Create a new result node for the merged graph
        const newResultTableId = 'table_Result';
        const newResultName = 'Result';
        const newResultNode = createNode(newResultTableId, 'table', {
            name: newResultName
        });
        
        graph.tableNodes[newResultName] = newResultNode;
        // console.log('newResultNode', graph1);
        // Find nodes with tableId starting with 'table_Result' in the current graph
        const resultNodesInGraph = graph.nodes.filter(node => 
            node.tableId && 
            typeof node.tableId === 'string' && 
            node.tableId.startsWith('table_Result')
        );
        
        // Create copies of these nodes with newResultTableId
        resultNodesInGraph.forEach(originalNode => {            const nodeId = `${newResultTableId}_${originalNode.name}`
            // console.log('nodeId', nodeId);
            const { id, ...props } = originalNode;
            const nodeCopy = createNode(nodeId, originalNode.type, {
                ...props,
                tableId: newResultTableId  
            });
            // console.log('nodeCopy', nodeCopy);
            // console.log('nodeId', nodeId);
            
            
            // Create edges between original result nodes and the new result node
            createEdge(
                originalNode.tableId, 
                newResultTableId, 
                'column_mapping', 
                `source-${originalNode.id}`, 
                `target-${nodeCopy.id}`, 
                `${originalNode.tableId.replace('table_', '')} → ${newResultName}`
            );
        });
        
        // Find nodes with tableId starting with 'table_Result' in graph1
        const resultNodesInGraph1 = graph1.nodes.filter(node => 
            node.tableId && 
            typeof node.tableId === 'string' && 
            node.tableId.startsWith('table_Result')
        );        // Map these nodes to newResultNode by finding columns with similar names
        resultNodesInGraph1.forEach(originalNode => {
            // Find similar columns in the main result table
            const matchingColumn = graph.nodes.find(node => 
                node.name === originalNode.name && 
                node.tableId === newResultTableId
            );
            
            if (matchingColumn) {
                // If we found a matching column, create an edge from the original node to the existing result node column
                createEdge(
                    originalNode.tableId, 
                    newResultTableId, 
                    'column_mapping', 
                    `source-${originalNode.id}`, 
                    `target-${matchingColumn.id}`, 
                    `${originalNode.tableId.replace('table_', '')} → ${newResultName}`
                );
            } 
        });
        
        // Add all nodes from graph1 to the current graph
        graph1.nodes.forEach(node => {
            // Avoid duplicating nodes that might already exist in the current graph
            if (!graph.nodes.some(existingNode => existingNode.id === node.id)) {
                graph.nodes.push(node);
            }
        });
        
        // Add all edges from graph1 to the current graph
        graph1.edges.forEach(edge => {
            // Avoid duplicating edges that might already exist in the current graph
            if (!graph.edges.some(existingEdge => existingEdge.id === edge.id)) {
                graph.edges.push(edge);
            }
        });
        
        // Add all table nodes from graph1 to the current graph
        Object.entries(graph1.tableNodes).forEach(([key, node]) => {
            if (!graph.tableNodes[key]) {
                graph.tableNodes[key] = node;
            }
        });
        
        // Add all column nodes from graph1 to the current graph
        Object.entries(graph1.columnNodes).forEach(([key, node]) => {
            if (!graph.columnNodes[key]) {
                graph.columnNodes[key] = node;
            }
        });
        // console.log('Merged graph:', graph.tableNodes, graph.nodes,graph.edges);
    }

    function processCTE(CTEs: any): void {
        CTEs.forEach((cte: any) => {
            // Create node for the CTE itself as a virtual table
            const cteId = `table_${cte.name.value}`;
            graph.tableNodes[cte.name.value] = createNode(cteId, 'cte', {
                name: cte.name.value,
                isCTE: true
            });
            // Process source tables within the CTE
            if (cte.stmt && cte.stmt.ast && cte.stmt.ast.from) {
                // console.log("cte.stmt.ast.from", cte.stmt.ast.from);
                processSourceTables(cte.stmt.ast.from, cteId);
            }
            // Process columns within the CTE
            if (cte.stmt && cte.stmt.ast && cte.stmt.ast.columns) {
                const defaultSourceTable = cte.stmt.ast.from && cte.stmt.ast.from.length > 0 
        ? cte.stmt.ast.from[0] 
        : null;
    processColumns(cte.stmt.ast.columns, cteId, cte.name.value, defaultSourceTable);
            }
        });
    }

    // Helper function to find all FROM clauses in the AST
    function findAllFromClauses(ast: any): any[] {
        const fromClauses = [];
        if (ast.from) {
            fromClauses.push(ast.from);
        }
        
        // Check for nested queries
        if (ast._next) {
            fromClauses.push(...findAllFromClauses(ast._next));
        }
        
        return fromClauses;
    }
    
    // Process column references in the WHERE clause
    function processWhereClause(whereClause: any): void {
        if (!whereClause) return;
        
        // Process column references in binary expressions
        if (whereClause.type === 'binary_expr') {
            if (whereClause.left.type === 'column_ref') {
                const columnName = whereClause.left.column;
                const tableName = whereClause.left.table;
                
                // Track this column reference for its table
                if (tableName) {
                    trackColumnReference(tableName, columnName);
                } else {
                    // If no table is specified, check all tables in the FROM clause
                    const fromTables = ast.from?.map((t: any) => t.table) || [];
                    fromTables.forEach((table: string) => {
                        trackColumnReference(table, columnName);
                    });
                }
            }
            
            if (whereClause.right.type === 'column_ref') {
                const columnName = whereClause.right.column;
                const tableName = whereClause.right.table;
                
                // Track this column reference for its table
                if (tableName) {
                    trackColumnReference(tableName, columnName);
                } else {
                    // If no table is specified, check all tables in the FROM clause
                    const fromTables = ast.from?.map((t: any) => t.table) || [];
                    fromTables.forEach((table: string) => {
                        trackColumnReference(table, columnName);
                    });
                }
            }
            
            // Recursively process nested expressions
            if (whereClause.left.type === 'binary_expr') {
                processWhereClause(whereClause.left);
            }
            
            if (whereClause.right.type === 'binary_expr') {
                processWhereClause(whereClause.right);
            }
        }
    }
    
    // Create column nodes for all tracked columns
    function createSourceColumnNodes(): void {
        Object.entries(tableColumnsMap).forEach(([tableName, columns]) => {
            const tableId = `table_${tableName}`;
            
            // Make sure the table node exists
            if (!graph.tableNodes[tableName]) {
                graph.tableNodes[tableName] = createNode(tableId, 'table', {
                    name: tableName,
                    alias: null
                });
            }
            
            // Create column nodes for each tracked column
            columns.forEach(columnName => {
                const columnId = `${tableName}_${columnName}`;
                if (!graph.columnNodes[columnId]) {
                    graph.columnNodes[columnId] = createNode(columnId, 'column', {
                        name: columnName,
                        tableId: tableId
                    });
                }
            });
        });
    }

    // Process other column references in WHERE clause
    // Process source tables
    const allFromClauses = findAllFromClauses(ast);
    // console.log('AllFromClause' + JSON.stringify(allFromClauses));
    
    // Process each FROM clause
    allFromClauses.forEach(fromClause => {
        fromClause.forEach((tableItem: any) => {
            const tableId = `table_${tableItem.table}`;
            if (!graph.tableNodes[tableItem.as || tableItem.table]) {
                graph.tableNodes[tableItem.as || tableItem.table] = createNode(tableId, 'table', {
                    name: tableItem.table,
                    alias: tableItem.as,
                    db: tableItem.db,
                });
            }
        });
    });
    
    // Process CTEs
    if (ast.with && Array.isArray(ast.with)) {
        processCTE(ast.with);
    }

    // Create result table node
    // console.log('ast._next', ast._next);
    // console.log('graphID', graphID);
    const resultTableId = (ast._next=== undefined && graphID === 1) ? 'table_Result' : `table_Result_0${graphID}`;
    const resultName = (ast._next=== undefined && graphID === 1) ? 'Result' : `Result_0${graphID}`;
    graph.tableNodes[resultName] = createNode(resultTableId, 'table', {
        name: resultName,
        setOperation: ast.set_op || null
    });

    // console.log('This is where we are', JSON.stringify(ast));

    
    // Process source tables
    if (ast.from) {
        processSourceTables(ast.from, resultTableId);
    }
    
    // Process columns in SELECT clause
    if (ast.columns) {
        const defaultSourceTable = ast.from && ast.from.length > 0 ? ast.from[0] : null;
        processColumns(ast.columns, resultTableId, resultName, defaultSourceTable);
    }
    
    // Create nodes for all tracked source columns
    createSourceColumnNodes();

    
    if (ast._next) {
        mergeGraphs(sqlAstToGraph(ast._next, graphID + 1));
    }
    console.log('Final graph:', graph.tableNodes, graph.nodes,graph.edges);
    return graph;
}

// Update the getAllTableNodesAsTableNodes function to use the position calculation
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
                        name: colNode.name,
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
    return assignPositionsWithTopologicalSort(nodes, edges);
}

export function getFilteredEdges(graph: Graph): { 
  id: string; 
  source: string; 
  target: string; 
  sourceHandle: string; 
  targetHandle: string; 
}[] {
  console.log('Edges',graph.edges);
  return graph.edges
  .filter(edge => edge.type === 'column_mapping' && edge.sourceHandle && edge.targetHandle)
  .map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle as string,
      targetHandle: edge.targetHandle as string
  }));
}