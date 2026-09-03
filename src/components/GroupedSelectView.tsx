import React, { useMemo } from 'react';
import FlowDiagram from '../flowDiagram/FlowDiagram';
import type { SelectGraph } from '../hooks/SQLparser.hook';

interface Theme {
    background?: string;
    secondary?: string;
    border?: string;
    primary?: string;
    text?: string;
    mutedText?: string;
    isDark?: boolean;
    [key: string]: any;
}

interface GroupedSelectViewProps {
    selectGraphs: SelectGraph[];
    theme: Theme;
    onHoverColumn?: (columnId: string | null) => void;
    onHighlightColumns?: (columnIds: string[]) => void;
}

function prefixHandle(handle?: string, prefix?: string): string {
    if (!handle || !prefix) return handle || '';
    if (handle.startsWith('source-')) {
        return `source-${prefix}${handle.slice(7)}`;
    }
    if (handle.startsWith('target-')) {
        return `target-${prefix}${handle.slice(7)}`;
    }
    return `${prefix}${handle}`;
}

const VERTICAL_QUERY_GAP = 140;

const GroupedSelectView: React.FC<GroupedSelectViewProps> = ({
    selectGraphs,
    theme,
    onHoverColumn,
    onHighlightColumns,
}) => {
    const muted = theme.mutedText || '#94A3B8';

    // Merge and vertically stack all SELECT graphs into a single unified graph
    const { stackedNodes, stackedEdges } = useMemo(() => {
        const nodes: any[] = [];
        const edges: any[] = [];
        let currentOffsetY = 0;

        selectGraphs.forEach((sg, qIdx) => {
            if (!sg.nodes || sg.nodes.length === 0) return;

            const prefix = `q${qIdx}_`;

            // Compute vertical bounds of this query's nodes
            let gMinY = Infinity;
            let gMaxY = -Infinity;

            sg.nodes.forEach(node => {
                const colCount = node.data?.columns?.length || 0;
                const nodeHeight = 50 + colCount * 30;
                const y = node.position?.y ?? 0;
                if (y < gMinY) gMinY = y;
                if (y + nodeHeight > gMaxY) gMaxY = y + nodeHeight;
            });

            if (gMinY === Infinity) gMinY = 0;
            if (gMaxY === -Infinity) gMaxY = 200;

            const yShift = currentOffsetY - gMinY;

            // Stack nodes with shifted Y and unique IDs
            sg.nodes.forEach(node => {
                nodes.push({
                    ...node,
                    id: `${prefix}${node.id}`,
                    position: {
                        x: node.position?.x ?? 0,
                        y: (node.position?.y ?? 0) + yShift,
                    },
                    data: {
                        ...node.data,
                        columns: (node.data?.columns || []).map(col => ({
                            ...col,
                            columnId: `${prefix}${col.columnId}`,
                        })),
                    },
                });
            });

            // Map edges to match prefixed node and handle IDs
            (sg.edges || []).forEach(edge => {
                edges.push({
                    ...edge,
                    id: `${prefix}${edge.id}`,
                    source: `${prefix}${edge.source}`,
                    target: `${prefix}${edge.target}`,
                    sourceHandle: prefixHandle(edge.sourceHandle, prefix),
                    targetHandle: prefixHandle(edge.targetHandle, prefix),
                });
            });

            const graphHeight = Math.max(gMaxY - gMinY, 120);
            currentOffsetY += graphHeight + VERTICAL_QUERY_GAP;
        });

        return { stackedNodes: nodes, stackedEdges: edges };
    }, [selectGraphs]);

    if (selectGraphs.length === 0 || stackedNodes.length === 0) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted }}>
                No SELECT statements found.
            </div>
        );
    }

    const handleHover = (columnId: string | null) => {
        if (!columnId) {
            onHoverColumn?.(null);
            return;
        }
        onHoverColumn?.(columnId.replace(/^q\d+_/, ''));
    };

    const handleHighlight = (columnIds: string[]) => {
        onHighlightColumns?.(columnIds.map(id => id.replace(/^q\d+_/, '')));
    };

    return (
        <div style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
            <FlowDiagram
                tableNodes={stackedNodes}
                tableEdges={stackedEdges}
                theme={theme}
                onHoverColumn={handleHover}
                onHighlightColumns={handleHighlight}
                style={{ flex: 1, width: '100%', height: '100%', margin: 0, borderRadius: 0, border: 'none' }}
            />
        </div>
    );
};

export default GroupedSelectView;
