// Mock API using localStorage for offline development
const STORAGE_KEY = 'marker-mind-board';

interface Board {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    stickyNotes: any[];
    drawings: any[];
    textLabels: any[];
    lines: any[];
    images: any[];
}

let currentBoard: Board = {
    id: '1',
    name: 'My Board',
    userId: 'mock-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    stickyNotes: [],
    drawings: [],
    textLabels: [],
    lines: [],
    images: [],
};

// Load from localStorage on init
const stored = localStorage.getItem(STORAGE_KEY);
if (stored) {
    try {
        currentBoard = JSON.parse(stored);
    } catch (e) {
        console.warn('Failed to load board from localStorage');
    }
}

const saveBoard = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentBoard));
};

export const mockApi = {
    createBoard: async (name: string) => {
        currentBoard = {
            id: '1',
            name,
            userId: 'mock-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
            stickyNotes: [],
            drawings: [],
            textLabels: [],
            lines: [],
            images: []
        };
        saveBoard();
        return currentBoard;
    },

    getBoard: async (id: string) => {
        return currentBoard;
    },

    createStickyNote: async (data: any) => {
        const note = { ...data, id: Date.now().toString() };
        currentBoard.stickyNotes.push(note);
        saveBoard();
        return note;
    },

    updateStickyNote: async (id: string, updates: any) => {
        const note = currentBoard.stickyNotes.find(n => n.id === id);
        if (note) Object.assign(note, updates);
        saveBoard();
        return note;
    },

    deleteStickyNote: async (id: string) => {
        currentBoard.stickyNotes = currentBoard.stickyNotes.filter(n => n.id !== id);
        saveBoard();
    },

    createDrawing: async (data: any) => {
        const drawing = { ...data, id: Date.now().toString() };
        currentBoard.drawings.push(drawing);
        saveBoard();
        return drawing;
    },

    deleteDrawing: async (id: string) => {
        currentBoard.drawings = currentBoard.drawings.filter(d => d.id !== id);
        saveBoard();
    },

    createTextLabel: async (data: any) => {
        const label = { ...data, id: Date.now().toString() };
        currentBoard.textLabels.push(label);
        saveBoard();
        return label;
    },

    updateTextLabel: async (id: string, updates: any) => {
        const label = currentBoard.textLabels.find(l => l.id === id);
        if (label) Object.assign(label, updates);
        saveBoard();
        return label;
    },

    deleteTextLabel: async (id: string) => {
        currentBoard.textLabels = currentBoard.textLabels.filter(l => l.id !== id);
        saveBoard();
    },

    createLine: async (data: any) => {
        const line = { ...data, id: Date.now().toString() };
        currentBoard.lines.push(line);
        saveBoard();
        return line;
    },

    updateLine: async (id: string, updates: any) => {
        const line = currentBoard.lines.find(l => l.id === id);
        if (line) Object.assign(line, updates);
        saveBoard();
        return line;
    },

    deleteLine: async (id: string) => {
        currentBoard.lines = currentBoard.lines.filter(l => l.id !== id);
        saveBoard();
    },

    createBoardImage: async (data: any) => {
        const image = { ...data, id: Date.now().toString() };
        currentBoard.images.push(image);
        saveBoard();
        return image;
    },

    updateBoardImage: async (id: string, updates: any) => {
        const image = currentBoard.images.find(i => i.id === id);
        if (image) Object.assign(image, updates);
        saveBoard();
        return image;
    },

    deleteBoardImage: async (id: string) => {
        currentBoard.images = currentBoard.images.filter(i => i.id !== id);
        saveBoard();
    },
};
