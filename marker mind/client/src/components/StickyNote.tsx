import React, { useRef, useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import type { StickyNote as StickyNoteType } from '@shared/schema';
import { cn } from '@/lib/utils';
import { X, GripHorizontal, RotateCw, Type, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange';

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (id: string, updates: Partial<StickyNoteType>) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  zoom?: number;
  isNew?: boolean; // Flag for newly created notes
}

const colorMap: Record<NoteColor, string> = {
  yellow: 'bg-note-yellow',
  pink: 'bg-note-pink',
  blue: 'bg-note-blue',
  green: 'bg-note-green',
  orange: 'bg-note-orange',
};

const fontFamilyMap: Record<string, string> = {
  marker: 'var(--font-marker)',
  handwritten: "'Kalam', cursive",
  formal: "'Inter', sans-serif",
  fun: "'Architects Daughter', cursive",
};

const isCustomColor = (color: string) => color.startsWith('#');

export function StickyNote({ note, onUpdate, onDelete, isSelected, onSelect, zoom = 1, isNew = false }: StickyNoteProps) {
  const controls = useDragControls();
  const [isEditing, setIsEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [localText, setLocalText] = useState(note.text);
  const [localRotation, setLocalRotation] = useState(note.rotation);
  const [dynamicFontSize, setDynamicFontSize] = useState(18);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const noteWidth = note.width || 200;
  const noteHeight = note.height || 200;

  useEffect(() => {
    setLocalRotation(note.rotation);
  }, [note.rotation]);

  useEffect(() => {
    setLocalText(note.text);
  }, [note.text]);

  // Auto-resize font logic
  React.useLayoutEffect(() => {
    if (!measureRef.current) return;

    const textToMeasure = localText || 'Double click to edit';
    const padding = 32; // p-4 (16px) * 2
    const availableWidth = noteWidth - padding;
    const availableHeight = noteHeight - padding;

    let min = 10;
    let max = 200;
    let optimal = min;

    // Binary search for best fit
    while (min <= max) {
      const mid = Math.floor((min + max) / 2);
      measureRef.current.style.fontSize = `${mid}px`;

      // Check height constraint (width is handled by CSS width constraint on measureRef)
      if (measureRef.current.scrollHeight <= availableHeight) {
        optimal = mid;
        min = mid + 1;
      } else {
        max = mid - 1;
      }
    }

    setDynamicFontSize(optimal);
  }, [localText, noteWidth, noteHeight, note.fontFamily]);

  // Auto-focus on creation or when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Auto-focus and enter edit mode for newly created notes
  useEffect(() => {
    if (isNew && isSelected && !isEditing) {
      setIsEditing(true);
    }
  }, [isNew, isSelected, isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent deselection
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localText !== note.text) {
      onUpdate(note.id, { text: localText });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    // ... existing resize start code ...
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = noteWidth;
    const startHeight = noteHeight;

    const handleResizeMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      const newWidth = Math.max(60, startWidth + dx);
      const newHeight = Math.max(60, startHeight + dy);

      if (noteRef.current) {
        noteRef.current.style.width = `${newWidth}px`;
        noteRef.current.style.height = `${newHeight}px`;
      }
    };

    const handleResizeEnd = (upEvent: PointerEvent) => {
      setIsResizing(false);
      const dx = (upEvent.clientX - startX) / zoom;
      const dy = (upEvent.clientY - startY) / zoom;
      const newWidth = Math.max(60, startWidth + dx);
      const newHeight = Math.max(60, startHeight + dy);
      onUpdate(note.id, { width: Math.round(newWidth), height: Math.round(newHeight) });
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', handleResizeEnd);
      document.removeEventListener('pointercancel', handleResizeEnd);
    };

    document.addEventListener('pointermove', handleResizeMove);
    document.addEventListener('pointerup', handleResizeEnd);
    document.addEventListener('pointercancel', handleResizeEnd);
  };

  // ... existing rotate code ...
  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);

    const rect = noteRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    const startRotation = localRotation;
    let currentRotationValue = startRotation;

    const handleRotateMove = (moveEvent: PointerEvent) => {
      const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
      const deltaAngle = currentAngle - startAngle;
      currentRotationValue = startRotation + deltaAngle;
      setLocalRotation(currentRotationValue);
    };

    const handleRotateEnd = () => {
      setIsRotating(false);
      onUpdate(note.id, { rotation: Math.round(currentRotationValue) });
      document.removeEventListener('pointermove', handleRotateMove);
      document.removeEventListener('pointerup', handleRotateEnd);
      document.removeEventListener('pointercancel', handleRotateEnd);
    };

    document.addEventListener('pointermove', handleRotateMove);
    document.addEventListener('pointerup', handleRotateEnd);
    document.addEventListener('pointercancel', handleRotateEnd);
  };

  return (
    <motion.div
      ref={noteRef}
      drag={!isResizing && !isRotating}
      dragControls={controls}
      dragMomentum={false}
      initial={{ x: note.x, y: note.y, rotate: note.rotation, scale: 0.8, opacity: 0 }}
      animate={{
        x: note.x,
        y: note.y,
        rotate: isRotating ? localRotation : (isSelected ? localRotation : note.rotation),
        scale: isSelected ? 1.02 : 1,
        opacity: 1,
        zIndex: isSelected ? 50 : 10
      }}
      onDragEnd={(_, info) => {
        onUpdate(note.id, { x: note.x + info.offset.x / zoom, y: note.y + info.offset.y / zoom });
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      className={cn(
        "absolute flex flex-col p-4 shadow-lg transition-shadow cursor-pointer select-none group",
        !isCustomColor(note.color) && (colorMap[note.color as NoteColor] || 'bg-note-yellow'),
        note.shape === 'circle' ? 'rounded-full aspect-square justify-center items-center text-center' : 'rounded-sm',
        isSelected ? "shadow-2xl ring-2 ring-primary/50" : "hover:shadow-xl",
        isEditing && "ring-4 ring-blue-400/60 shadow-blue-200" // Visual editing indicator
      )}
      style={{
        fontFamily: fontFamilyMap[note.fontFamily || 'marker'] || 'var(--font-marker)',
        width: noteWidth,
        height: noteHeight,
        minWidth: 60,
        minHeight: 60,
        ...(isCustomColor(note.color) && { backgroundColor: note.color }),
      }}
      data-testid={`sticky-note-${note.id}`}
    >
      {/* Hidden Measure Element */}
      <div
        ref={measureRef}
        className="absolute p-0 m-0 pointer-events-none whitespace-pre-wrap break-words leading-relaxed"
        style={{
          visibility: 'hidden',
          width: noteWidth - 32,
          fontFamily: fontFamilyMap[note.fontFamily || 'marker'] || 'var(--font-marker)',
        }}
        aria-hidden="true"
      >
        {localText || 'Double click to edit'}
      </div>

      {/* Drag Handle - Hidden but kept for compatibility */}
      <div
        onPointerDown={(e) => controls.start(e)}
        className="hidden absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/90 rounded-full shadow-md cursor-grab active:cursor-grabbing hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-all hover:w-20"
        data-testid={`drag-handle-${note.id}`}
      >
        <GripHorizontal className="w-5 h-5 text-gray-400" />
      </div>

      {/* Top Controls */}
      <div className={cn(
        "absolute -top-12 left-0 right-0 h-10 flex items-center justify-center gap-2 transition-opacity",
        isSelected || isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        note.shape === 'circle' && "-top-14"
      )}>

        <div className="flex bg-white rounded-full shadow-sm border border-gray-200 p-1 gap-1">
          {(['yellow', 'pink', 'blue', 'green', 'orange'] as NoteColor[]).map((c) => (
            <button
              key={c}
              className={cn("w-4 h-4 rounded-full border border-black/10", colorMap[c])}
              onClick={(e) => { e.stopPropagation(); onUpdate(note.id, { color: c }); }}
              data-testid={`color-${c}-${note.id}`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-500"
          onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
          data-testid={`delete-note-${note.id}`}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={localText}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            "w-full h-full bg-transparent border-none resize-none focus-visible:ring-0 p-0 leading-relaxed placeholder:text-gray-400/50 overflow-hidden",
            note.shape === 'circle' && "text-center mt-6"
          )}
          style={{
            fontFamily: fontFamilyMap[note.fontFamily || 'marker'] || 'var(--font-marker)',
            fontSize: dynamicFontSize,
            color: note.textColor || '#333333',
          }}
          placeholder="Write something..."
          data-testid={`textarea-${note.id}`}
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          className={cn(
            "w-full h-full whitespace-pre-wrap break-words leading-relaxed overflow-hidden",
            note.shape === 'circle' && "flex items-center justify-center"
          )}
          style={{
            fontSize: dynamicFontSize,
            color: note.textColor || '#333333',
          }}
          data-testid={`note-text-${note.id}`}
        >
          {note.text || <span className="opacity-30 italic">Double click to edit</span>}
        </div>
      )}

      {/* Resize Handles - Corner and edges */}
      {isSelected && note.shape !== 'circle' && (
        <>
          {/* Bottom-right corner - resize both */}
          <div
            onPointerDown={handleResizeStart}
            className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-se-resize shadow-md hover:bg-blue-50 hover:scale-110 transition-transform"
            data-testid={`resize-handle-${note.id}`}
          />
          {/* Right edge indicator */}
          <div className="absolute top-1/2 -right-1 w-2 h-8 -translate-y-1/2 bg-blue-400 rounded-full opacity-50" />
          {/* Bottom edge indicator */}
          <div className="absolute -bottom-1 left-1/2 w-8 h-2 -translate-x-1/2 bg-blue-400 rounded-full opacity-50" />
        </>
      )}

      {/* Rotation Handle */}
      {isSelected && (
        <div
          onPointerDown={handleRotateStart}
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-green-500 rounded-full cursor-grab shadow-md hover:bg-green-50 hover:scale-110 transition-transform flex items-center justify-center"
          data-testid={`rotate-handle-${note.id}`}
        >
          <RotateCw className="w-3 h-3 text-green-600" />
        </div>
      )}
    </motion.div>
  );
}
