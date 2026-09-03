import { assignPositionsWithTopologicalSort, codeToAst, getAllTableNodesAsTableNodes, getFilteredEdges, sqlAstToGraph } from '../parser/graphGenerator';
import { useState, useEffect, useCallback } from 'react';
import { buildColumnHighlightMap } from '../parser/locResolver';
import { extractAllCreateTables, type CreateTableDef } from '../parser/ddlExtractor';
import { extractAllInserts, type InsertDef } from '../parser/insertExtractor';

// ── types ──────────────────────────────────────────────────────────────────

interface AstError {
    name?: string;
    message?: string;
    found?: string;
    expected?: Array<{ type: string; text: string }>;
    location?: { start: { line: number; column: number } };
}

export interface TableNode {
    id: string;
    type: string;
    data: { tableName: string; columns: { name: string; columnId: string }[] };
    position: { x: number; y: number };
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
}

/** One SELECT query's rendered graph */
export interface SelectGraph {
    label: string;    // e.g. "SELECT #1"
    nodes: TableNode[];
    edges: FlowEdge[];
    highlights: Record<string, any>;
}

export type StatementType = 'select' | 'create' | 'insert' | 'mixed' | 'unknown';

function detectStatementType(asts: any[]): StatementType {
    if (!asts || asts.length === 0) return 'unknown';
    const types = new Set(asts.map((a: any) => a?.type?.toLowerCase() ?? 'unknown'));
    const hasSelect = types.has('select');
    const hasCreate = types.has('create');
    const hasInsert = types.has('insert') || types.has('replace');

    if (hasSelect && !hasCreate && !hasInsert) return 'select';
    if (hasCreate && !hasSelect && !hasInsert) return 'create';
    if (hasInsert && !hasSelect && !hasCreate) return 'insert';
    return 'mixed';
}

/** Build a display label for a SELECT AST */
function selectLabel(ast: any, idx: number): string {
    // Try to extract main table names from FROM clause for a nicer label
    try {
        const froms: string[] = (ast.from || [])
            .filter((f: any) => f.table)
            .map((f: any) => f.as || f.table)
            .slice(0, 2);
        if (froms.length > 0) return `SELECT · ${froms.join(', ')}`;
    } catch { /* ignore */ }
    return `SELECT #${idx + 1}`;
}

// ── hook ───────────────────────────────────────────────────────────────────

export const useSQLParser = (input: string, databaseType: string) => {
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Shared column highlights (for editor decoration)
    const [columnHighlights, setColumnHighlights] = useState<Record<string, ReturnType<typeof buildColumnHighlightMap>[string]>>({});

    // SELECT graphs – one entry per SELECT statement
    const [selectGraphs, setSelectGraphs] = useState<SelectGraph[]>([]);

    // DDL / insert state
    const [statementType, setStatementType] = useState<StatementType>('select');
    const [createDefs, setCreateDefs] = useState<CreateTableDef[]>([]);
    const [insertDefs, setInsertDefs] = useState<InsertDef[]>([]);

    const processSQL = useCallback((sqlInput: string, dbType: string) => {
        try {
            const newAst = codeToAst(sqlInput, dbType);

            // ── parse error ──────────────────────────────────────────────────
            if (newAst?.name?.includes('Error')) {
                const errorLocation = newAst.location
                    ? `Line ${newAst.location.start.line}, Column ${newAst.location.start.column}`
                    : 'Unknown location';

                const formattedMessage = [
                    `${newAst.name} at ${errorLocation}`,
                    `Problem: ${(newAst as AstError)?.message || 'Unknown error'}`,
                ]
                    .filter(Boolean)
                    .join('\n');

                setIsError(true);
                setErrorMessage(formattedMessage);
                return;
            }

            // Normalise to array
            const astArr: any[] = Array.isArray(newAst) ? newAst : [newAst];
            const stmtType = detectStatementType(astArr);
            setStatementType(stmtType);

            // ── CREATE / INSERT path ─────────────────────────────────────────
            if (stmtType === 'create' || stmtType === 'insert' || stmtType === 'mixed') {
                setCreateDefs(extractAllCreateTables(astArr));
                setInsertDefs(extractAllInserts(astArr));
                if (stmtType !== 'mixed') {
                    setSelectGraphs([]);
                    setColumnHighlights({});
                }
            } else {
                setCreateDefs([]);
                setInsertDefs([]);
            }

            // ── SELECT path ──────────────────────────────────────────────────
            if (stmtType === 'select' || stmtType === 'mixed') {
                const selectAsts = astArr.filter((a: any) => a?.type?.toLowerCase() === 'select');

                const graphs: SelectGraph[] = [];
                const allHighlights: Record<string, any> = {};

                selectAsts.forEach((selectAst: any, idx: number) => {
                    const [g] = sqlAstToGraph(selectAst); // single AST → single graph
                    if (!g) return;

                    const nodes = getAllTableNodesAsTableNodes(g);
                    const edges = getFilteredEdges(g);
                    const positioned = assignPositionsWithTopologicalSort(nodes, edges);

                    const map = buildColumnHighlightMap(sqlInput, newAst, g);
                    Object.assign(allHighlights, map);

                    graphs.push({
                        label: selectLabel(selectAst, idx),
                        nodes: positioned,
                        edges,
                        highlights: map,
                    });
                });

                setSelectGraphs(graphs);
                setColumnHighlights(allHighlights);
            }

            setIsError(false);
            setErrorMessage('');
        } catch (error) {
            setIsError(true);
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }, []);

    useEffect(() => {
        processSQL(input, databaseType);
    }, [input, databaseType, processSQL]);

    // Legacy flat select arrays (for backward compat with single-select path)
    const tableNodes = selectGraphs[0]?.nodes ?? [];
    const tableEdges = selectGraphs[0]?.edges ?? [];

    return {
        // legacy
        tableNodes,
        tableEdges,
        // new
        selectGraphs,
        columnHighlights,
        isError,
        errorMessage,
        statementType,
        createDefs,
        insertDefs,
    };
};