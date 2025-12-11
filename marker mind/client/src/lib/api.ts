import type { Board, StickyNote, Drawing, TextLabel, Line, BoardImage } from '@shared/schema';

export interface BoardWithElements {
  board: Board;
  stickyNotes: StickyNote[];
  drawings: Drawing[];
  textLabels: TextLabel[];
  lines: Line[];
  images: BoardImage[];
}

// ============ BOARDS ============

export async function createBoard(boardName: string): Promise<Board> {
  const res = await fetch(`/api/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boardName })
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

export async function getBoard(id: string): Promise<BoardWithElements> {
  const res = await fetch(`/api/boards/${id}`);
  if (!res.ok) throw new Error('Failed to fetch board');
  return res.json();
}

export async function clearBoard(id: string): Promise<void> {
  const res = await fetch(`/api/boards/${id}/clear`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to clear board');
}

export async function saveBoard(id: string, content: any): Promise<void> {
  const res = await fetch(`/api/boards/${id}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content)
  });

  if (!res.ok) {
    const errorText = await res.text();
    // Error will be handled by calling code with toast notification
    throw new Error(`Save failed with status ${res.status}: ${errorText}`);
  }
}
