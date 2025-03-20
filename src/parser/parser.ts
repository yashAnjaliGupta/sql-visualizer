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
  sourceHandle: string;
  targetHandle: string;
  label?: string | null;
}

interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  tableNodes: { [key: string]: GraphNode };
  columnNodes: { [key: string]: GraphNode };
}

export function codeToAst(code: string): string {
    const parser = new Parser();
    const ast = parser.astify(code);
    return JSON.stringify(ast, null, 2);
}



export function sqlAstToGraph(ast: any): Graph {  // Changed signature for TypeScript
  // Convert JSON string to object if needed
  if (typeof ast === 'string') {
    ast = JSON.parse(ast);
  }
  
  const graph: Graph = {
    nodes: [],
    edges: [],
    tableNodes: {},
    columnNodes: {}
  };
  
  // Helper to create and track nodes
  interface NodeProps {
    [key: string]: any;
  }

  function createNode(id: string, type: string, props: NodeProps): GraphNode {
    const node: GraphNode = { id, type, ...props };
    graph.nodes.push(node);
    return node;
  }
  
  // Helper to create edges
  interface EdgeProps {
      source: string;
      target: string;
      type: string;
      label?: string | null;
      sourceHandle:string,
      targetHandle:string
  }

  function createEdge(source: string, target: string, type: string,sourceHandle:string,targetHandle:string, label: string | null = null): GraphEdge {
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
  
  // Track CTE aliases for later reference
  const cteAliases = new Map();
  // Process CTEs if they exist
  if (ast.with && Array.isArray(ast.with)) {
  ast.with.forEach((cte: any) => {
    // Create node for the CTE itself as a virtual table
    const cteId = `table_${cte.name.value}`;
    graph.tableNodes[cte.name.value] = createNode(cteId, 'cte', {
      name: cte.name.value,
      isCTE: true
    });
    
    // Process source tables within the CTE
    if (cte.stmt && cte.stmt.ast && cte.stmt.ast.from) {
      cte.stmt.ast.from.forEach((tableItem: any) => {
      const tableId = `table_${tableItem.as || tableItem.table}`;
      graph.tableNodes[tableItem.as || tableItem.table] = createNode(tableId, 'table', {
        name: tableItem.table,
        alias: tableItem.as,
        db: tableItem.db
      });
      
      // Create edge from source table to CTE
      // createEdge(tableId, cteId, 'source_for_cte', 'source_handle', 'target_handle');
      });
    }
    
    // Process columns within the CTE
    if (cte.stmt && cte.stmt.ast && cte.stmt.ast.columns) {
      cte.stmt.ast.columns.forEach((column: any) => {
      let cteColumnName: string;
      let sourceInfo: { table: string; column: string } | null = null;
      
      if (column.as) {
        cteColumnName = column.as;
      } else if (column.expr.type === 'column_ref') {
        cteColumnName = column.expr.column;
        sourceInfo = {
          table: column.expr.table,
          column: column.expr.column
        };
      } else {
        // Handle expressions or computed columns
        cteColumnName = `expr_${Math.random().toString(36).substring(2, 10)}`;
      }
      
      // Create CTE column node
      const cteColumnId = `${cte.name.value}_${cteColumnName}`;
      graph.columnNodes[cteColumnId] = createNode(cteColumnId, 'column', {
        name: cteColumnName,
        tableId: cteId,
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
        createEdge(`table_${sourceInfo.table}`, `table_${cte.name.value}`, 'column_mapping', `source-${sourceColumnId}`, `target-${cteColumnId}`);
      }
      });
    }
  });
    
    // Track CTE aliases in the main query FROM clause
  ast.from.forEach((tableItem: any) => {
    if (ast.with.some((cte: any) => cte.name.value === tableItem.table)) {
      cteAliases.set(tableItem.as || tableItem.table, tableItem.table);
    }
  });
  }
  // console.log(typeof ast);
  console.log(ast);
  // console.log(ast.from);
  // Create source table nodes for the main query
  ast.from.forEach((tableItem: any) => {
    const tableId = `table_${tableItem.as || tableItem.table}`;
    if (!graph.tableNodes[tableItem.as || tableItem.table]) {
      graph.tableNodes[tableItem.as || tableItem.table] = createNode(tableId, 'table', {
        name: tableItem.table,
        alias: tableItem.as,
        db: tableItem.db
      });
    }
  });
  
  // Create result table node
  const resultTableId = 'table_Result';
  graph.tableNodes['Result'] = createNode(resultTableId, 'table', {
    name: 'Result'
  });
  
  // Process selected columns and create result column nodes
  ast.columns.forEach((column: { as: any; expr: { type: string; column: any; table: any; }; }) => {
    let resultColumnName;
    if (column.as) {
      resultColumnName = column.as;
    } else if (column.expr.type === 'column_ref') {
      resultColumnName = column.expr.column;
    } else {
      // For expressions like CASE statements
      resultColumnName = `expr_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Create result column node
    const resultColumnId = `Result_${resultColumnName}`;
    const resultColumnNode = createNode(resultColumnId, 'column', {
      name: resultColumnName,
      tableId: resultTableId
    });
    
    // Process column expressions
    if (column.expr.type === 'column_ref') {
      const sourceTableAlias = column.expr.table;
      const sourceColumnName = column.expr.column;
      
      // Check if this column references a CTE (directly or through alias)
      const cteName = cteAliases.get(sourceTableAlias);
      const isCteReference = cteName !== undefined;
      
      // Create source column node
      const sourceColumnId = `${sourceTableAlias}_${sourceColumnName}`;
      const sourceNode = createNode(sourceColumnId, 'column', {
        name: sourceColumnName,
        tableId: `table_${sourceTableAlias}`,
        isCteColumn: isCteReference
      });
      
      // Create edge from source column to result column
      createEdge(`table_${sourceTableAlias}`, 'table_Result', 'column_mapping', `source-${sourceColumnId}`, `target-${resultColumnId}`, 'used_in_select');
      
      // If this is a CTE reference, also create edge from CTE column to this column
      if (isCteReference) {
        const cteColumnId = `${cteName}_${sourceColumnName}`;
        if (graph.columnNodes[cteColumnId]) {
          createEdge(`table_${cteName}`, `table_${sourceTableAlias}`, 'cte_reference', `source-${cteColumnId}`,  `target-${sourceColumnId}`, 'referenced_from_main_query');
        }
      }
    } else if (column.expr.type === 'case') {
      // Handle CASE expressions - extract column references
      extractColumnRefsFromExpr(column.expr, resultColumnId);
    }
  });
  
  // Helper to extract column references from expressions (like CASE)
  function extractColumnRefsFromExpr(expr: any, resultColumnId: string) {
    function traverse(node: { type: string; table: any; column: any; left: any; right: any; args: any[]; }) {
      if (!node) return;
      
      if (node.type === 'column_ref') {
        const tableAlias = node.table;
        const columnName = node.column;
        
        // Check if this is a CTE reference
        const cteName = cteAliases.get(tableAlias);
        const isCteReference = cteName !== undefined;
        
        // Create column node if it doesn't exist
        const columnId = `${tableAlias}_${columnName}`;
        createNode(columnId, 'column', {
          name: columnName,
          tableId: `table_${tableAlias}`,
          isCteColumn: isCteReference
        });
        
        // Create edge to result column
        createEdge(columnId, resultColumnId, 'used_in_expr', 'source_handle', 'target_handle', 'used_in_case');
        
        // If this is a CTE reference, create edge from CTE column to this column
        if (isCteReference) {
          const cteColumnId = `${cteName}_${columnName}`;
          if (graph.columnNodes[cteColumnId]) {
            createEdge(cteColumnId, columnId, 'cte_reference', 'source_handle', 'target_handle', 'referenced_in_expression');
          }
        }
      } else if (node.type === 'binary_expr') {
        traverse(node.left);
        traverse(node.right);
      } else if (node.args && Array.isArray(node.args)) {
        node.args.forEach((arg: { cond: any; result: any; }) => {
          if (arg.cond) traverse(arg.cond);
          if (arg.result) traverse(arg.result);
        });
      }
    }
    
    traverse(expr);
  }
  
  // Extract join conditions as edges
  ast.from.forEach((tableItem: { join: any; on: any; }, index: number) => {
    if (index === 0) return; // Skip the first table (no join)
    
    if (tableItem.join && tableItem.on) {
      // Extract join condition as a string
      const joinConditionLabel = formatJoinCondition(tableItem.join, tableItem.on);
      
      // Find the columns involved in joins
      extractJoinColumns(tableItem.on, joinConditionLabel);
    }
  });
  
  // Extract column relationships from join conditions
  function extractJoinColumns(joinCondition: any, joinLabel: string) {
    function traverse(node: { type: string; operator?: string; left?: { type: string; table: any; column: any; }; right?: { type: string; table: any; column: any; }; }) {
      if (!node) return;
      
      if (node.type === 'binary_expr') {
        if (node.operator === '=') {
          // Check if both sides are column references
          if (node.left && node.right && node.left.type === 'column_ref' && node.right.type === 'column_ref') {
            const leftTable = node.left.table;
            const leftColumn = node.left.column;
            const rightTable = node.right.table;
            const rightColumn = node.right.column;
            
            // Check if either side references a CTE
            const leftCteName = cteAliases.get(leftTable);
            const rightCteName = cteAliases.get(rightTable);
            
            // Create column nodes if they don't exist
            const leftColumnId = `${leftTable}_${leftColumn}`;
            createNode(leftColumnId, 'column', {
              name: leftColumn,
              tableId: `table_${leftTable}`,
              isCteColumn: leftCteName !== undefined
            });
            
            const rightColumnId = `${rightTable}_${rightColumn}`;
            createNode(rightColumnId, 'column', {
              name: rightColumn,
              tableId: `table_${rightTable}`,
              isCteColumn: rightCteName !== undefined
            });
            
            // Create join edge
            createEdge(leftColumnId, rightColumnId, 'join', 'source_handle', 'target_handle', joinLabel);
            
            // If left side is CTE reference, create edge
            if (leftCteName) {
              const cteColumnId = `${leftCteName}_${leftColumn}`;
              if (graph.columnNodes[cteColumnId]) {
                createEdge(cteColumnId, leftColumnId, 'cte_reference', 'source_handle', 'target_handle', 'referenced_in_join');
              }
            }
            
            // If right side is CTE reference, create edge
            if (rightCteName) {
              const cteColumnId = `${rightCteName}_${rightColumn}`;
              if (graph.columnNodes[cteColumnId]) {
                createEdge(cteColumnId, rightColumnId, 'cte_reference', 'source_handle', 'target_handle', 'referenced_in_join');
              }
            }
          }
        } else if (node.operator === 'AND' || node.operator === 'OR') {
          if (node.left) traverse(node.left);
          if (node.right) traverse(node.right);
        }
      }
    }
    
    traverse(joinCondition);
  }
  
  return graph;
}

// Extract the main equality comparison for the join
function extractJoinColumns(joinCondition: any) {
  const result = {
    leftTable: null,
    leftColumn: null,
    rightTable: null,
    rightColumn: null
  };
  
  // Helper function to traverse the join condition tree
  function findEqualityCondition(node: { type: string; operator?: string; left?: { type: string; table: null; column: null; }; right?: { type: string; table: null; column: null; }; }): boolean {
    if (!node) return false;
    
    if (node.type === 'binary_expr') {
      if (node.operator === '=') {
        // Found an equality operator - check if it's between two columns
        if (node.left && node.right && node.left.type === 'column_ref' && node.right.type === 'column_ref') {
          result.leftTable = node.left.table;
          result.leftColumn = node.left.column;
          result.rightTable = node.right.table;
          result.rightColumn = node.right.column;
          return true;
        }
      } else if (node.operator === 'AND' || node.operator === 'OR') {
        // Search in left and right branches
        return (node.left ? findEqualityCondition(node.left) : false) || (node.right ? findEqualityCondition(node.right) : false);
      }
    }
    return false;
  }
  
  findEqualityCondition(joinCondition);
  return result;
}

// Format join condition as a readable string
function formatJoinCondition(joinType: string, joinCondition: any) {
  let result = joinType || '';
  
  // Helper function to stringify the join condition
  function stringifyCondition(node: { type: string; operator?: string; left?: { type: string; table: any; column: any; }; right?: { type: string; table: any; column: any; value?: any; }; }): string {
    if (!node) return '';
    
    if (node.type === 'binary_expr') {
      if (node.operator === 'AND' || node.operator === 'OR') {
        return `${node.left ? stringifyCondition(node.left) : ''} ${node.operator} ${node.right ? stringifyCondition(node.right) : ''}`;
      } else {
        // Handle comparison operators
        let left = '';
        let right = '';
        
        if (node.left && node.left.type === 'column_ref') {
          left = `${node.left.table}.${node.left.column}`;
        } else {
          left = JSON.stringify(node.left);
        }
        
        if (node.right && node.right.type === 'column_ref') {
          right = `${node.right.table}.${node.right.column}`;
        } else if (node.right && node.right.type === 'single_quote_string') {
          right = `'${node.right.value}'`;
        } else {
          right = JSON.stringify(node.right);
        }
        
        return `${left} ${node.operator} ${right}`;
      }
    }
    return JSON.stringify(node);
  }
  
  result += ' ' + stringifyCondition(joinCondition);
  return result;
}

export function getAllTableNodesAsTableNodes(graph: Graph): TableNode[] {
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
  return graph.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
  }));
}


