    import React, { useCallback, useState, useEffect, useLayoutEffect } from 'react';
import { Background, Controls, EdgeChange, MiniMap, NodeChange, ReactFlow, applyEdgeChanges,
    applyNodeChanges, Edge as ReactFlowEdge } from '@xyflow/react';
import CustomNode from './CustomNode';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
    customTable: CustomNode,
};

// Discriminated union type to track active element
type ActiveElement = 
    | { type: 'edge'; id: string; isHovered: boolean }
    | { type: 'handle'; id: string; isHovered: boolean }
    | null;

interface TableNode {
    id: string;
    type: string;
    data: { 
        tableName: string; 
        columns: { name: string; columnId: string; highlighted?: boolean }[]; 
        highlightedColumnIds?: string[];
        onHandleInteraction?: (handleId: string, isHover: boolean) => void;
    };
    position: { x: number; y: number };
    style?: React.CSSProperties;
    selected?: boolean;
}

export interface Edge {
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
    style?: React.CSSProperties;
    animated?: boolean;
    selected?: boolean;
}

interface FlowDiagramProps {
    tableNodes: TableNode[];
    tableEdges: Edge[];
    theme?: Theme;
    style?: React.CSSProperties;  // Added style prop
    onHoverColumn?: (columnId: string | null) => void;
    onHighlightColumns?: (columnIds: string[]) => void;
}

interface Theme {
    background?: string;
    border?: string;
    primary?: string;
    secondary?: string;
    text?: string;
}

export default function FlowDiagram({ tableNodes, tableEdges, theme, style, onHoverColumn, onHighlightColumns }: FlowDiagramProps) {
    const [nodes, setNodes] = useState(tableNodes);
    const [edges, setEdges] = useState(tableEdges);
    const [activeElement, setActiveElement] = useState<ActiveElement>(null);
    // console.log('qwerty',tableNodes);
    // Initialize nodes and edges once from props
    useEffect(() => {
        // Add handle event handlers to nodes
    const nodesWithHandlers = tableNodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                onHandleInteraction: (handleId: string, isHover: boolean) => {
                    if (isHover) {
                        // Only set hover if no selection is active
                        if (!activeElement || activeElement.isHovered) {
                            setActiveElement({ type: 'handle', id: handleId, isHovered: true });
                        }
                    } else {
                        // For click (not hover), always set the selection
                        setActiveElement(prev => 
                            prev && prev.type === 'handle' && prev.id === handleId && !prev.isHovered
                                ? null  // Deselect if already selected
                                : { type: 'handle', id: handleId, isHovered: false }
                        );
                    }
        },
        onHoverColumn
            }
        }));
        
        setNodes(nodesWithHandlers);
        setEdges(tableEdges);
    }, [tableNodes, tableEdges]);
    
    // Highlighting effect with simplified logic
    useEffect(() => {
        if (!activeElement) {
            // Reset all highlighting
            requestAnimationFrame(() => {
                setNodes(prevNodes => prevNodes.map(node => ({
                    ...node,
                    data: {
                        ...node.data,
                        highlightedColumnIds: [],
                    },
                    style: { opacity: 1 },
                    selected: false
                })));
                
                setEdges(prevEdges => prevEdges.map(edge => ({
                    ...edge,
                    style: undefined,
                    animated: false,
                    selected: false
                })));
            });
            return;
        }

        // Variables to hold related elements
        let sourceId = '';
        let targetId = '';
        let sourceHandle = '';
        let targetHandle = '';
        let relatedEdgeIds: string[] = [];
        const activeId = activeElement.id;

        // Helper function to extract column name from handle
        const getColumnName = (handle: string): string => {
            if (handle.startsWith('source-')) return handle.substring(7);
            if (handle.startsWith('target-')) return handle.substring(7);
            return handle;
        };
        
        // Logic for active edge
        if (activeElement.type === 'handle') {
            const handleColumnId = getColumnName(activeId);
            // Find related edges using DFS
            const findRelatedEdgeIds = () => {
                const relatedIds = new Set<string>();
                const visitedHandles = new Set<string>();
                const visitedEdgeIds = new Set<string>([activeId]);
                
                const dfs = (currentHandle: string) => {
                    if (!currentHandle || visitedHandles.has(currentHandle)) return;
                    visitedHandles.add(currentHandle);
                    
                    const currentColumnName = getColumnName(currentHandle);
                    
                    edges.forEach(edge => {
                        if (visitedEdgeIds.has(edge.id)) return;
                        
                        const sourceColumnName = getColumnName(edge.sourceHandle || '');
                        const targetColumnName = getColumnName(edge.targetHandle || '');
                        
                        if (sourceColumnName === currentColumnName || targetColumnName === currentColumnName) {
                            relatedIds.add(edge.id);
                            visitedEdgeIds.add(edge.id);
                            
                            const nextHandle = sourceColumnName === currentColumnName ? 
                                edge.targetHandle : edge.sourceHandle;
                            
                            if (nextHandle) dfs(nextHandle);
                        }
                    });
                };
                dfs(handleColumnId);

                return Array.from(relatedIds);
            };

            relatedEdgeIds = findRelatedEdgeIds();
        } 
        // Logic for active handle
        else if (activeElement.type === 'edge') {
            const highlightedEdge = edges.find(edge => edge.id === activeId);
            relatedEdgeIds = highlightedEdge ? [highlightedEdge.id] : [];
        }

    // Update highlighting
        requestAnimationFrame(() => {
            // Helper function to extract column ID from handle
            const getColumnId = (handle: string): string => {
                if (handle.startsWith('source-')) return handle.substring(7);
                if (handle.startsWith('target-')) return handle.substring(7);
                return handle;
            };
            
            // Compute the union set of highlighted columnIds for emitting to parent
            const highlightedUnion = new Set<string>();

            // Update nodes with highlighted columns
            setNodes(prevNodes => prevNodes.map(node => {
                // Find all related handles for this node
                const nodeHandles = new Set<string>();
                
                // Add active handle if it belongs to this node
                if (activeElement.type === 'handle') {
                    const columnId = getColumnId(activeId);
                    
                    // Check if node has this column
                    const hasColumn = node.data.columns.some(col => col.columnId === columnId);
                    
                    if (hasColumn) {
                        nodeHandles.add(columnId);
                    }
                }
                
                // Add handles from active edge
                if (node.id === sourceId) {
                    nodeHandles.add(getColumnId(sourceHandle));
                }
                if (node.id === targetId) {
                    nodeHandles.add(getColumnId(targetHandle));
                }
                
                // Add handles from related edges
                relatedEdgeIds.forEach(edgeId => {
                    const edge = edges.find(e => e.id === edgeId);
                    if (!edge) return;
                    
                    if (edge.source === node.id) {
                        const cid = getColumnId(edge.sourceHandle || '');
                        nodeHandles.add(cid);
                        highlightedUnion.add(cid);
                    }
                    if (edge.target === node.id) {
                        const cid = getColumnId(edge.targetHandle || '');
                        nodeHandles.add(cid);
                        highlightedUnion.add(cid);
                    }
                });

                // Also include the directly active handle's columnId in union
                if (activeElement.type === 'handle') {
                    const cid = getColumnId(activeId);
                    if (cid) highlightedUnion.add(cid);
                }
                
                // If this node has highlighted columns
                if (nodeHandles.size > 0) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            highlightedColumnIds: Array.from(nodeHandles).filter(Boolean)
                        },
                        style: { opacity: 1 },
                        selected: node.id === sourceId || node.id === targetId
                    };
                }
                
                // Else dim the node
                return {
                    ...node,
                    data: {
                        ...node.data,
                        highlightedColumnIds: []
                    },
                    style: { opacity: 0.6 },
                    selected: false
                };
            }));

            // Emit highlighted columns to parent for SQL highlighting
            onHighlightColumns?.(Array.from(highlightedUnion));

            // Update edges
            setEdges(prevEdges => prevEdges.map(edge => {
                if ((activeElement.type === 'edge' && edge.id === activeId)||(relatedEdgeIds.includes(edge.id))) {
                    return {
                        ...edge,
                        style: { 
                            stroke: '#ff0072', 
                            strokeWidth: 3,
                            opacity: 1 
                        },
                        animated: true,
                        selected: true
                    };
                } 
                return {
                    ...edge,
                    style: { opacity: 0.3, strokeDasharray: '2, 2' },
                    animated: false,
                    selected: false
                };
            }));
        });
    }, [activeElement, edges]); 

    // Simplified event handlers
    const onNodesChange = useCallback(
        (changes: NodeChange<any>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    
    const onEdgesChange = useCallback(
        (changes: EdgeChange<any>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onEdgeMouseEnter = useCallback((event: React.MouseEvent, edge: ReactFlowEdge) => {
        // Only set hover if no selection is active
        if (!activeElement || activeElement.isHovered) {
            setActiveElement({ type: 'edge', id: edge.id, isHovered: true });
        }
    }, [activeElement]);

    const onEdgeMouseLeave = useCallback(() => {
        setActiveElement(prev => 
            prev && prev.type === 'edge' && prev.isHovered ? null : prev
        );
    }, []);

    const onEdgeClick = useCallback((event: React.MouseEvent, edge: ReactFlowEdge) => {
        setActiveElement(prev => 
            prev && prev.type === 'edge' && prev.id === edge.id && !prev.isHovered
                ? null  // Deselect if already selected
                : { type: 'edge', id: edge.id, isHovered: false }
        );
    }, []);

    const onPaneClick = useCallback(() => {
        setActiveElement(null);
    }, []);

    const styles = {
        container: {
            height: '83vh',
            left: '100px',
            flexDirection: 'column' as const,
            backgroundColor: theme?.background || '#1A202C',
            border: `1px solid ${theme?.border || '#4A5568'}`,
            borderRadius: '12px',
            overflow: 'hidden',
            margin: '4px 4px'
        },
        flowWrapper: {
            flex: 1,
            backgroundColor: theme?.background || '#1A202C'
        },
        nodeStyle: {
            backgroundColor: theme?.secondary || '#2D3748',
            border: 'none',
            borderRadius: '8px',
            padding: '16px',
            color: theme?.text || '#E0E0E0',
            width: '280px'
        },
        edgeStyle: {
            stroke: theme?.primary || '#4CAF50',
            strokeWidth: 2,
            transition: 'all 0.3s ease'
        },
        minimap: {
            backgroundColor: `${theme?.secondary}99` || '#2D374899',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            padding: '8px',
            margin: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        },
        controls: {
            position: 'absolute' as const,
            top: '20px',
            right: '20px',
            backgroundColor: `${theme?.secondary}99` || '#2D374899',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '8px',
            button: {
                backgroundColor: 'transparent',
                border: `1px solid ${theme?.border || '#4A5568'}`,
                borderRadius: '6px',
                padding: '8px',
                color: theme?.text || '#E0E0E0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    backgroundColor: `${theme?.primary}33` || '#4CAF5033',
                    transform: 'translateY(-1px)'
                },
                '&:active': {
                    transform: 'translateY(0px)'
                }
            }
        },
        highlightedEdge: {
            stroke: '#FF0072',
            strokeWidth: 3,
            opacity: 1,
            filter: 'drop-shadow(0 0 8px #FF0072)'
        }
    };

    useLayoutEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(() => {
                window.dispatchEvent(new Event('resize'));
            });
        });

        const container = document.querySelector('.react-flow__container');
        if (container) {
            resizeObserver.observe(container);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div style={{ ...styles.container, ...style }}>
            <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                nodeTypes={nodeTypes} 
                onNodesChange={onNodesChange} 
                onEdgesChange={onEdgesChange}
                onEdgeMouseEnter={onEdgeMouseEnter}
                onEdgeMouseLeave={onEdgeMouseLeave}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                fitView
                style={styles.flowWrapper}
                proOptions={{ hideAttribution: true }}
            >
                <Background 
                    gap={24}
                    size={1.5}
                    color={`${theme?.border}33` || '#4A556833'}
                    style={{ backgroundColor: theme?.background || '#1A202C' }}
                />
                <Controls />
                <MiniMap 
                    style={styles.minimap}
                    nodeColor={theme?.primary || '#4CAF50'}
                    maskColor={`${theme?.background}CC` || '#1A202CCC'}
                    nodeStrokeWidth={3}
                    nodeBorderRadius={4}
                    zoomable
                    pannable
                />
            </ReactFlow>
        </div>
    );
}