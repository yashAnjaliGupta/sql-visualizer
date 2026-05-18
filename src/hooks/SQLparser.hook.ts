import { assignPositionsWithTopologicalSort, codeToAst, getAllTableNodesAsTableNodes, getFilteredEdges, sqlAstToGraph } from '../parser/graphGeneratorcopy';
import { useState,useEffect, useCallback } from 'react';
import { buildColumnHighlightMap } from '../parser/locResolver';


interface AstError {
    name?: string;
    message?: string;
    found?: string;
    expected?: Array<{ type: string; text: string }>;
    location?: { start: { line: number; column: number } };
}
interface TableNode {
    id: string;
    type: string;
    data: { tableName: string; columns: { name: string; columnId: string }[] };
    position: { x: number; y: number };
}

export const useSQLParser=(input:string,databaseType:string)=>{
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [tableNodes, setTableNodes] = useState<TableNode[]>([]);
    const [tableEdges, setTableEdges] = useState<Array<{ id: string; source: string; target: string; sourceHandle: string; targetHandle: string }>>([]);
    const [columnHighlights, setColumnHighlights] = useState<Record<string, ReturnType<typeof buildColumnHighlightMap>[string]>>({});
    
    // Process SQL only when input or database type changes
    const processSQL = useCallback((sqlInput: string, dbType: string) => {
        try {
            const newAst = codeToAst(sqlInput, dbType);

            if (newAst?.name?.includes('Error')) {
                const errorLocation = newAst.location ? 
                    `Line ${newAst.location.start.line}, Column ${newAst.location.start.column}` : 
                    'Unknown location';

                // Format the expected tokens in a more readable way
                const expectedArray = (newAst as AstError)?.expected ?? [];
                const expectedTokens = Array.isArray(expectedArray) && expectedArray.length > 0
                    ? expectedArray
                        .filter(exp => exp.type === 'literal')
                        .map(exp => exp.text)
                        .filter(text => text.trim()) // Remove empty strings
                        .join(', ')
                    : String((newAst as AstError)?.expected || '');

                const formattedMessage = [
                    `${newAst.name} at ${errorLocation}`,
                    `Problem: ${(newAst as AstError)?.message || 'Unknown error'}`
                ]
                    .filter(Boolean)
                    .join('\n');

                setIsError(true);
                setErrorMessage(formattedMessage);
                return;
            }
            const graphs = sqlAstToGraph(newAst);
            console.log('jmd',graphs);
            const allNodes: TableNode[] = [];
            const allEdges: Array<{ id: string; source: string; target: string; sourceHandle: string; targetHandle: string }> = [];

            graphs.forEach((g) => {
                allNodes.push(...getAllTableNodesAsTableNodes(g));
                allEdges.push(...getFilteredEdges(g));
                const map = buildColumnHighlightMap(input, newAst, g);
                setColumnHighlights(map);
            });

            // Apply positioning ONCE and set all state together
            const positionedNodes = assignPositionsWithTopologicalSort(allNodes, allEdges);
            setTableNodes(positionedNodes);
            setTableEdges(allEdges);
            setIsError(false);
            setErrorMessage('');
            console.log(tableNodes,tableEdges);
            
        } catch (error) {
            setIsError(true);
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }, []);
    // Initial processing
    useEffect(() => {
        processSQL(input, databaseType);
    }, [input,databaseType,processSQL]); // Run only once on mount
    console.log(tableNodes);
    // setTableNodes(assignPositionsWithTopologicalSort(tableNodes,tableEdges))
    return {tableNodes,tableEdges,isError,errorMessage,columnHighlights}
}