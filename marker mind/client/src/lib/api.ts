import type { Board, StickyNote, Drawing, TextLabel, Line, BoardImage } from '@shared/schema';

const API_BASE = '/api';

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
  const res = await fetch(`${API_BASE}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boardName })
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

export async function getAllBoards(): Promise<Board[]> {
  const res = await fetch(`${API_BASE}/boards`);
  if (!res.ok) throw new Error('Failed to fetch boards');
  return res.json();
}

export async function getBoard(id: string): Promise<BoardWithElements> {
  const res = await fetch(`${API_BASE}/boards/${id}`);
  if (!res.ok) throw new Error('Failed to fetch board');
  return res.json();
}

export async function updateBoard(id: string, boardName: string): Promise<Board> {
  const res = await fetch(`${API_BASE}/boards/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boardName })
  });
  if (!res.ok) throw new Error('Failed to update board');
  return res.json();
}

export async function deleteBoard(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/boards/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete board');
}

// ============ STICKY NOTES ============

export async function createStickyNote(data: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<StickyNote> {
  const res = await fetch(`${API_BASE}/sticky-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create sticky note');
  return res.json();
}

export async function updateStickyNote(id: string, data: Partial<Omit<StickyNote, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>>): Promise<StickyNote> {
  const res = await fetch(`${API_BASE}/sticky-notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update sticky note');
  return res.json();
}

export async function deleteStickyNote(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sticky-notes/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete sticky note');
}

// ============ DRAWINGS ============

export async function createDrawing(data: Omit<Drawing, 'id' | 'createdAt'>): Promise<Drawing> {
  const res = await fetch(`${API_BASE}/drawings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create drawing');
  return res.json();
}

export async function deleteDrawing(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/drawings/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete drawing');
}

// ============ TEXT LABELS ============

export async function createTextLabel(data: Omit<TextLabel, 'id' | 'createdAt' | 'updatedAt'>): Promise<TextLabel> {
  const res = await fetch(`${API_BASE}/text-labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create text label');
  return res.json();
}

export async function updateTextLabel(id: string, data: Partial<Omit<TextLabel, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>>): Promise<TextLabel> {
  const res = await fetch(`${API_BASE}/text-labels/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update text label');
  return res.json();
}

export async function deleteTextLabel(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/text-labels/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete text label');
}

// ============ LINES ============

export async function createLine(data: Omit<Line, 'id' | 'createdAt'>): Promise<Line> {
  const res = await fetch(`${API_BASE}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create line');
  return res.json();
}

export async function updateLine(id: string, data: Partial<Omit<Line, 'id' | 'boardId' | 'createdAt'>>): Promise<Line> {
  const res = await fetch(`${API_BASE}/lines/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update line');
  return res.json();
}

export async function deleteLine(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/lines/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete line');
}

// ============ BOARD IMAGES ============

export async function createBoardImage(data: Omit<BoardImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<BoardImage> {
  const res = await fetch(`${API_BASE}/board-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create board image');
  return res.json();
}

export async function updateBoardImage(id: string, data: Partial<Omit<BoardImage, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>>): Promise<BoardImage> {
  const res = await fetch(`${API_BASE}/board-images/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update board image');
  return res.json();
}

export async function deleteBoardImage(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/board-images/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete board image');
}
