import React, { useState } from 'react';
import ASTDisplayBox from './components/ASTdispalybox';
import CodeInputBox from './components/CodeInputBox';
import FlowDiagram from './flowDiagram/FlowDiagram';
import { codeToAst, getAllTableNodesAsTableNodes, getFilteredEdges, sqlAstToGraph } from './parser/parser';

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

    const handleInputSubmit = (input: string) => {
        setInput(input);
    };
    const ast = codeToAst(input);
    // console.log(ast);
    const g=sqlAstToGraph(ast);
    // console.log(JSON.stringify(g, null, 2));
    const temp=getAllTableNodesAsTableNodes(g);
    // console.log(temp);
    const edges = getFilteredEdges(g);
    // console.log(edges);
    return (
        <div className="App">
            <h1>SQL Visualizer</h1>
            <div style={{ display: 'flex' }}>
                <CodeInputBox onSubmit={handleInputSubmit} inputValue={input}/>
                <ASTDisplayBox input={input} />
                <FlowDiagram tableNodes={temp} tableEdges ={edges}></FlowDiagram>
            </div>
        </div>
    );
}

export default App;


