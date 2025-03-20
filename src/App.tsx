import React, { useState, useEffect } from 'react';
import ASTDisplayBox from './components/ASTdispalybox';
import CodeInputBox from './components/CodeInputBox';
import FlowDiagram from './flowDiagram/FlowDiagram';
import { codeToAst, getAllTableNodesAsTableNodes, getFilteredEdges, sqlAstToGraph } from './parser/parser';
interface TableNode{
    id: string;
    type: string;
    data: { tableName: string; columns: { name: string; columnId: string }[] };
    position: { x: number; y: number };
  }
function App() {
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
SELECT A.AccountID AS AccountID
    ,A.AreaEmpowermentRequestStatus AS AreaEmpowermentStatus
    ,CASE 
        WHEN DCO.OfferStatus = 'Manager Approved'
            THEN 'Yes'
        ELSE 'No'
        END AS IsManagerApproved
    ,CASE 
        WHEN DCO.OfferAcceptanceState = 'Accepted'
            THEN 'Yes'
        ELSE 'No'
        END AS IsOfferAccepted
    ,DCO.OfferLetterSentDate AS OfferLetterSentDate
    ,DCO.OfferID AS OfferID
    ,DCO.OfferType AS OfferType
    ,DCO.OfferExpirationDate AS OfferExpirationDate
    ,DCO.OfferCreatedDate AS OfferCreatedDate
    ,A.AreaEmpowermentRequestProductRequestedAmount AS RequestedQuantity
    ,TE.TrainingEntitlementScheduledQuantity AS ScheduledQuantity
    ,TE.TrainingEntitlementAllocatedQuantity AS AllocatedQuantityc
    ,TE.TrainingEntitlementCompletedQuantity AS CompletedQuantity
    ,TE.TrainingEntitlementRemainingQuantity AS RemainingQuantity
    ,A.AreaEmpowermentRequestProductName AS ProductName
    ,A.AreaBudgetAllocationSolutionArea AS SolutionArea
    ,A.Area
    ,A.AreaBudgetAllocationPeriodID AS PeriodID
FROM CTE_AERequests A
INNER JOIN conformed.vw_DynamightCustomerOffers DCO ON DCO.DynamightCustomerOfferID = A.DynamightCustomerOfferID
    AND (
        A.AreaBudgetAllocationPeriod LIKE '%FY23%'
        OR A.AreaBudgetAllocationPeriod LIKE '%FY24%'
        OR A.AreaBudgetAllocationPeriod LIKE '%FY25%'
        OR A.AreaBudgetAllocationPeriod LIKE 'N/A'
        )
INNER JOIN conformed.vw_TrainingEntitlements TE ON TE.DynamightCustomerOfferID = DCO.DynamightCustomerOfferID`);
    
    // Keep initial processing for state initialization
    const initialAst = codeToAst(input);
    console.log('Initial AST:', initialAst);
    const initialGraph = sqlAstToGraph(initialAst);
    const initialNodes = getAllTableNodesAsTableNodes(initialGraph);
    const initialEdges = getFilteredEdges(initialGraph);

    const [tableNodes, setTableNodes] = useState<TableNode[]>(initialNodes);
    const [tableEdges, setTableEdges] = useState(initialEdges);
    
    // Add useEffect to handle input changes
    useEffect(() => {
        const newAst = codeToAst(input);
        const g = sqlAstToGraph(newAst);
        setTableNodes(getAllTableNodesAsTableNodes(g));
        setTableEdges(getFilteredEdges(g));
    }, [input]);

    // Simplify handleInputSubmit to just update input
    const handleInputSubmit = (input: string) => {
        setInput(input);
    };

    useEffect(() => {
        console.log('Updated table nodes:', tableNodes);
        console.log('Updated table edges:', tableEdges);
    }, [tableNodes, tableEdges]);

    return (
        <div className="App">
            <h1>SQL Visualizer</h1>
            <div style={{ display: 'flex' }}>
                <CodeInputBox onSubmit={handleInputSubmit} inputValue={input}/>
                <ASTDisplayBox input={input} />
                <FlowDiagram 
                    tableNodes={tableNodes} 
                    tableEdges={tableEdges}
                />
            </div>
        </div>
    );
}

export default App;


