import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

// Define the type for the data property of the node
interface TableNodeData {
    tableName: string;
    columns: { name: string; columnId: string; highlighted?: boolean }[];
    width?: number;
    height?: number;
    highlightedColumnIds?: string[];
    onHandleInteraction?: (handleId: string, isHover: boolean) => void;
    onHoverColumn?: (columnId: string | null) => void;
}

const CustomNode = ({ data, isConnectable, selected, style }: { data: TableNodeData, isConnectable: boolean, selected: boolean, style?: React.CSSProperties }) => {
    const highlightedColumnIds = data.highlightedColumnIds || [];

    return (
        <div style={{ 
            padding: 10, 
            border: selected ? '2px solid #ff0072' : '1px solid #777', 
            borderRadius: 4, 
            background: '#fff', 
            width: data.width || '250px',
            transition: 'all 0.2s ease',
            ...style
        }}>
            <div style={{ 
                fontWeight: 'bold', 
                marginBottom: 8, 
                textAlign: 'center',
                color: selected ? '#ff0072' : 'black'
            }}>
                {data.tableName}
            </div>
            
            {data.columns.map(({ name, columnId }, index) => {
                const isHighlighted = highlightedColumnIds.includes(columnId);
                const sourceHandleId = `source-${columnId}`;
                const targetHandleId = `target-${columnId}`;
                
                return (
                    <div 
                        key={index} 
                        style={{ 
                            position: 'relative', 
                            marginBottom: 6,
                            background: isHighlighted ? 'rgba(216, 25, 111, 0.2)' : 'transparent',
                            borderRadius: 3,
                            padding: '2px 0',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                        }}
                        onClick={() => data.onHandleInteraction?.(sourceHandleId, false)}
                        onMouseEnter={() => data.onHoverColumn?.(columnId)}
                        onMouseLeave={() => data.onHoverColumn?.(null)}
                    >
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={targetHandleId}
                            style={{ 
                                top: '50%', 
                                background: isHighlighted ? '#ff0072' : '#555', 
                                width: isHighlighted ? 12 : 10, 
                                height: isHighlighted ? 12 : 10,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                            isConnectable={isConnectable}
                            onMouseEnter={() => data.onHandleInteraction?.(targetHandleId, true)}
                            onMouseLeave={() => data.onHandleInteraction?.(targetHandleId, true)}
                            onClick={(e) => {
                                e.stopPropagation();
                                data.onHandleInteraction?.(targetHandleId, false);
                            }}
                        />
                        <span style={{ 
                            margin: '0 20px', 
                            display: 'block', 
                            whiteSpace: 'normal', 
                            fontSize: '12px', 
                            overflowWrap: 'break-word',
                            fontWeight: isHighlighted ? 'bold' : 'normal',
                            color: isHighlighted ? '#ff0072' : 'inherit',
                            cursor: 'pointer'
                        }}>
                            {name}
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={sourceHandleId}
                            style={{ 
                                top: '50%', 
                                background: isHighlighted ? '#ff0072' : '#555', 
                                width: isHighlighted ? 12 : 10, 
                                height: isHighlighted ? 12 : 10,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                            isConnectable={isConnectable}
                            onMouseEnter={() => data.onHandleInteraction?.(sourceHandleId, true)}
                            onMouseLeave={() => data.onHandleInteraction?.(sourceHandleId, true)}
                            onClick={(e) => {
                                e.stopPropagation();
                                data.onHandleInteraction?.(sourceHandleId, false);
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default CustomNode;