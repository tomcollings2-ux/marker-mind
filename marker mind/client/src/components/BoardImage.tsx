import React, { useRef, useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import type { BoardImage as BoardImageType } from '@shared/schema';
import { cn } from '@/lib/utils';
import { X, GripHorizontal, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BoardImageProps {
  image: BoardImageType;
  onUpdate: (id: string, updates: Partial<BoardImageType>) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  zoom?: number;
}

export function BoardImage({ image, onUpdate, onDelete, isSelected, onSelect, zoom = 1 }: BoardImageProps) {
  const controls = useDragControls();
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [localRotation, setLocalRotation] = useState(image.rotation);
  const imageRef = useRef<HTMLDivElement>(null);

  const imgWidth = image.width || 200;
  const imgHeight = image.height || 200;

  useEffect(() => {
    setLocalRotation(image.rotation);
  }, [image.rotation]);

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = imgWidth;
    const startHeight = imgHeight;
    const aspectRatio = startWidth / startHeight;

    const handleResizeMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      
      const newWidth = Math.max(50, startWidth + dx);
      const newHeight = moveEvent.shiftKey ? newWidth / aspectRatio : Math.max(50, startHeight + dy);
      
      if (imageRef.current) {
        imageRef.current.style.width = `${newWidth}px`;
        imageRef.current.style.height = `${moveEvent.shiftKey ? newHeight : Math.max(50, startHeight + dy)}px`;
      }
    };

    const handleResizeEnd = (upEvent: PointerEvent) => {
      setIsResizing(false);
      const dx = (upEvent.clientX - startX) / zoom;
      const dy = (upEvent.clientY - startY) / zoom;
      const newWidth = Math.max(50, startWidth + dx);
      const newHeight = upEvent.shiftKey ? newWidth / aspectRatio : Math.max(50, startHeight + dy);
      onUpdate(image.id, { width: Math.round(newWidth), height: Math.round(newHeight) });
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', handleResizeEnd);
      document.removeEventListener('pointercancel', handleResizeEnd);
    };

    document.addEventListener('pointermove', handleResizeMove);
    document.addEventListener('pointerup', handleResizeEnd);
    document.addEventListener('pointercancel', handleResizeEnd);
  };

  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);

    const rect = imageRef.current?.getBoundingClientRect();
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
      onUpdate(image.id, { rotation: Math.round(currentRotationValue) });
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
      ref={imageRef}
      drag={!isResizing && !isRotating}
      dragControls={controls}
      dragMomentum={false}
      dragListener={false}
      initial={{ x: image.x, y: image.y, rotate: image.rotation, scale: 0.8, opacity: 0 }}
      animate={{ 
        x: image.x, 
        y: image.y, 
        rotate: isRotating ? localRotation : (isSelected ? localRotation : image.rotation),
        scale: isSelected ? 1.02 : 1,
        opacity: 1,
        zIndex: isSelected ? 50 : 10
      }}
      onDragEnd={(_, info) => {
        onUpdate(image.id, { x: image.x + info.offset.x / zoom, y: image.y + info.offset.y / zoom });
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      className={cn(
        "absolute shadow-lg transition-shadow cursor-pointer select-none group",
        isSelected ? "shadow-2xl ring-2 ring-primary/50" : "hover:shadow-xl"
      )}
      style={{
        width: imgWidth,
        height: imgHeight,
      }}
      data-testid={`board-image-${image.id}`}
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/90 rounded-full shadow-md cursor-grab active:cursor-grabbing hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-all hover:w-20"
        data-testid={`drag-handle-image-${image.id}`}
      >
        <GripHorizontal className="w-5 h-5 text-gray-400" />
      </div>

      <div className={cn(
        "absolute -top-12 left-0 right-0 h-10 flex items-center justify-center gap-2 transition-opacity",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-500"
          onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
          data-testid={`delete-image-${image.id}`}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <img 
        src={image.src} 
        alt="Board image"
        className="w-full h-full object-cover rounded-md"
        draggable={false}
      />

      {isSelected && (
        <>
          <div
            onPointerDown={handleResizeStart}
            className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-se-resize shadow-md hover:bg-blue-50 hover:scale-110 transition-transform"
            data-testid={`resize-handle-image-${image.id}`}
          />
          <div className="absolute top-1/2 -right-1 w-2 h-8 -translate-y-1/2 bg-blue-400 rounded-full opacity-50" />
          <div className="absolute -bottom-1 left-1/2 w-8 h-2 -translate-x-1/2 bg-blue-400 rounded-full opacity-50" />
          
          {/* Rotation Handle */}
          <div
            onPointerDown={handleRotateStart}
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-green-500 rounded-full cursor-grab shadow-md hover:bg-green-50 hover:scale-110 transition-transform flex items-center justify-center"
            data-testid={`rotate-handle-image-${image.id}`}
          >
            <RotateCw className="w-3 h-3 text-green-600" />
          </div>
        </>
      )}
    </motion.div>
  );
}
