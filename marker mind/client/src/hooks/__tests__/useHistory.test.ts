import { describe, it, expect } from 'vitest';
import { useHistory } from '@/hooks/useHistory';
import { renderHook, act } from '@testing-library/react';

describe('useHistory', () => {
    it('should initialize with no history', () => {
        const { result } = renderHook(() => useHistory(20));

        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
    });

    it('should allow pushing actions to history', () => {
        const { result } = renderHook(() => useHistory(20));

        act(() => {
            result.current.push({
                type: 'create',
                elementType: 'note',
                before: null,
                after: { id: '1', text: 'Test' },
            });
        });

        expect(result.current.canUndo).toBe(true);
        expect(result.current.canRedo).toBe(false);
    });

    it('should undo actions', () => {
        const { result } = renderHook(() => useHistory(20));

        const beforeState = { notes: [] };
        const afterState = { notes: [{ id: '1' }] };

        act(() => {
            result.current.push({
                type: 'create',
                before: beforeState,
                after: afterState,
            });
        });

        expect(result.current.canUndo).toBe(true);

        let undoResult: any;
        act(() => {
            undoResult = result.current.undo();
        });

        expect(undoResult).toEqual(beforeState);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(true);
    });

    it('should redo actions', () => {
        const { result } = renderHook(() => useHistory(20));

        const beforeState = { notes: [] };
        const afterState = { notes: [{ id: '1' }] };

        act(() => {
            result.current.push({
                type: 'create',
                before: beforeState,
                after: afterState,
            });
        });

        act(() => {
            result.current.undo();
        });

        expect(result.current.canRedo).toBe(true);

        let redoResult: any;
        act(() => {
            redoResult = result.current.redo();
        });

        expect(redoResult).toEqual(afterState);
        expect(result.current.canUndo).toBe(true);
        expect(result.current.canRedo).toBe(false);
    });

    it('should limit history size', () => {
        const { result } = renderHook(() => useHistory(3));

        act(() => {
            result.current.push({ type: 'create', before: 1, after: 2 });
            result.current.push({ type: 'update', before: 2, after: 3 });
            result.current.push({ type: 'update', before: 3, after: 4 });
            result.current.push({ type: 'update', before: 4, after: 5 });
        });

        // Should only keep last 3 items
        let undoCount = 0;
        while (result.current.canUndo) {
            act(() => {
                result.current.undo();
            });
            undoCount++;
        }

        expect(undoCount).toBe(3);
    });

    it('should clear future when new action is pushed', () => {
        const { result } = renderHook(() => useHistory(20));

        act(() => {
            result.current.push({ type: 'create', before: 1, after: 2 });
            result.current.push({ type: 'update', before: 2, after: 3 });
        });

        // Undo one action
        act(() => {
            result.current.undo();
        });

        // Should be able to redo after undo
        expect(result.current.canRedo).toBe(true);

        // Pushing a new action should clear the redo stack
        act(() => {
            result.current.push({ type: 'update', before: 2, after: 4 });
        });

        // Now redo should not be available
        expect(result.current.canRedo).toBe(false);
        // But undo should be available (we have 2 actions now)
        expect(result.current.canUndo).toBe(true);
    });

    it('should clear all history', () => {
        const { result } = renderHook(() => useHistory(20));

        act(() => {
            result.current.push({ type: 'create', before: 1, after: 2 });
            result.current.push({ type: 'update', before: 2, after: 3 });
        });

        expect(result.current.canUndo).toBe(true);

        act(() => {
            result.current.clear();
        });

        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
    });
});
