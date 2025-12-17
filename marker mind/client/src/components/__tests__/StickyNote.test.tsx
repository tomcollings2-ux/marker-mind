import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StickyNote } from '@/components/StickyNote';
import type { StickyNote as StickyNoteType } from '@shared/schema';

const createTestNote = (overrides?: Partial<StickyNoteType>): StickyNoteType => ({
    id: 'test-note-1',
    text: 'Test Note',
    x: 100,
    y: 100,
    color: 'yellow',
    rotation: 0,
    fontSize: 16,
    fontFamily: 'marker',
    width: 200,
    height: 200,
    shape: 'square',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
});

const renderWithProviders = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                {ui}
            </TooltipProvider>
        </QueryClientProvider>
    );
};

describe('StickyNote', () => {
    it('should render with text content', () => {
        const note = createTestNote({ text: 'Hello World' });
        const onUpdate = () => { };
        const onDelete = () => { };

        renderWithProviders(
            <StickyNote
                note={note}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
        );

        // Check if text appears (it may appear in measurement div too)
        const textElements = screen.getAllByText('Hello World');
        expect(textElements.length).toBeGreaterThan(0);
    });

    it('should show placeholder when text is empty', () => {
        const note = createTestNote({ text: '' });
        const onUpdate = () => { };
        const onDelete = () => { };

        renderWithProviders(
            <StickyNote
                note={note}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
        );

        // Placeholder appears in both measure div and visible span
        const placeholders = screen.getAllByText(/Double click to edit/i);
        expect(placeholders.length).toBeGreaterThan(0);
    });

    it('should apply correct color class for yellow note', () => {
        const note = createTestNote({ color: 'yellow' });
        const onUpdate = () => { };
        const onDelete = () => { };

        const { container } = renderWithProviders(
            <StickyNote
                note={note}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
        );

        const noteElement = container.querySelector('[data-testid^="sticky-note-"]');
        expect(noteElement).toHaveClass('bg-note-yellow');
    });

    it('should have correct dimensions', () => {
        const note = createTestNote({ width: 300, height: 250 });
        const onUpdate = () => { };
        const onDelete = () => { };

        const { container } = renderWithProviders(
            <StickyNote
                note={note}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
        );

        const noteElement = container.querySelector('[data-testid^="sticky-note-"]') as HTMLElement;
        expect(noteElement?.style.width).toBe('300px');
        expect(noteElement?.style.height).toBe('250px');
    });
});
