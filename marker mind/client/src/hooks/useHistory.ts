import { useState, useCallback } from 'react';

export interface HistoryAction {
    type: 'batch' | 'create' | 'update' | 'delete' | 'move';
    elementType?: 'note' | 'label' | 'line' | 'drawing' | 'image';
    description?: string;
    actions?: HistoryAction[];
    before: any;
    after: any;
}

interface UseHistoryReturn {
    push: (action: HistoryAction) => void;
    undo: () => any | null;
    redo: () => any | null;
    canUndo: boolean;
    canRedo: boolean;
    clear: () => void;
}

export function useHistory(maxSize = 20): UseHistoryReturn {
    const [past, setPast] = useState<HistoryAction[]>([]);
    const [future, setFuture] = useState<HistoryAction[]>([]);

    const push = useCallback((action: HistoryAction) => {
        setPast(prev => {
            const newPast = [...prev, action];
            // Keep only last maxSize items (FIFO)
            if (newPast.length > maxSize) {
                return newPast.slice(newPast.length - maxSize);
            }
            return newPast;
        });
        // Clear future when new action is pushed
        setFuture([]);
    }, [maxSize]);

    const undo = useCallback((): any | null => {
        if (past.length === 0) return null;

        const lastAction = past[past.length - 1];

        // Move action from past to future
        setPast(prev => prev.slice(0, -1));
        setFuture(prev => [...prev, lastAction]);

        // Return the 'before' state to restore
        return lastAction.before;
    }, [past]);

    const redo = useCallback((): any | null => {
        if (future.length === 0) return null;

        const nextAction = future[future.length - 1];

        // Move action from future to past
        setFuture(prev => prev.slice(0, -1));
        setPast(prev => [...prev, nextAction]);

        // Return the 'after' state to apply
        return nextAction.after;
    }, [future]);

    const clear = useCallback(() => {
        setPast([]);
        setFuture([]);
    }, []);

    return {
        push,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        clear,
    };
}
