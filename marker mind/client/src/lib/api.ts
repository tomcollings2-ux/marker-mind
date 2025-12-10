import type { Board, StickyNote, Drawing, TextLabel, Line, BoardImage } from '@shared/schema';
import { mockApi } from './mock-api';

const USE_MOCK = false; // Set to false when backend is available

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
  if (USE_MOCK) {
    const mockBoard = await mockApi.createBoard(boardName);
    return {
      id: mockBoard.id,
      boardName: mockBoard.name,
      userId: mockBoard.userId,
      createdAt: new Date(mockBoard.createdAt),
      updatedAt: new Date(mockBoard.updatedAt)
    };
  }

  const res = await fetch(`/api/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boardName })
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

export async function getBoard(id: string): Promise<BoardWithElements> {
  if (USE_MOCK) {
    const board = await mockApi.getBoard(id);
    return {
      board: {
        id: board.id,
        boardName: board.name,
        userId: board.userId,
        createdAt: new Date(board.createdAt),
        updatedAt: new Date(board.updatedAt)
      },
      stickyNotes: board.stickyNotes,
      drawings: board.drawings,
      textLabels: board.textLabels,
      lines: board.lines,
      images: board.images
    };
  }

  const res = await fetch(`/api/boards/${id}`);
  if (!res.ok) throw new Error('Failed to fetch board');
  return res.json();
}

export async function clearBoard(id: string): Promise<void> {
  if (USE_MOCK) {
    const board = await mockApi.getBoard(id);
    if (board) {
      board.stickyNotes = [];
      board.drawings = [];
      board.textLabels = [];
      board.lines = [];
      board.images = [];
    }
    return;
  }

  const res = await fetch(`/api/boards/${id}/clear`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to clear board');
}

export async function saveBoard(id: string, content: any): Promise<void> {
  if (USE_MOCK) return; // Mock automatically handled by local obj changes? Actually mock behavior is weird here, but let's focus on backend.

  const res = await fetch(`/api/boards/${id}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Save failed with status ${res.status}: ${errorText}`);
    throw new Error(`Failed to save board: ${res.status} ${res.statusText}`);
  }
}

// ============ STICKY NOTES ============

export async function createStickyNote(data: any): Promise<StickyNote> {
  if (USE_MOCK) return mockApi.createStickyNote(data);

  const res = await fetch(`/api/sticky-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create sticky note');
  return res.json();
}

export async function updateStickyNote(id: string, data: any): Promise<StickyNote> {
  if (USE_MOCK) return mockApi.updateStickyNote(id, data);

  const res = await fetch(`/api/sticky-notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update sticky note');
  return res.json();
}

export async function deleteStickyNote(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteStickyNote(id);

  const res = await fetch(`/api/sticky-notes/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete sticky note');
}

// ============ DRAWINGS ============

export async function createDrawing(data: any): Promise<Drawing> {
  if (USE_MOCK) return mockApi.createDrawing(data);

  const res = await fetch(`/api/drawings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create drawing');
  return res.json();
}

export async function deleteDrawing(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteDrawing(id);

  const res = await fetch(`/api/drawings/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete drawing');
}

// ============ TEXT LABELS ============

export async function createTextLabel(data: any): Promise<TextLabel> {
  if (USE_MOCK) return mockApi.createTextLabel(data);

  const res = await fetch(`/api/text-labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create text label');
  return res.json();
}

export async function updateTextLabel(id: string, data: any): Promise<TextLabel> {
  if (USE_MOCK) return mockApi.updateTextLabel(id, data);

  const res = await fetch(`/api/text-labels/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update text label');
  return res.json();
}

export async function deleteTextLabel(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteTextLabel(id);

  const res = await fetch(`/api/text-labels/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete text label');
}

// ============ LINES ============

export async function createLine(data: any): Promise<Line> {
  if (USE_MOCK) return mockApi.createLine(data);

  const res = await fetch(`/api/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create line');
  return res.json();
}

export async function updateLine(id: string, data: any): Promise<Line> {
  if (USE_MOCK) return mockApi.updateLine(id, data);

  const res = await fetch(`/api/lines/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update line');
  return res.json();
}

export async function deleteLine(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteLine(id);

  const res = await fetch(`/api/lines/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete line');
}

// ============ BOARD IMAGES ============

export async function createBoardImage(data: any): Promise<BoardImage> {
  if (USE_MOCK) return mockApi.createBoardImage(data);

  const res = await fetch(`/api/board-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create board image');
  return res.json();
}

export async function updateBoardImage(id: string, data: any): Promise<BoardImage> {
  if (USE_MOCK) return mockApi.updateBoardImage(id, data);

  const res = await fetch(`/api/board-images/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update board image');
  return res.json();
}

export async function deleteBoardImage(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteBoardImage(id);

  const res = await fetch(`/api/board-images/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete board image');
}
