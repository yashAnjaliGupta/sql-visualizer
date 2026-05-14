import { useState,useCallback } from "react";


export const useColumnHighlights=(columnHighlights:any)=>{
    const [activeEditorHighlights, setActiveEditorHighlights] = useState<any[]>([]);
    const [activeColumns, setActiveColumns] = useState<string[]>([]);

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

    return {
        activeEditorHighlights,
        activeColumns,
        handleHoverColumn,
        handleHighlightColumns,
    };
}