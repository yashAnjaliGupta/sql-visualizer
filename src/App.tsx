import React, { useState, useEffect, useCallback } from 'react';
// import ASTDisplayBox from './components/ASTdispalybox';
import CodeInputBox from './components/CodeInputBox';
import DatabaseSelector from './components/DatabaseSelector';
import FlowDiagram from './flowDiagram/FlowDiagram';
import { buildColumnHighlightMap } from './parser/locResolver';
// import { codeToAst, getAllTableNodesAsTableNodes, getFilteredEdges, sqlAstToGraph } from './parser/parser';
import { codeToAst, getAllTableNodesAsTableNodes, getFilteredEdges, sqlAstToGraph } from './parser/graphGenerator';
import ToggleSwitch from './components/ToggleSwitch';
import ThemeToggle from './components/ThemeToggle';

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

function App() {
    const [databaseType, setDatabaseType] = useState('Transactsql');
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [input, setInput] = useState(`WITH CTE_AERequests
AS (
    SELECT DISTINCT DynamightCustomerOfferID
        ,AER.AreaBudgetAllocationPeriodID
        ,AER.AreaEmpowermentRequestProductName
        ,AER.AccountID
        ,AER.AreaEmpowermentRequestStatus
        ,AER.AreaEmpowermentRequestProductRequestedAmount
        ,AER.AreaBudgetAllocationSolutionArea
        ,AER.Area
        ,AER.AreaBudgetAllocationPeriod
    FROM conformed.vw_AreaEmpowermentRequests AER
    )
SELECT A.AccountID AS [Account ID]
    ,A.AreaEmpowermentRequestStatus AS [Area Empowerment Status]
    ,CASE 
        WHEN DCO.OfferStatus = 'Manager Approved'
            THEN 'Yes'
        ELSE 'No'
        END AS [Is Manager Approved]
    ,CASE 
        WHEN DCO.OfferAcceptanceState = 'Accepted'
            THEN 'Yes'
        ELSE 'No'
        END AS [Is Offer Accepted]
    ,DCO.OfferLetterSentDate AS [Offer Letter Sent Date]
    ,DCO.OfferID AS [Offer ID]
    ,DCO.OfferType AS [Offer Type]
    ,DCO.OfferExpirationDate AS [Offer Expiration Date]
    ,DCO.OfferCreatedDate AS [Offer Created Date]
    ,A.AreaEmpowermentRequestProductRequestedAmount AS [Requested Quantity]
    ,TE.TrainingEntitlementScheduledQuantity AS [Scheduled Quantity]
    ,TE.TrainingEntitlementAllocatedQuantity AS [Allocated Quantity]
    ,TE.TrainingEntitlementCompletedQuantity AS [Completed Quantity]
    ,TE.TrainingEntitlementRemainingQuantity AS [Remaining Quantity]
    ,A.AreaEmpowermentRequestProductName AS [Product Name]
    ,A.AreaBudgetAllocationSolutionArea AS [Solution Area]
    ,A.Area
    ,A.AreaBudgetAllocationPeriodID AS [Period ID]
FROM CTE_AERequests A
INNER JOIN conformed.vw_DynamightCustomerOffers DCO ON DCO.DynamightCustomerOfferID = A.DynamightCustomerOfferID
    AND (
        A.AreaBudgetAllocationPeriod LIKE '%FY23%'
        OR A.AreaBudgetAllocationPeriod LIKE '%FY24%'
        OR A.AreaBudgetAllocationPeriod LIKE '%FY25%'
        OR A.AreaBudgetAllocationPeriod LIKE 'N/A'
        )
INNER JOIN conformed.vw_TrainingEntitlements TE ON TE.DynamightCustomerOfferID = DCO.DynamightCustomerOfferID`);
    const [tableNodes, setTableNodes] = useState<TableNode[]>([]);
    const [tableEdges, setTableEdges] = useState<Array<{ id: string; source: string; target: string; sourceHandle: string; targetHandle: string }>>([]);
    // const [showAst, setShowAst] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isCodeInputCollapsed, setIsCodeInputCollapsed] = useState(false);
    const [columnHighlights, setColumnHighlights] = useState<Record<string, ReturnType<typeof buildColumnHighlightMap>[string]>>({});
    const [activeEditorHighlights, setActiveEditorHighlights] = useState<ReturnType<typeof buildColumnHighlightMap>[string] | []>([]);
    const [activeColumns, setActiveColumns] = useState<string[]>([]);

    const theme = {
        background: isDarkMode ? '#1A202C' : '#F7FAFC',
        text: isDarkMode ? '#F7FAFC' : '#2D3748',
        primary: isDarkMode ? '#4A5568' : '#CBD5E0',
        secondary: isDarkMode ? '#2D3748' : '#EDF2F7',
        border: isDarkMode ? '#4A5568' : '#E2E8F0',
        error: {
            background: isDarkMode ? '#742A2A' : '#FED7D7',
            text: isDarkMode ? '#FEB2B2' : '#9B2C2C',
            border: isDarkMode ? '#9B2C2C' : '#FC8181'
        },
        isDark: isDarkMode
    };

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            padding: '0 20px',
            gap: '10px',
            height: 'calc(100vh - 80px)', // Reduced from 120px for better height
            margin: 0,
        },
        content: {
            display: 'flex',
            gap: '20px', // Increased gap between components
            height: 'calc(100% - 50px)',
            position: 'relative' as const,
            padding: '0 10px', // Added horizontal padding
            margin: 0,
        },
        rightContent: {
            display: 'flex',
            flex: 1,
            gap: '20px',
            height: '100%',
            transition: 'all 0.3s ease',
            marginLeft: isCodeInputCollapsed ? '40px' : '0',
        },
        controls: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            height: '40px', // Fixed height for controls
            padding: '0 0 10px 0',
        },
        showCodeButton: {
            position: 'absolute' as const,
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            writingMode: 'vertical-lr' as const,
            textOrientation: 'mixed' as const,
            padding: '16px 8px', // Adjusted padding
            backgroundColor: theme.secondary,
            border: `1px solid ${theme.border}`,
            borderLeft: 'none',
            borderRadius: '0 8px 8px 0',
            color: theme.text,
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'all 0.2s ease',
            fontSize: '14px', // Added font size
            '&:hover': {
                backgroundColor: `${theme.primary}33`,
            }
        } as React.CSSProperties,
        codeInputWrapper: {
            display: 'flex',
            minWidth: isCodeInputCollapsed? '0':  '400px', // Fixed width for CodeInput
            transition: 'all 0.3s ease',
            marginRight: '10px', // Added right margin
        },
        diagramContainer: {
            display: 'flex',
            flex: 1,
            height: '100%',
            gap: '20px',
            marginLeft: '10px', // Added left margin
        },
        errorContainer: {
            flex: 1,
            padding: '20px',
            backgroundColor: theme.error.background,
            border: `1px solid ${theme.error.border}`,
            borderRadius: '8px',
            color: theme.error.text,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '10px',
            overflow: 'auto',
        },
    };

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
            const g = sqlAstToGraph(newAst);
            console.log('jmd',g)
            setTableNodes(getAllTableNodesAsTableNodes(g));
            setTableEdges(getFilteredEdges(g));
            console.log(tableNodes, tableEdges);
            // Build highlight ranges per column (use loc if any, fallback to regex)
            const map = buildColumnHighlightMap(sqlInput, newAst, g);
            setColumnHighlights(map);
            setActiveEditorHighlights([]);
            setIsError(false);
            setErrorMessage('');
        } catch (error) {
            setIsError(true);
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }, []);

    // Initial processing
    useEffect(() => {
        processSQL(input, databaseType);
    }, []); // Run only once on mount

    // Handle input changes with debounce
    const handleInputSubmit = useCallback((newInput: string) => {
        console.log('Input submitted:', newInput);
        setInput(newInput);
        processSQL(newInput, databaseType);
    }, [databaseType, processSQL]);

    // Handle database changes
    const handleDatabaseChange = useCallback((value: string) => {
        setDatabaseType(value);
        processSQL(input, value);
    }, [input, processSQL]);

    const handleHoverColumn = useCallback((columnId: string | null) => {
        if (!columnId) { setActiveEditorHighlights([]); return; }
        setActiveEditorHighlights(columnHighlights[columnId] || []);
    }, [columnHighlights]);

    const handleHighlightColumns = useCallback((columnIds: string[]) => {
        setActiveColumns(columnIds);
        const merged: any[] = [];
        const seen = new Set<string>();
        for (const id of columnIds) {
            const ranges = columnHighlights[id] || [];
            for (const r of ranges) {
                const key = `${r.startOffset}-${r.endOffset}`;
                if (!seen.has(key)) { seen.add(key); merged.push(r); }
            }
        }
        setActiveEditorHighlights(merged);
    }, [columnHighlights]);

    return (
        <div className="App" style={{ 
            backgroundColor: theme.background, 
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            position: 'relative',
            transition: 'all 0.3s ease',
            overflow: 'hidden', // Prevent scrolling
        }}>
            <ThemeToggle 
                isDark={isDarkMode} 
                onToggle={() => setIsDarkMode(!isDarkMode)} 
            />
            <h1 style={{ 
                color: theme.text,
                margin: 0,
                padding: '10px 20px', // Reduced padding
                fontSize: '24px',
                height: '40px', // Fixed height
                display: 'flex',
                alignItems: 'center'
            }}>SQL Visualizer</h1>
            <div style={styles.container}>
                <div style={styles.controls}>
                    <DatabaseSelector 
                        value={databaseType} 
                        onChange={handleDatabaseChange}
                        theme={theme}
                    />
                    {/* <ToggleSwitch 
                        isOn={showAst} 
                        onToggle={() => setShowAst(!showAst)}
                        theme={theme}
                    /> */}
                </div>
                <div style={styles.content}>
                    <div style={styles.codeInputWrapper}>
                        {isCodeInputCollapsed ? (
                            <button
                                onClick={() => setIsCodeInputCollapsed(false)}
                                style={styles.showCodeButton}
                            >
                                Show SQL Editor
                            </button>
                        ) : (
                            <CodeInputBox 
                                onSubmit={handleInputSubmit} 
                                inputValue={input}
                                theme={theme}
                                onCollapse={setIsCodeInputCollapsed}
                                highlights={activeEditorHighlights as any}
                            />
                        )}
                    </div>
                    {/* <div style={{
                        ...styles.diagramContainer,
                        ...(showAst ? { gap: '20px' } : { gap: '0' })
                    }}> */}
                        {/* ast display box  */}
                      {/* {showAst && 
                            <ASTDisplayBox 
                                input={input} 
                                database={databaseType}
                                theme={theme}
                                style={{
                                    flex: isCodeInputCollapsed ? 0.4 : 0.45,
                                    transition: 'all 0.3s ease',
                                }}
                            />
                        } */}
                        {isError ? (
                            <div style={styles.errorContainer}>
                                <h3 style={{ margin: 0, color: theme.error.text }}>SQL Parse Error</h3>
                                <pre style={{ 
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'monospace',
                                    fontSize: '14px'
                                }}>
                                    {errorMessage}
                                </pre>
                            </div>
                        ) : (
                            <FlowDiagram 
                                tableNodes={tableNodes} 
                                tableEdges={tableEdges}
                                theme={theme}
                                onHoverColumn={handleHoverColumn}
                                onHighlightColumns={handleHighlightColumns}
                                style={{
                                    flex: 1,
                                    transition: 'all 0.3s ease',
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        // </div>
    );
}

export default App;


