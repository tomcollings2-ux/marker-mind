import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import textureImage from '@assets/generated_images/subtle_whiteboard_texture.png';
import { useRoute, useLocation } from 'wouter';

type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange';
type Tool = 'cursor' | 'pen' | 'text' | 'line';

const DEFAULT_NOTE_WIDTH = 200;
const DEFAULT_NOTE_HEIGHT = 200;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

export default function Board() {
  const [, params] = useRoute('/board/:id');
  const [, setLocation] = useLocation();
  const boardId = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [currentTool, setCurrentTool] = useState<Tool>('cursor');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });

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

  const { data: boardData, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardId ? api.getBoard(boardId) : Promise.reject('No board ID'),
    enabled: !!boardId,
    refetchOnWindowFocus: false,
  });

  // Sticky Note Mutations
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StickyNoteType> }) => 
      api.updateStickyNote(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
  });

  const deleteNoteMutation = useMutation({
    mutationFn: api.deleteStickyNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSelectedNoteId(null);
    }
  });

  const createNoteMutation = useMutation({
    mutationFn: api.createStickyNote,
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSelectedNoteId(note.id);
      setCurrentTool('cursor');
    }
  });

  // Drawing Mutations
  const createDrawingMutation = useMutation({
    mutationFn: api.createDrawing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
  });

  // Text Label Mutations
  const createTextLabelMutation = useMutation({
    mutationFn: api.createTextLabel,
    onSuccess: (label) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSelectedLabelId(label.id);
      setCurrentTool('cursor');
    }
  });

  const updateTextLabelMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TextLabelType> }) => 
      api.updateTextLabel(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
  });

  const deleteTextLabelMutation = useMutation({
    mutationFn: api.deleteTextLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSelectedLabelId(null);
    }
  });

  // Line Mutations
  const createLineMutation = useMutation({
    mutationFn: api.createLine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
  });

  const updateLineMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Line> }) => 
      api.updateLine(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
  });

  const deleteLineMutation = useMutation({
    mutationFn: api.deleteLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSelectedLineId(null);
    }
  });

  // Board Image Mutations
  const createBoardImageMutation = useMutation({
    mutationFn: api.createBoardImage,
    onSuccess: (image) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSelectedImageId(image.id);
    }
  });

  const updateBoardImageMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BoardImageType> }) => 
      api.updateBoardImage(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
  });

  const deleteBoardImageMutation = useMutation({
    mutationFn: api.deleteBoardImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSelectedImageId(null);
    }
  });

  // Clear board
  const clearBoardMutation = useMutation({
    mutationFn: async () => {
      if (!boardData) return;
      await Promise.all([
        ...boardData.stickyNotes.map(n => api.deleteStickyNote(n.id)),
        ...boardData.drawings.map(d => api.deleteDrawing(d.id)),
        ...boardData.textLabels.map(l => api.deleteTextLabel(l.id)),
        ...boardData.lines.map(l => api.deleteLine(l.id)),
        ...boardData.images.map(i => api.deleteBoardImage(i.id))
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast({ title: "Board Cleared" });
    }
  });

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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const isTrackpad = Math.abs(e.deltaY) < 50;
    const zoomSpeed = isTrackpad ? 0.002 : 0.05;
    const zoomDelta = -e.deltaY * zoomSpeed;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + zoomDelta));
    
    if (canvasRef.current && Math.abs(newZoom - zoom) > 0.001) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomRatio = newZoom / zoom;
      const newPanX = mouseX - (mouseX - pan.x) * zoomRatio;
      const newPanY = mouseY - (mouseY - pan.y) * zoomRatio;
      
      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
    }
  }, [zoom, pan]);

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

  const handleZoomOut = useCallback(() => {
    setZoom(z => {
      const currentPercent = Math.round(z * 100);
      const nextPercent = Math.floor(currentPercent / 25) * 25 - 25;
      return Math.max(MIN_ZOOM, Math.max(25, nextPercent) / 100);
    });
  }, []);

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
    createNoteMutation.mutate({
      boardId, text: '', x: Math.floor(x), y: Math.floor(y),
      color, shape: 'rectangle', rotation, width: null, height: null,
      fontSize: 18, fontFamily: 'marker', textColor: '#333333',
    });
  }, [boardId, createNoteMutation, screenToCanvas]);

  const handleAddDrawing = useCallback((drawing: { color: string; thickness: number; path: Array<{x: number; y: number}> }) => {
    if (!boardId) return;
    createDrawingMutation.mutate({ ...drawing, boardId });
  }, [boardId, createDrawingMutation]);

  const handleAddLine = useCallback((line: { x1: number; y1: number; x2: number; y2: number; color: string; thickness: number; lineStyle: string }) => {
    if (!boardId) return;
    createLineMutation.mutate({ ...line, boardId });
  }, [boardId, createLineMutation]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isPanning || isSpacePressed) return;
    if (currentTool === 'text' && boardId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasPos = screenToCanvas(screenX, screenY);
      createTextLabelMutation.mutate({
        boardId, text: '', x: Math.floor(canvasPos.x), y: Math.floor(canvasPos.y),
        fontSize: 24, fontStyle: 'handwritten', color: '#000000', rotation: 0
      });
    } else {
      clearSelection();
    }
  }, [currentTool, boardId, createTextLabelMutation, clearSelection, isPanning, isSpacePressed, screenToCanvas]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNoteId) deleteNoteMutation.mutate(selectedNoteId);
    if (selectedLabelId) deleteTextLabelMutation.mutate(selectedLabelId);
    if (selectedLineId) deleteLineMutation.mutate(selectedLineId);
    if (selectedImageId) deleteBoardImageMutation.mutate(selectedImageId);
  }, [selectedNoteId, selectedLabelId, selectedLineId, selectedImageId, deleteNoteMutation, deleteTextLabelMutation, deleteLineMutation, deleteBoardImageMutation]);

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
      createBoardImageMutation.mutate({
        boardId,
        src,
        x: Math.floor(x),
        y: Math.floor(y),
        width: 200,
        height: 200,
        rotation: 0
      });
    };
    reader.readAsDataURL(file);
  }, [boardId, screenToCanvas, createBoardImageMutation]);

  const handleSave = () => {
    toast({ title: "Auto-Saved", description: "Your board is automatically saved.", duration: 2000 });
  };

  const handleClear = () => {
    if (window.confirm("Clear everything from the board?")) {
      clearBoardMutation.mutate();
    }
  };

  type PresetType = 'kanban' | 'swot' | 'persona' | 'brainstorm' | 'pros_cons' | 'timeline' | 'rocket';

  const handleLoadPreset = (preset: PresetType) => {
    if (!boardId) return;
    const centerW = window.innerWidth / 2;
    const centerH = window.innerHeight / 2 + 50;
    const createNote = (text: string, x: number, y: number, color: NoteColor, rotation = 0, width: number | null = null, height: number | null = null) => {
      createNoteMutation.mutate({ boardId, text, x: Math.floor(x), y: Math.floor(y), color, shape: 'rectangle', rotation, width, height, fontSize: 18, fontFamily: 'marker', textColor: '#333333' });
    };
    const createL = (x1: number, y1: number, x2: number, y2: number, thickness = 2) => {
      createLineMutation.mutate({ boardId, x1, y1, x2, y2, color: '#888888', thickness, lineStyle: 'solid' });
    };
    const createLabel = (text: string, x: number, y: number, fontSize = 20) => {
      createTextLabelMutation.mutate({ boardId, text, x: Math.floor(x), y: Math.floor(y), fontSize, fontStyle: 'marker', color: '#333333', rotation: 0 });
    };

    switch (preset) {
      case 'kanban':
        const colW = 220;
        const startX = centerW - colW * 2;
        createLabel('Backlog', startX + 10, centerH - 220, 24);
        createLabel('In Progress', startX + colW + 10, centerH - 220, 24);
        createLabel('Needs Review', startX + colW * 2 + 10, centerH - 220, 24);
        createLabel('Approved', startX + colW * 3 + 10, centerH - 220, 24);
        createL(startX + colW, centerH - 250, startX + colW, centerH + 250);
        createL(startX + colW * 2, centerH - 250, startX + colW * 2, centerH + 250);
        createL(startX + colW * 3, centerH - 250, startX + colW * 3, centerH + 250);
        createNote('Task 1', startX + 20, centerH - 160, 'pink', -1, 140, 100);
        createNote('Task 2', startX + 20, centerH - 40, 'yellow', 1, 140, 100);
        createNote('In work', startX + colW + 20, centerH - 160, 'blue', 0, 140, 100);
        createNote('Review me', startX + colW * 2 + 20, centerH - 160, 'green', 2, 140, 100);
        createNote('Done!', startX + colW * 3 + 20, centerH - 160, 'orange', -1, 140, 100);
        break;
      case 'swot':
        const qW = 280;
        const qH = 200;
        const sX = centerW - qW;
        const sY = centerH - qH;
        createLabel('Strengths', sX + 20, sY - 10, 22);
        createLabel('Weaknesses', sX + qW + 20, sY - 10, 22);
        createLabel('Opportunities', sX + 20, sY + qH + 10, 22);
        createLabel('Threats', sX + qW + 20, sY + qH + 10, 22);
        createL(centerW, sY - 30, centerW, sY + qH * 2 + 50);
        createL(sX - 30, centerH, sX + qW * 2 + 30, centerH);
        createNote('', sX + 30, sY + 30, 'green', 0, 120, 100);
        createNote('', sX + qW + 30, sY + 30, 'yellow', 0, 120, 100);
        createNote('', sX + 30, sY + qH + 50, 'blue', 0, 120, 100);
        createNote('', sX + qW + 30, sY + qH + 50, 'pink', 0, 120, 100);
        break;
      case 'persona':
        createLabel('User Persona', centerW - 80, centerH - 250, 28);
        createNote('Name & Role', centerW - 350, centerH - 180, 'blue', -1, 180, 150);
        createNote('Goals', centerW - 90, centerH - 180, 'green', 1, 180, 150);
        createNote('Pain Points', centerW + 170, centerH - 180, 'pink', -2, 180, 150);
        createNote('Motivations', centerW - 250, centerH + 20, 'yellow', 2, 180, 150);
        createNote('Behaviors', centerW + 50, centerH + 20, 'orange', -1, 180, 150);
        break;
      case 'brainstorm':
        createLabel('Brainstorm', centerW - 60, centerH - 280, 28);
        createNote('Main\nIdea', centerW - 70, centerH - 70, 'yellow', 0, 140, 140);
        createNote('Idea 1', centerW - 280, centerH - 200, 'pink', -3, 120, 100);
        createNote('Idea 2', centerW + 140, centerH - 200, 'blue', 2, 120, 100);
        createNote('Idea 3', centerW - 280, centerH + 80, 'green', 1, 120, 100);
        createNote('Idea 4', centerW + 140, centerH + 80, 'orange', -1, 120, 100);
        break;
      case 'pros_cons':
        createLabel('Pros', centerW - 200, centerH - 220, 26);
        createLabel('Cons', centerW + 80, centerH - 220, 26);
        createL(centerW - 20, centerH - 250, centerW - 20, centerH + 250);
        createNote('Pro 1', centerW - 220, centerH - 160, 'green', -1, 140, 100);
        createNote('Pro 2', centerW - 220, centerH - 30, 'green', 1, 140, 100);
        createNote('Con 1', centerW + 40, centerH - 160, 'pink', 1, 140, 100);
        createNote('Con 2', centerW + 40, centerH - 30, 'pink', -1, 140, 100);
        break;
      case 'timeline':
        createLabel('Timeline', centerW - 50, centerH - 200, 28);
        createL(centerW - 450, centerH, centerW + 450, centerH, 3);
        createNote('Step 1', centerW - 380, centerH - 130, 'blue', -1, 130, 100);
        createNote('Step 2', centerW - 150, centerH - 130, 'yellow', 1, 130, 100);
        createNote('Step 3', centerW + 80, centerH - 130, 'green', -2, 130, 100);
        createNote('Step 4', centerW + 310, centerH - 130, 'orange', 2, 130, 100);
        break;
      case 'rocket':
        createLabel('Launch Plan', centerW - 60, centerH - 240, 28);
        createNote('Fueling\n(Prep)', centerW - 320, centerH - 150, 'orange', -2, 150, 120);
        createNote('Ignition\n(Launch)', centerW - 75, centerH - 150, 'yellow', 1, 150, 120);
        createNote('Orbit\n(Maintain)', centerW + 170, centerH - 150, 'blue', 3, 150, 120);
        createL(centerW - 150, centerH - 250, centerW - 150, centerH + 150);
        createL(centerW + 150, centerH - 250, centerW + 150, centerH + 150);
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
    <div 
      ref={canvasRef}
      className="relative w-full h-screen overflow-hidden bg-white selection:bg-yellow-200/50 pt-14"
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
          onAddLine={handleAddLine}
          onUpdateLine={(id, updates) => updateLineMutation.mutate({ id, updates })}
          onDeleteLine={(id) => deleteLineMutation.mutate(id)}
          isLineMode={currentTool === 'line' && !isPanning && !isSpacePressed}
          currentColor="#000000"
          currentThickness={3}
          selectedLineId={selectedLineId}
          onSelectLine={(id) => { clearSelection(); setSelectedLineId(id); }}
          zoom={zoom}
          pan={pan}
        />

        <DrawingCanvas 
          drawings={boardData.drawings}
          onAddDrawing={handleAddDrawing}
          isDrawingMode={currentTool === 'pen' && !isPanning && !isSpacePressed}
          currentColor="#000000"
          currentThickness={3}
          zoom={zoom}
          pan={pan}
        />

        {boardData.stickyNotes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            onUpdate={(id, updates) => updateNoteMutation.mutate({ id, updates })}
            onDelete={(id) => deleteNoteMutation.mutate(id)}
            isSelected={selectedNoteId === note.id}
            onSelect={() => { if (currentTool === 'cursor' && !isPanning && !isSpacePressed) { clearSelection(); setSelectedNoteId(note.id); }}}
            zoom={zoom}
          />
        ))}

        {boardData.textLabels.map((label) => (
          <TextLabel
            key={label.id}
            label={label}
            onUpdate={(id, updates) => updateTextLabelMutation.mutate({ id, updates })}
            onDelete={(id) => deleteTextLabelMutation.mutate(id)}
            isSelected={selectedLabelId === label.id}
            onSelect={() => { if (currentTool === 'cursor' && !isPanning && !isSpacePressed) { clearSelection(); setSelectedLabelId(label.id); }}}
            zoom={zoom}
          />
        ))}

        {boardData.images.map((image) => (
          <BoardImage
            key={image.id}
            image={image}
            onUpdate={(id, updates) => updateBoardImageMutation.mutate({ id, updates })}
            onDelete={(id) => deleteBoardImageMutation.mutate(id)}
            isSelected={selectedImageId === image.id}
            onSelect={() => { if (currentTool === 'cursor' && !isPanning && !isSpacePressed) { clearSelection(); setSelectedImageId(image.id); }}}
            zoom={zoom}
          />
        ))}
      </div>

      <Toolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        onAddNote={handleAddNote}
        onClearBoard={handleClear}
        onSave={handleSave}
        onLoadPreset={handleLoadPreset}
        onDeleteSelected={handleDeleteSelected}
        hasSelection={hasSelection}
        onUploadImage={handleUploadImage}
      />

      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />
      
      {boardData.stickyNotes.length === 0 && boardData.drawings.length === 0 && boardData.textLabels.length === 0 && boardData.lines.length === 0 && boardData.images.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-20" style={{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          <h1 className="text-6xl font-marker mb-4 transform -rotate-2">MarkerMind</h1>
          <p className="text-2xl font-hand">Use the toolbar above to start creating!</p>
        </div>
      )}
    </div>
  );
}
