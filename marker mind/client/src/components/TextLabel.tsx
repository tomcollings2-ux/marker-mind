import React, { useRef, useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import type { TextLabel as TextLabelType } from '@shared/schema';
import { cn } from '@/lib/utils';
import { X, GripHorizontal, Type, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type FontStyle = 'formal' | 'fun' | 'bold' | 'handwritten';

interface TextLabelProps {
  label: TextLabelType;
  onUpdate: (id: string, updates: Partial<TextLabelType>) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  zoom?: number;
  isNew?: boolean; // Flag for newly created labels
}

const fontStyleMap: Record<FontStyle, string> = {
  formal: "'Inter', sans-serif",
  fun: "'Architects Daughter', cursive",
  bold: "'Inter', sans-serif",
  handwritten: "'Kalam', cursive",
};

const fontWeightMap: Record<FontStyle, number> = {
  formal: 400,
  fun: 400,
  bold: 700,
  handwritten: 400,
};

export function TextLabel({ label, onUpdate, onDelete, isSelected, onSelect, zoom = 1, isNew = false }: TextLabelProps) {
  const controls = useDragControls();
  const [isEditing, setIsEditing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [localText, setLocalText] = useState(label.text);
  const [localRotation, setLocalRotation] = useState(label.rotation || 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalText(label.text);
  }, [label.text]);

  useEffect(() => {
    setLocalRotation(label.rotation || 0);
  }, [label.rotation]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Auto-focus and enter edit mode for newly created labels
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
    if (localText !== label.text) {
      onUpdate(label.id, { text: localText });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (localText !== label.text) {
        onUpdate(label.id, { text: localText });
      }
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalText(e.target.value);
  };

  const cycleStyle = () => {
    const styles: FontStyle[] = ['handwritten', 'formal', 'fun', 'bold'];
    const currentIndex = styles.indexOf(label.fontStyle as FontStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    onUpdate(label.id, { fontStyle: styles[nextIndex] });
  };

  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);

    const rect = labelRef.current?.getBoundingClientRect();
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
      onUpdate(label.id, { rotation: Math.round(currentRotationValue) });
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
      ref={labelRef}
      drag={!isRotating}
      dragControls={controls}
      dragMomentum={false}
      dragListener={false}
      initial={{ x: label.x, y: label.y, rotate: label.rotation || 0, scale: 0.8, opacity: 0 }}
      animate={{
        x: label.x,
        y: label.y,
        rotate: isRotating ? localRotation : (isSelected ? localRotation : (label.rotation || 0)),
        scale: isSelected ? 1.05 : 1,
        opacity: 1,
        zIndex: isSelected ? 50 : 10
      }}
      onDragEnd={(_, info) => {
        onUpdate(label.id, { x: label.x + info.offset.x / zoom, y: label.y + info.offset.y / zoom });
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      className={cn(
        "absolute flex items-center gap-2 cursor-pointer select-none group",
        isSelected && "ring-2 ring-primary/30 rounded px-2 py-1 bg-white/50",
        isEditing && "ring-4 ring-blue-400/60 shadow-blue-200 bg-white/70" // Visual editing indicator
      )}
      data-testid={`text-label-${label.id}`}
    >
      {/* Large Drag Handle */}
      <div
        onPointerDown={(e) => controls.start(e)}
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-5 bg-white/90 rounded-full shadow-md cursor-grab active:cursor-grabbing hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-all hover:w-14"
      >
        <GripHorizontal className="w-4 h-4 text-gray-400" />
      </div>

      {/* Controls */}
      <div className={cn(
        "absolute -top-12 left-0 right-0 h-10 flex items-center justify-center gap-2 transition-opacity",
        isSelected || isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-blue-50"
          onClick={(e) => { e.stopPropagation(); cycleStyle(); }}
          title={`Style: ${label.fontStyle}`}
        >
          <Type className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-500"
          onClick={(e) => { e.stopPropagation(); onDelete(label.id); }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Text Content */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={localText}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none min-w-[100px]"
          style={{
            fontFamily: fontStyleMap[label.fontStyle as FontStyle] || fontStyleMap.handwritten,
            fontWeight: fontWeightMap[label.fontStyle as FontStyle] || 400,
            fontSize: label.fontSize,
            color: label.color,
          }}
          placeholder="Type here..."
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          style={{
            fontFamily: fontStyleMap[label.fontStyle as FontStyle] || fontStyleMap.handwritten,
            fontWeight: fontWeightMap[label.fontStyle as FontStyle] || 400,
            fontSize: label.fontSize,
            color: label.color,
          }}
        >
          {label.text || <span className="opacity-30 italic">Double click to edit</span>}
        </div>
      )}

      {/* Rotation Handle */}
      {isSelected && (
        <div
          onPointerDown={handleRotateStart}
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-green-500 rounded-full cursor-grab shadow-md hover:bg-green-50 hover:scale-110 transition-transform flex items-center justify-center"
          data-testid={`rotate-handle-label-${label.id}`}
        >
          <RotateCw className="w-2.5 h-2.5 text-green-600" />
        </div>
      )}
    </motion.div>
  );
}
