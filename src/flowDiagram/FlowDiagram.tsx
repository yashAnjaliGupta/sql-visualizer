import React, { useCallback, useState, useEffect } from 'react';
import { Background, Controls, EdgeChange, MiniMap, NodeChange, ReactFlow,applyEdgeChanges,
    applyNodeChanges, } from '@xyflow/react';
import CustomNode from './CustomNode';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
    customTable: CustomNode,
};
interface TableNode {
    id: string;
    type: string;
    data: { tableName: string; columns: { name: string; columnId: string }[] };
    position: { x: number; y: number };
}
export interface Edge {
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
}
const initialNodes = [
    {
        id: '1',
        type: 'customTable',
        position: { x: 0, y: 0 },
        data: { tableName: 'Users', columns: [{ name: 'id', columnId: '1' }, { name: 'name', columnId: '2' }, { name: 'email', columnId: '3' }] },
    },
    {
        id: '2',
        type: 'customTable',
        position: { x: 250, y: 0 },
        data: { tableName: 'Orders', columns: [{ name: 'orderId', columnId: '1' }, { name: 'userId', columnId: '2' }, { name: 'total', columnId: '3' }] },
    },
];

const initialEdges = [
    { 
        id: 'e1-2', 
        source: '1',       // node 'Users'
        target: '2',       // node 'Orders'
        sourceHandle: 'source-id', 
        targetHandle: 'target-userId' 
    }
];
interface FlowDiagramProps {
    tableNodes: TableNode[];
    tableEdges: Edge[];
}
export default function FlowDiagram({ tableNodes,tableEdges}: FlowDiagramProps) {
    const [nodes, setNodes] = useState(tableNodes);
    const [edges, setEdges] = useState(tableEdges);

    useEffect(() => {
        setNodes(tableNodes);
        setEdges(tableEdges);
    }, [tableNodes, tableEdges]);

    const onNodesChange = useCallback(
        (changes: NodeChange<{ id: string; type: string; position: { x: number; y: number }; data: { tableName: string; columns: { name: string; columnId: string }[] } }>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes],
      );
      const onEdgesChange = useCallback(
        (changes: EdgeChange<{ id: string; source: string; target: string; sourceHandle: string; targetHandle: string; }>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges],
      );
    console.log(nodes);
    console.log(edges);
    return (
        <div style={{ width: '50vw', height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black' }}>
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}>
            <Background />
            <Controls />
            <MiniMap />
            </ReactFlow>
        </div>
    );
}