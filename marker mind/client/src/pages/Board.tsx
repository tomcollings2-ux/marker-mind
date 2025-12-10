import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHistory } from '@/hooks/useHistory';
import type { StickyNote as StickyNoteType, TextLabel as TextLabelType, Line as LineType, BoardImage as BoardImageType } from '@shared/schema';
import type { Line } from '@shared/schema';
import * as api from '@/lib/api';
import { StickyNote } from '@/components/StickyNote';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { LineCanvas } from '@/components/LineCanvas';
import { TextLabel } from '@/components/TextLabel';
import { BoardImage } from '@/components/BoardImage';
import { Toolbar } from '@/components/Toolbar';
import { ZoomControls } from '@/components/ZoomControls';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Home, LogOut, User, Settings } from 'lucide-react';
import textureImage from '@assets/generated_images/subtle_whiteboard_texture.png';
import { useRoute, useLocation } from 'wouter';

type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange';
type Tool = 'cursor' | 'pen' | 'text' | 'line';

interface ToolSettings {
  penColor: string;
  penThickness: number;
  lineColor: string;
  lineThickness: number;
  textColor: string;
  textSize: number;
}

const DEFAULT_NOTE_WIDTH = 200;
const DEFAULT_NOTE_HEIGHT = 200;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;


type PresetType = 'kanban' | 'swot' | 'persona' | 'brainstorm' | 'pros_cons' | 'timeline' | 'rocket';

export default function Board() {
  const [, params] = useRoute('/board/:id');
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const boardId = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [currentTool, setCurrentTool] = useState<Tool>('cursor');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Track newly created elements for auto-focus
  const [newlyCreatedIds, setNewlyCreatedIds] = useState<Set<string>>(new Set());

  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    penColor: '#000000',
    penThickness: 3,
    lineColor: '#000000',
    lineThickness: 3,
    textColor: '#000000',
    textSize: 24,
  });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const handleGoToDashboard = () => {
    setLocation('/');
  };

  useEffect(() => {
    if (!boardId) {
      api.createBoard('My Awesome Board').then(board => {
        setLocation(`/board/${board.id}`);
      }).catch(err => {
        console.error('Failed to create board:', err);
        toast({ title: 'Error', description: 'Failed to create board', variant: 'destructive' });
      });
    }
  }, [boardId, setLocation, toast]);

  const { data: serverBoardData, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardId ? api.getBoard(boardId) : Promise.reject('No board ID'),
    enabled: !!boardId,
    refetchOnWindowFocus: false,
  });

  const [localBoard, setLocalBoard] = useState<{
    stickyNotes: StickyNoteType[];
    drawings: any[];
    textLabels: TextLabelType[];
    lines: LineType[];
    images: BoardImageType[];
  } | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (serverBoardData && !localBoard && !hasUnsavedChanges) {
      setLocalBoard({
        stickyNotes: serverBoardData.stickyNotes,
        drawings: serverBoardData.drawings,
        textLabels: serverBoardData.textLabels,
        lines: serverBoardData.lines,
        images: serverBoardData.images,
      });
    }
  }, [serverBoardData, localBoard, hasUnsavedChanges]);

  // Warn user before leaving page if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for some browsers
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // History management for undo/redo
  const history = useHistory(20);

  // Safe undo with error handling
  const safeUndo = useCallback(() => {
    try {
      const previousState = history.undo();
      if (previousState && localBoard) {
        setLocalBoard(previousState);
        setHasUnsavedChanges(true); // Undo creates an unsaved state
        toast({ title: "Undone", description: "Action reversed" });
      }
    } catch (error) {
      console.error('Undo failed:', error);
      toast({
        title: "Undo Failed",
        description: "Could not undo action. State may be corrupted.",
        variant: "destructive"
      });
    }
  }, [history, localBoard, toast]);

  // Safe redo with error handling
  const safeRedo = useCallback(() => {
    try {
      const nextState = history.redo();
      if (nextState && localBoard) {
        setLocalBoard(nextState);
        setHasUnsavedChanges(true); // Redo creates an unsaved state
        toast({ title: "Redone", description: "Action reapplied" });
      }
    } catch (error) {
      console.error('Redo failed:', error);
      toast({
        title: "Redo Failed",
        description: "Could not redo action.",
        variant: "destructive"
      });
    }
  }, [history, localBoard, toast]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const isEditableElement = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tagName = el.tagName.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || el.isContentEditable;
    };

    const handleKeyboard = (e: KeyboardEvent) => {
      if (isEditableElement(e.target)) return;

      const isMac = navigator.platform.includes('Mac');
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        safeUndo();
      }
      if (modifier && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        safeRedo();
      }
      // Alternative redo shortcut (Ctrl/Cmd+Y)
      if (modifier && e.key === 'y') {
        e.preventDefault();
        safeRedo();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [safeUndo, safeRedo]);

  // Use local board for rendering if available, otherwise fallback (though we wait for loading)
  const boardData = localBoard ? { ...serverBoardData, ...localBoard } : serverBoardData;

  // Helper to generate UUID
  const generateId = () => crypto.randomUUID();

  // Sticky Note Handlers
  const handleUpdateNote = (id: string, updates: Partial<StickyNoteType>) => {
    const beforeState = localBoard || { stickyNotes: [], drawings: [], textLabels: [], lines: [], images: [] };

    setLocalBoard(prev => {
      const current = prev || { stickyNotes: [], drawings: [], textLabels: [], lines: [], images: [] };
      const afterState = {
        ...current,
        stickyNotes: current.stickyNotes.map(n => n.id === id ? { ...n, ...updates } : n)
      };

      // Record action in history
      history.push({
        type: 'update',
        elementType: 'note',
        before: beforeState,
        after: afterState
      });

      return afterState;
    });
    setHasUnsavedChanges(true);
  };

  const handleDeleteNote = (id: string) => {
    const beforeState = localBoard || { stickyNotes: [], drawings: [], textLabels: [], lines: [], images: [] };

    setLocalBoard(prev => {
      const current = prev || { stickyNotes: [], drawings: [], textLabels: [], lines: [], images: [] };
      const afterState = {
        ...current,
        stickyNotes: current.stickyNotes.filter(n => n.id !== id)
      };

      // Record action in history
      history.push({
        type: 'delete',
        elementType: 'note',
        before: beforeState,
        after: afterState
      });

      return afterState;
    });
    setHasUnsavedChanges(true);
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  const createNote = (note: Omit<StickyNoteType, 'id' | 'createdAt' | 'updatedAt'>) => {
    const beforeState = localBoard || { stickyNotes: [], drawings: [], textLabels: [], lines: [], images: [] };

    const newNote: StickyNoteType = {
      ...note,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      boardId: boardId!,
      width: note.width || DEFAULT_NOTE_WIDTH,
      height: note.height || DEFAULT_NOTE_HEIGHT,
    };

    setLocalBoard(prev => {
      const current = prev || { stickyNotes: [], drawings: [], textLabels: [], lines: [], images: [] };
      const afterState = {
        ...current,
        stickyNotes: [...current.stickyNotes, newNote]
      };

      // Record creation in history
      history.push({
        type: 'create',
        elementType: 'note',
        before: beforeState,
        after: afterState
      });

      return afterState;
    });

    setHasUnsavedChanges(true);
    setSelectedNoteId(newNote.id);
    setNewlyCreatedIds(prev => new Set(prev).add(newNote.id)); // Mark as new
    setCurrentTool('cursor');

    // Remove from newly created after a short delay to allow auto-focus
    setTimeout(() => {
      setNewlyCreatedIds(prev => {
        const next = new Set(prev);
        next.delete(newNote.id);
        return next;
      });
    }, 100);
  };

  // Drawing Handlers
  const handleAddDrawingLocal = (drawingData: any) => {
    const newDrawing = {
      ...drawingData,
      id: generateId(),
      boardId: boardId!,
      createdAt: new Date()
    };
    setLocalBoard(prev => prev ? ({
      ...prev,
      drawings: [...prev.drawings, newDrawing]
    }) : null);
    setHasUnsavedChanges(true);
  };

  // Text Label Handlers
  const handleCreateTextLabel = (labelData: any) => {
    const newLabel: TextLabelType = {
      ...labelData,
      id: generateId(),
      boardId: boardId!,
      createdAt: new Date(),
      updatedAt: new Date(),
      text: labelData.text || '', // Ensure text is string
    };
    setLocalBoard(prev => prev ? ({
      ...prev,
      textLabels: [...prev.textLabels, newLabel]
    }) : null);
    setHasUnsavedChanges(true);
    setSelectedLabelId(newLabel.id);
    setNewlyCreatedIds(prev => new Set(prev).add(newLabel.id)); // Mark as new
    setCurrentTool('cursor');

    // Remove from newly created after a short delay
    setTimeout(() => {
      setNewlyCreatedIds(prev => {
        const next = new Set(prev);
        next.delete(newLabel.id);
        return next;
      });
    }, 100);
  };

  const handleUpdateTextLabel = (id: string, updates: Partial<TextLabelType>) => {
    setLocalBoard(prev => prev ? ({
      ...prev,
      textLabels: prev.textLabels.map(l => l.id === id ? { ...l, ...updates } : l)
    }) : null);
    setHasUnsavedChanges(true);
  };

  const handleDeleteTextLabel = (id: string) => {
    setLocalBoard(prev => prev ? ({
      ...prev,
      textLabels: prev.textLabels.filter(l => l.id !== id)
    }) : null);
    setHasUnsavedChanges(true);
    if (selectedLabelId === id) setSelectedLabelId(null);
  };

  // Line Handlers
  const handleCreateLine = (lineData: any) => {
    const newLine: LineType = {
      ...lineData,
      id: generateId(),
      boardId: boardId!,
      createdAt: new Date()
    };
    setLocalBoard(prev => prev ? ({
      ...prev,
      lines: [...prev.lines, newLine]
    }) : null);
    setHasUnsavedChanges(true);
  };

  const handleUpdateLine = (id: string, updates: Partial<LineType>) => {
    setLocalBoard(prev => prev ? ({
      ...prev,
      lines: prev.lines.map(l => l.id === id ? { ...l, ...updates } : l)
    }) : null);
    setHasUnsavedChanges(true);
  };

  const handleDeleteLine = (id: string) => {
    setLocalBoard(prev => prev ? ({
      ...prev,
      lines: prev.lines.filter(l => l.id !== id)
    }) : null);
    setHasUnsavedChanges(true);
    if (selectedLineId === id) setSelectedLineId(null);
  };

  // Board Image Handlers
  const handleCreateBoardImage = (imageData: any) => {
    const newImage: BoardImageType = {
      ...imageData,
      id: generateId(),
      boardId: boardId!,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setLocalBoard(prev => prev ? ({
      ...prev,
      images: [...prev.images, newImage]
    }) : null);
    setHasUnsavedChanges(true);
    setSelectedImageId(newImage.id);
  };

  const handleUpdateBoardImage = (id: string, updates: Partial<BoardImageType>) => {
    setLocalBoard(prev => prev ? ({
      ...prev,
      images: prev.images.map(i => i.id === id ? { ...i, ...updates } : i)
    }) : null);
    setHasUnsavedChanges(true);
  };

  const handleDeleteBoardImage = (id: string) => {
    setLocalBoard(prev => prev ? ({
      ...prev,
      images: prev.images.filter(i => i.id !== id)
    }) : null);
    setHasUnsavedChanges(true);
    if (selectedImageId === id) setSelectedImageId(null);
  };
  // Clear board local
  const handleClearBoard = () => {
    setLocalBoard({
      stickyNotes: [],
      drawings: [],
      textLabels: [],
      lines: [],
      images: [],
    });
    setHasUnsavedChanges(true);
    toast({ title: "Board Cleared", description: "This is a local change. Save to persist." });
    clearSelection();
    setClearDialogOpen(false);
  };

  const saveBoardMutation = useMutation({
    mutationFn: async () => {
      if (!boardId || !localBoard) return;
      await api.saveBoard(boardId, localBoard);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] }); // Refresh from server to be sure
      setHasUnsavedChanges(false);
      toast({ title: "Board Saved", description: "Your changes have been saved to the server." });
    },
    onError: (error) => {
      console.error("Failed to save board:", error);
      toast({
        title: "Save Failed",
        description: "Could not save changes to the server. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    console.log("Saving board...");
    saveBoardMutation.mutate();
  };

  const clearSelection = useCallback(() => {
    setSelectedNoteId(null);
    setSelectedLabelId(null);
    setSelectedLineId(null);
    setSelectedImageId(null);
  }, []);

  useEffect(() => {
    const isEditableElement = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tagName = el.tagName.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || el.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableElement(e.target)) return;
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Trackpad zoom disabled per user request
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Zoom only with buttons/slider, not trackpad
    return;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || isSpacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffset.current = { x: pan.x, y: pan.y };
    }
  }, [isSpacePressed, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panOffset.current.x + dx, y: panOffset.current.y + dy });
    }
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(z => {
      const currentPercent = Math.round(z * 100);
      const nextPercent = Math.ceil(currentPercent / 25) * 25 + 25;
      return Math.min(MAX_ZOOM, nextPercent / 100);
    });
  }, []);

  // Zoom out removed per user request

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }, [pan, zoom]);

  const handleAddNote = useCallback((color: NoteColor) => {
    if (!boardId) return;
    const centerScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const canvasPos = screenToCanvas(centerScreen.x, centerScreen.y);
    const x = canvasPos.x - DEFAULT_NOTE_WIDTH / 2 + (Math.random() * 100 - 50);
    const y = canvasPos.y - DEFAULT_NOTE_HEIGHT / 2 + (Math.random() * 100 - 50);
    const rotation = Math.floor(Math.random() * 10 - 5);
    createNote({
      boardId,
      text: '', x: Math.floor(x), y: Math.floor(y),
      color, shape: 'rectangle', rotation, width: null, height: null,
      fontSize: 18, fontFamily: 'marker', textColor: '#333333',
    });
  }, [boardId, screenToCanvas]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isPanning || isSpacePressed) return;
    if (currentTool === 'text' && boardId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasPos = screenToCanvas(screenX, screenY);
      handleCreateTextLabel({
        text: '', x: Math.floor(canvasPos.x), y: Math.floor(canvasPos.y),
        fontSize: toolSettings.textSize, fontStyle: 'handwritten', color: toolSettings.textColor, rotation: 0
      });
    } else {
      clearSelection();
    }
  }, [currentTool, boardId, clearSelection, isPanning, isSpacePressed, screenToCanvas, toolSettings]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNoteId) handleDeleteNote(selectedNoteId);
    if (selectedLabelId) handleDeleteTextLabel(selectedLabelId);
    if (selectedLineId) handleDeleteLine(selectedLineId);
    if (selectedImageId) handleDeleteBoardImage(selectedImageId);
  }, [selectedNoteId, selectedLabelId, selectedLineId, selectedImageId]);

  const handleUploadImage = useCallback((file: File) => {
    if (!boardId) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return;
      const centerScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const canvasPos = screenToCanvas(centerScreen.x, centerScreen.y);
      const x = canvasPos.x - 100 + (Math.random() * 50 - 25);
      const y = canvasPos.y - 100 + (Math.random() * 50 - 25);
      handleCreateBoardImage({
        src,
        x: Math.floor(x),
        y: Math.floor(y),
        width: 200,
        height: 200,
        rotation: 0
      });
    };
    reader.readAsDataURL(file);
  }, [boardId, screenToCanvas]);

  const handleLoadPreset = (preset: PresetType) => {
    if (!boardId) return;
    const centerW = window.innerWidth / 2;
    const centerH = window.innerHeight / 2 + 50;

    // Internal helpers for preset loading connecting to local state
    const addNote = (text: string, x: number, y: number, color: NoteColor, rotation = 0, width: number | null = null, height: number | null = null) => {
      createNote({
        boardId: boardId!,
        text,
        x: Math.floor(x),
        y: Math.floor(y),
        color,
        shape: 'rectangle', // Fixed shape for templates
        rotation,
        width,
        height,
        fontSize: 18,
        fontFamily: 'marker',
        textColor: '#333333'
      });
    };
    const addL = (x1: number, y1: number, x2: number, y2: number, thickness = 2) => {
      handleCreateLine({
        boardId: boardId!,
        x1, y1, x2, y2,
        color: '#888888',
        thickness,
        lineStyle: 'solid'
      });
    };
    const addLabel = (text: string, x: number, y: number, fontSize = 20) => {
      handleCreateTextLabel({
        boardId: boardId!,
        text,
        x: Math.floor(x),
        y: Math.floor(y),
        fontSize,
        fontStyle: 'marker',
        color: '#333333',
        rotation: 0
      });
    };

    switch (preset) {
      case 'kanban':
        const colW = 220;
        const startX = centerW - colW * 2;
        addLabel('Backlog', startX + 10, centerH - 220, 24);
        addLabel('In Progress', startX + colW + 10, centerH - 220, 24);
        addLabel('Needs Review', startX + colW * 2 + 10, centerH - 220, 24);
        addLabel('Approved', startX + colW * 3 + 10, centerH - 220, 24);
        addL(startX + colW, centerH - 250, startX + colW, centerH + 250);
        addL(startX + colW * 2, centerH - 250, startX + colW * 2, centerH + 250);
        addL(startX + colW * 3, centerH - 250, startX + colW * 3, centerH + 250);
        addNote('Task 1', startX + 20, centerH - 160, 'pink', -1, 140, 100);
        addNote('Task 2', startX + 20, centerH - 40, 'yellow', 1, 140, 100);
        addNote('In work', startX + colW + 20, centerH - 160, 'blue', 0, 140, 100);
        addNote('Review me', startX + colW * 2 + 20, centerH - 160, 'green', 2, 140, 100);
        addNote('Done!', startX + colW * 3 + 20, centerH - 160, 'orange', -1, 140, 100);
        break;
      case 'swot':
        const qW = 280;
        const qH = 200;
        const sX = centerW - qW;
        const sY = centerH - qH;
        addLabel('Strengths', sX + 20, sY - 10, 22);
        addLabel('Weaknesses', sX + qW + 20, sY - 10, 22);
        addLabel('Opportunities', sX + 20, sY + qH + 10, 22);
        addLabel('Threats', sX + qW + 20, sY + qH + 10, 22);
        addL(centerW, sY - 30, centerW, sY + qH * 2 + 50);
        addL(sX - 30, centerH, sX + qW * 2 + 30, centerH);
        addNote('', sX + 30, sY + 30, 'green', 0, 120, 100);
        addNote('', sX + qW + 30, sY + 30, 'yellow', 0, 120, 100);
        addNote('', sX + 30, sY + qH + 50, 'blue', 0, 120, 100);
        addNote('', sX + qW + 30, sY + qH + 50, 'pink', 0, 120, 100);
        break;
      case 'persona':
        addLabel('User Persona', centerW - 80, centerH - 250, 28);
        addNote('Name & Role', centerW - 350, centerH - 180, 'blue', -1, 180, 150);
        addNote('Goals', centerW - 90, centerH - 180, 'green', 1, 180, 150);
        addNote('Pain Points', centerW + 170, centerH - 180, 'pink', -2, 180, 150);
        addNote('Motivations', centerW - 250, centerH + 20, 'yellow', 2, 180, 150);
        addNote('Behaviors', centerW + 50, centerH + 20, 'orange', -1, 180, 150);
        break;
      case 'brainstorm':
        addLabel('Brainstorm', centerW - 60, centerH - 280, 28);
        addNote('Main\nIdea', centerW - 70, centerH - 70, 'yellow', 0, 140, 140);
        addNote('Idea 1', centerW - 280, centerH - 200, 'pink', -3, 120, 100);
        addNote('Idea 2', centerW + 140, centerH - 200, 'blue', 2, 120, 100);
        addNote('Idea 3', centerW - 280, centerH + 80, 'green', 1, 120, 100);
        addNote('Idea 4', centerW + 140, centerH + 80, 'orange', -1, 120, 100);
        break;
      case 'pros_cons':
        addLabel('Pros', centerW - 200, centerH - 220, 26);
        addLabel('Cons', centerW + 80, centerH - 220, 26);
        addL(centerW - 20, centerH - 250, centerW - 20, centerH + 250);
        addNote('Pro 1', centerW - 220, centerH - 160, 'green', -1, 140, 100);
        addNote('Pro 2', centerW - 220, centerH - 30, 'green', 1, 140, 100);
        addNote('Con 1', centerW + 40, centerH - 160, 'pink', 1, 140, 100);
        addNote('Con 2', centerW + 40, centerH - 30, 'pink', -1, 140, 100);
        break;
      case 'timeline':
        addLabel('Timeline', centerW - 50, centerH - 200, 28);
        addL(centerW - 450, centerH, centerW + 450, centerH, 3);
        addNote('Step 1', centerW - 380, centerH - 130, 'blue', -1, 130, 100);
        addNote('Step 2', centerW - 150, centerH - 130, 'yellow', 1, 130, 100);
        addNote('Step 3', centerW + 80, centerH - 130, 'green', -2, 130, 100);
        addNote('Step 4', centerW + 310, centerH - 130, 'orange', 2, 130, 100);
        break;
      case 'rocket':
        addLabel('Launch Plan', centerW - 60, centerH - 240, 28);
        addNote('Fueling\n(Prep)', centerW - 320, centerH - 150, 'orange', -2, 150, 120);
        addNote('Ignition\n(Launch)', centerW - 75, centerH - 150, 'yellow', 1, 150, 120);
        addNote('Orbit\n(Maintain)', centerW + 170, centerH - 150, 'blue', 3, 150, 120);
        addL(centerW - 150, centerH - 250, centerW - 150, centerH + 150);
        addL(centerW + 150, centerH - 250, centerW + 150, centerH + 150);
        break;
    }
    toast({ title: "Template Loaded", description: `${preset.replace('_', ' ').toUpperCase()} template added` });
  };

  if (isLoading || !boardData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl font-marker animate-pulse">Loading your board...</div>
      </div>
    );
  }

  const hasSelection = !!(selectedNoteId || selectedLabelId || selectedLineId || selectedImageId);

  const cursorStyle = isPanning
    ? 'grabbing'
    : isSpacePressed
      ? 'grab'
      : currentTool === 'pen' || currentTool === 'line'
        ? 'crosshair'
        : currentTool === 'text'
          ? 'text'
          : currentTool === 'cursor'
            ? 'grab'
            : 'default';

  return (
    <>
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoToDashboard}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
            {boardData && (
              <>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                <h1 className="text-lg font-semibold truncate max-w-md">
                  {boardData?.board?.boardName || 'Untitled Board'}
                </h1>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Board Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full h-screen overflow-hidden bg-white selection:bg-yellow-200/50 pt-28"
        style={{ backgroundImage: `url(${textureImage})`, backgroundSize: 'cover', cursor: cursorStyle }}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid="board-canvas"
      >
        <div
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            willChange: 'transform'
          }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', width: '5000px', height: '5000px' }} />

          <LineCanvas
            lines={boardData.lines}
            onAddLine={handleCreateLine}
            onUpdateLine={(id, updates) => handleUpdateLine(id, updates)}
            onDeleteLine={(id) => handleDeleteLine(id)}
            isLineMode={currentTool === 'line' && !isPanning && !isSpacePressed}
            currentColor={toolSettings.lineColor}
            currentThickness={toolSettings.lineThickness}
            selectedLineId={selectedLineId}
            onSelectLine={(id) => { clearSelection(); setSelectedLineId(id); }}
            zoom={zoom}
            pan={pan}
          />

          <DrawingCanvas
            drawings={boardData.drawings}
            onAddDrawing={handleAddDrawingLocal}
            isDrawingMode={currentTool === 'pen' && !isPanning && !isSpacePressed}
            currentColor={toolSettings.penColor}
            currentThickness={toolSettings.penThickness}
            zoom={zoom}
            pan={pan}
          />

          {boardData.stickyNotes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              onUpdate={(id, updates) => handleUpdateNote(id, updates)}
              onDelete={(id) => handleDeleteNote(id)}
              isSelected={selectedNoteId === note.id}
              onSelect={() => { if (currentTool === 'cursor' && !isPanning && !isSpacePressed) { clearSelection(); setSelectedNoteId(note.id); } }}
              zoom={zoom}
              isNew={newlyCreatedIds.has(note.id)}
            />
          ))}

          {boardData.textLabels.map((label) => (
            <TextLabel
              key={label.id}
              label={label}
              onUpdate={(id, updates) => handleUpdateTextLabel(id, updates)}
              onDelete={(id) => handleDeleteTextLabel(id)}
              isSelected={selectedLabelId === label.id}
              onSelect={() => { if (currentTool === 'cursor' && !isPanning && !isSpacePressed) { clearSelection(); setSelectedLabelId(label.id); } }}
              zoom={zoom}
              isNew={newlyCreatedIds.has(label.id)}
            />
          ))}

          {boardData.images.map((image) => (
            <BoardImage
              key={image.id}
              image={image}
              onUpdate={(id, updates) => handleUpdateBoardImage(id, updates)}
              onDelete={(id) => handleDeleteBoardImage(id)}
              isSelected={selectedImageId === image.id}
              onSelect={() => { if (currentTool === 'cursor' && !isPanning && !isSpacePressed) { clearSelection(); setSelectedImageId(image.id); } }}
              zoom={zoom}
            />
          ))}
        </div>

        <Toolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          onAddNote={handleAddNote}
          onClearBoard={() => setClearDialogOpen(true)}
          onSave={handleSave}
          onLoadPreset={handleLoadPreset}
          onDeleteSelected={handleDeleteSelected}
          hasSelection={hasSelection}
          onUploadImage={handleUploadImage}
          toolSettings={toolSettings}
          onToolSettingsChange={(updates) => setToolSettings(prev => ({ ...prev, ...updates }))}
          onUndo={safeUndo}
          onRedo={safeRedo}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          isSaving={saveBoardMutation.isPending}
        />

        <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Board?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all content from your workspace. This change is local until you save.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleClearBoard}
              >
                Clear Board
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onResetZoom={handleResetZoom}
        />

        {boardData.stickyNotes.length === 0 && boardData.drawings.length === 0 && boardData.textLabels.length === 0 && boardData.lines.length === 0 && boardData.images.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-20" style={{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            <h1 className="text-6xl font-marker mb-4 transform -rotate-2">MarkerMind</h1>
            <p className="text-2xl font-hand">Use the toolbar above to start creating!</p>
          </div>
        )}
      </div>
    </>
  );
}
