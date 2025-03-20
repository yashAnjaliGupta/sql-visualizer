import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface TableNodeData {
    tableName: string;
    columns: { name: string; columnId: string }[];
    width?: number;
    height?: number; 
}

const CustomNode = ({ data }: { data: TableNodeData }) => {
    const onChange = useCallback(() => {
        console.log('changed');
    }, []);

    return (
        <div style={{ padding: 10, border: '1px solid #777', borderRadius: 4, background: '#fff', width: data.width || '250px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>{data.tableName}</div>
            {data.columns.map(({ name, columnId }, index) => (
                <div key={index} style={{ position: 'relative', marginBottom: 6 }}>
                    <Handle
                        type="target"
                        position={Position.Left}
                        id={`target-${columnId}`}
                        style={{ top: '50%', background: '#555', width: 10, height: 10 }}
                    />
                    <span style={{ margin: '0 20px', display: 'block', whiteSpace: 'normal', fontSize: '12px', overflowWrap: 'break-word' }}>{name}</span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id={`source-${columnId}`}
                        style={{ top: '50%', background: '#555', width: 10, height: 10 }}
                    />
                </div>
            ))}
        </div>
    );
};

export default CustomNode;