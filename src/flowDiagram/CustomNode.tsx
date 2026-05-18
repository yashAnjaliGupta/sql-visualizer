import React from 'react';
import { Handle, Position } from '@xyflow/react';

// Table Icon Component
const TableIcon = ({ color }: { color: string }) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }}
    >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
);

// Define the type for the data property of the node
interface TableNodeData {
    tableName: string;
    columns: { name: string; columnId: string; highlighted?: boolean }[];
    width?: number;
    height?: number;
    highlightedColumnIds?: string[];
    onHandleInteraction?: (handleId: string, isHover: boolean) => void;
    onHoverColumn?: (columnId: string | null) => void;
    theme?: {
        background?: string;
        border?: string;
        primary?: string;
        secondary?: string;
        text?: string;
    };
}

const CustomNode = ({ data, isConnectable, selected, style }: { data: TableNodeData, isConnectable: boolean, selected: boolean, style?: React.CSSProperties }) => {
    const highlightedColumnIds = data.highlightedColumnIds || [];
    const primaryColor = data.theme?.primary || '#1e40af';

    return (
        <div 
            className="p-3 bg-white rounded-lg shadow-lg transition-all duration-200 border-2 hover:shadow-xl"
            style={{ 
                borderColor: selected ? primaryColor : '#e5e7eb', 
                width: data.width || '250px',
                ...style
            }}
        >
            <div className="flex items-center justify-center mb-4 text-center transition-colors duration-200"
                style={{ 
                    color: selected ? primaryColor : primaryColor,
                    fontWeight: '700',
                    fontSize: '14px',
                    fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif',
                    letterSpacing: '0.3px'
                }}
            >
                <TableIcon color={selected ? primaryColor : primaryColor} />
                {data.tableName}
            </div>
            
            {data.columns.map(({ name, columnId }, index) => {
                const isHighlighted = highlightedColumnIds.includes(columnId);
                const sourceHandleId = `source-${columnId}`;
                const targetHandleId = `target-${columnId}`;
                
                return (
                    <div 
                        key={index} 
                        className="relative mb-1.5 rounded-md px-0 py-1 transition-all duration-200 cursor-pointer hover:bg-opacity-100"
                        style={{ 
                            background: isHighlighted ? `${primaryColor}26` : 'transparent',
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
                                background: isHighlighted ? primaryColor : `${primaryColor}80`, 
                                width: isHighlighted ? 12 : 10, 
                                height: isHighlighted ? 12 : 10,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                boxShadow: isHighlighted ? `0 0 8px ${primaryColor}99` : `0 0 4px ${primaryColor}44`
                            }}
                            isConnectable={isConnectable}
                            onMouseEnter={() => data.onHandleInteraction?.(targetHandleId, true)}
                            onMouseLeave={() => data.onHandleInteraction?.(targetHandleId, true)}
                            onClick={(e) => {
                                e.stopPropagation();
                                data.onHandleInteraction?.(targetHandleId, false);
                            }}
                        />
                        <span className="block mx-5 text-xs whitespace-normal break-words transition-all duration-200"
                            style={{ 
                                fontWeight: isHighlighted ? '600' : '400',
                                color: '#000000',
                                cursor: 'pointer'
                            }}
                        >
                            {name}
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={sourceHandleId}
                            style={{ 
                                top: '50%', 
                                background: isHighlighted ? primaryColor : `${primaryColor}80`, 
                                width: isHighlighted ? 12 : 10, 
                                height: isHighlighted ? 12 : 10,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                boxShadow: isHighlighted ? `0 0 8px ${primaryColor}99` : `0 0 4px ${primaryColor}44`
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