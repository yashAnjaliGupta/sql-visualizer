import { Parser } from "node-sql-parser";

interface GraphNode {
    id: string;
    type: string;
    [key: string]: any;
  }
  
  interface TableNode{
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
export function codeToAst(code: string): any {
    const parser = new Parser();
    const ast = parser.astify(code);
    return ast;
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
export function sqlAstToGraph(ast: any): any {
    const graph: Graph = {
        nodes: [],
        edges: [],
        tableNodes: {},
        columnNodes: {},
    };
    interface NodeProps {
        [key: string]: any;
    }
    function createNode(id: string, type: string, props: NodeProps): GraphNode {
        if (type === 'table' || type === 'cte') {
            const name = props.name;
            const alias = props.alias;
            
            const existingTableNode = Object.values(graph.tableNodes).find(node => 
              node.name === name || 
              (alias && node.alias === alias) ||
              (node.alias && node.alias === name) ||
              (alias && node.name === alias)
          );
            // console.log("check for existing node",props,existingTableNode);
            if (existingTableNode) {
                return existingTableNode;
            }
        }

        // If no existing node found, create a new one
        const node: GraphNode = { id, type, ...props };
        graph.nodes.push(node);
        return node;
    }

    function createEdge(source: string, target: string, type: string,sourceHandle?:string,targetHandle?:string, label: string | null = null): GraphEdge {
        const edgeId = `edge_${sourceHandle}_to_${targetHandle}_${type}`;

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
    function processSourceTables(sourceTables: any,currenTableID:string): void {
        console.log("sourceTables",sourceTables);
        sourceTables.forEach((tableItem: any) => {
            const tableId = `table_${tableItem.as || tableItem.table}`;
            graph.tableNodes[tableItem.as || tableItem.table] = createNode(tableId, 'table', {
            name: tableItem.table,
            alias: tableItem.as,
            db: tableItem.db
            });
            // Create edge from source table to CTE
            createEdge(tableId, currenTableID, 'table_TO_table');
        });
    }
    function processColumns(columns: any, tableId: string,tableName:string): void {
        columns.forEach((column: any) => {
            let ColumnName: string;
            let sourceInfo: { table: string; column: string } | null = null;
            if (column.expr.type === 'column_ref') {
                if (column.as) {
                    ColumnName = column.as;
                } else {
                    ColumnName = column.expr.column;
                }
                // Check if the table reference is an alias
                let sourceTable = column.expr.table;
                const tableNode = Object.values(graph.tableNodes).find(node => 
                    node.alias === sourceTable
                );
                if (tableNode) {
                    sourceTable = tableNode.name; // Use the actual table name instead of alias
                }
                sourceInfo = {
                    table: sourceTable,
                    column: column.expr.column
                };
            } else {
                // Handle expressions or computed columns
                ColumnName = `expr_${Math.random().toString(36).substring(2, 10)}`;
            }
            
            // Create CTE column node
            const ColumnId = `${tableName}_${ColumnName}`;
                graph.columnNodes[ColumnId] = createNode(ColumnId, 'column', {
                name: ColumnName,
                tableId: tableId,
                isCteColumn: true
            });
            
            // If this is a direct column reference, create a relationship
            if (sourceInfo && sourceInfo.table) {
                const sourceColumnId = `${sourceInfo.table}_${sourceInfo.column}`;
                if (!graph.columnNodes[sourceColumnId]) {
                    graph.columnNodes[sourceColumnId] = createNode(sourceColumnId, 'column', {
                    name: sourceInfo.column,
                    tableId: `table_${sourceInfo.table}`
                    });
                }
                // Create edge from source column to CTE column
                createEdge(`table_${sourceInfo.table}`, `table_${tableName}`, 'column_mapping', `source-${sourceColumnId}`, `target-${ColumnId}`);
            }
        });
    }
    function processCTE(CTEs:any): void {
        CTEs.forEach((cte: any) => {
            // Create node for the CTE itself as a virtual table
            const cteId = `table_${cte.name.value}`;
            graph.tableNodes[cte.name.value] = createNode(cteId, 'cte', {
              name: cte.name.value,
              isCTE: true
            });
            // Process source tables within the CTE
            if (cte.stmt && cte.stmt.ast && cte.stmt.ast.from) {
                console.log("cte.stmt.ast.from",cte.stmt.ast.from);
                processSourceTables(cte.stmt.ast.from,cteId);
            }
            // Process columns within the CTE
            if (cte.stmt && cte.stmt.ast && cte.stmt.ast.columns) {
                processColumns(cte.stmt.ast.columns, cteId,cte.name.value);
            }
        })   
    }
    // Process source tables
    const allFromClauses = findAllFromClauses(ast);
    // Process each FROM clause
    allFromClauses.forEach(fromClause => {
        fromClause.forEach((tableItem: any) => {
            const tableId = `table_${tableItem.table}`;
            if (!graph.tableNodes[tableItem.table]) {
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
    const resultTableId = 'table_Result';
    graph.tableNodes['Result'] = createNode(resultTableId, 'table', {
        name: 'Result'
    });
    processSourceTables(ast.from,resultTableId);
    if(ast.columns){
        processColumns(ast.columns, resultTableId,'Result');
    }
    return graph
}
export function getAllTableNodesAsTableNodes(graph: Graph): TableNode[] {
  console.log('graph node',graph.nodes);
  return Object.values(graph.tableNodes).map((node) => ({
    id: node.id,
    type: 'customTable',
    data: {
      tableName: node.name || '', // assuming table name is stored in node.name
      columns: Object.values(graph.nodes)
        .filter(colNode => colNode.tableId === node.id)
        .map(colNode => ({
          name: colNode.name,
          columnId: colNode.id
        }))
    },
    position: { x: 0, y: 0 } // assuming all nodes are at the same position
  }));
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