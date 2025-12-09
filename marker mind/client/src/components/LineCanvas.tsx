import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Line } from '@shared/schema';
import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

interface LineCanvasProps {
  lines: Line[];
  onAddLine: (line: { x1: number; y1: number; x2: number; y2: number; color: string; thickness: number; lineStyle: string }) => void;
  onUpdateLine?: (id: string, updates: Partial<Line>) => void;
  onDeleteLine: (id: string) => void;
  isLineMode: boolean;
  currentColor: string;
  currentThickness: number;
  selectedLineId: string | null;
  onSelectLine: (id: string | null) => void;
  zoom?: number;
  pan?: { x: number; y: number };
}

function snapAngle(startX: number, startY: number, endX: number, endY: number): Point {
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const snapAngles = [0, 45, 90, 135, 180, -45, -90, -135, -180];
  let closestAngle = snapAngles[0];
  let minDiff = Math.abs(angle - snapAngles[0]);
  
  for (const snapAngle of snapAngles) {
    const diff = Math.abs(angle - snapAngle);
    if (diff < minDiff) {
      minDiff = diff;
      closestAngle = snapAngle;
    }
  }
  
  if (minDiff < 15) {
    const radians = closestAngle * (Math.PI / 180);
    return {
      x: startX + Math.cos(radians) * distance,
      y: startY + Math.sin(radians) * distance
    };
  }
  
  return { x: endX, y: endY };
}

type DragMode = 'none' | 'draw' | 'move' | 'endpoint1' | 'endpoint2';

export function LineCanvas({ 
  lines, 
  onAddLine, 
  onUpdateLine,
  onDeleteLine,
  isLineMode,
  currentColor = '#000000',
  currentThickness = 3,
  selectedLineId,
  onSelectLine,
  zoom = 1,
  pan = { x: 0, y: 0 }
}: LineCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentEndPoint, setCurrentEndPoint] = useState<Point | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const getCoordinates = useCallback((e: React.PointerEvent | React.MouseEvent | PointerEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const canvas = svgRef.current.closest('[data-testid="board-canvas"]') as HTMLElement;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }, [zoom, pan]);

  const resetDragState = useCallback(() => {
    setDragMode('none');
    setStartPoint(null);
    setCurrentEndPoint(null);
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isLineMode) return;
    e.preventDefault();
    const point = getCoordinates(e);
    setStartPoint(point);
    setCurrentEndPoint(point);
    setDragMode('draw');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === 'draw' && isLineMode && startPoint) {
      e.preventDefault();
      const rawEnd = getCoordinates(e);
      const snappedEnd = snapAngle(startPoint.x, startPoint.y, rawEnd.x, rawEnd.y);
      setCurrentEndPoint(snappedEnd);
    }
  };

  const handlePointerUp = () => {
    if (dragMode === 'draw' && isLineMode && startPoint && currentEndPoint) {
      const distance = Math.sqrt(
        Math.pow(currentEndPoint.x - startPoint.x, 2) + 
        Math.pow(currentEndPoint.y - startPoint.y, 2)
      );
      
      if (distance > 10) {
        onAddLine({
          x1: Math.round(startPoint.x),
          y1: Math.round(startPoint.y),
          x2: Math.round(currentEndPoint.x),
          y2: Math.round(currentEndPoint.y),
          color: currentColor,
          thickness: currentThickness,
          lineStyle: 'solid'
        });
      }
    }
    
    resetDragState();
  };

  const handleLineClick = (e: React.MouseEvent, lineId: string) => {
    if (isLineMode) return;
    e.stopPropagation();
    onSelectLine(lineId);
  };

  const handleEndpointDragStart = (e: React.PointerEvent, line: Line, endpoint: 'endpoint1' | 'endpoint2') => {
    if (isLineMode || !onUpdateLine) return;
    e.stopPropagation();
    e.preventDefault();
    
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    
    setDragMode(endpoint);
    
    const handleMove = (moveEvent: PointerEvent) => {
      if (!svgRef.current) return;
      const canvas = svgRef.current.closest('[data-testid="board-canvas"]') as HTMLElement;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const screenX = moveEvent.clientX - rect.left;
      const screenY = moveEvent.clientY - rect.top;
      const newPos = {
        x: (screenX - pan.x) / zoom,
        y: (screenY - pan.y) / zoom
      };
      
      if (endpoint === 'endpoint1') {
        onUpdateLine(line.id, { x1: Math.round(newPos.x), y1: Math.round(newPos.y) });
      } else {
        onUpdateLine(line.id, { x2: Math.round(newPos.x), y2: Math.round(newPos.y) });
      }
    };
    
    const cleanup = () => {
      setDragMode('none');
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', cleanup);
      document.removeEventListener('pointercancel', cleanup);
      cleanupRef.current = null;
    };
    
    cleanupRef.current = cleanup;
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', cleanup);
    document.addEventListener('pointercancel', cleanup);
  };

  const handleLineDragStart = (e: React.PointerEvent, line: Line) => {
    if (isLineMode || selectedLineId !== line.id || !onUpdateLine) return;
    e.stopPropagation();
    e.preventDefault();
    
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    
    setDragMode('move');
    const startPos = getCoordinates(e);
    const originalLine = { ...line };
    
    const handleMove = (moveEvent: PointerEvent) => {
      if (!svgRef.current) return;
      const canvas = svgRef.current.closest('[data-testid="board-canvas"]') as HTMLElement;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const screenX = moveEvent.clientX - rect.left;
      const screenY = moveEvent.clientY - rect.top;
      const currentPos = {
        x: (screenX - pan.x) / zoom,
        y: (screenY - pan.y) / zoom
      };
      const dx = currentPos.x - startPos.x;
      const dy = currentPos.y - startPos.y;
      
      onUpdateLine(line.id, {
        x1: Math.round(originalLine.x1 + dx),
        y1: Math.round(originalLine.y1 + dy),
        x2: Math.round(originalLine.x2 + dx),
        y2: Math.round(originalLine.y2 + dy)
      });
    };
    
    const cleanup = () => {
      setDragMode('none');
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', cleanup);
      document.removeEventListener('pointercancel', cleanup);
      cleanupRef.current = null;
    };
    
    cleanupRef.current = cleanup;
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', cleanup);
    document.addEventListener('pointercancel', cleanup);
  };

  return (
    <svg
      ref={svgRef}
      className={cn(
        "absolute inset-0 w-full h-full",
        isLineMode ? "pointer-events-auto cursor-crosshair z-20" : "pointer-events-none z-5"
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Existing Lines */}
      {lines.map((line) => {
        const isSelected = selectedLineId === line.id;
        const midX = (line.x1 + line.x2) / 2;
        const midY = (line.y1 + line.y2) / 2;
        
        return (
          <g key={line.id}>
            {/* Hit area for selection - larger for easier clicking */}
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="transparent"
              strokeWidth={24}
              className={cn(!isLineMode && "pointer-events-auto cursor-pointer")}
              onClick={(e) => handleLineClick(e, line.id)}
            />
            {/* Visible line */}
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.color}
              strokeWidth={line.thickness}
              strokeLinecap="round"
              strokeDasharray={line.lineStyle === 'dashed' ? '10,5' : undefined}
              className={cn(
                isSelected && "filter drop-shadow-md",
                !isLineMode && "pointer-events-auto cursor-pointer"
              )}
              onClick={(e) => handleLineClick(e, line.id)}
            />
            
            {/* Selection UI - drag handles and move handle */}
            {isSelected && !isLineMode && (
              <>
                {/* Move handle in center */}
                <circle
                  cx={midX}
                  cy={midY}
                  r={10}
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  className="pointer-events-auto cursor-move"
                  onPointerDown={(e) => handleLineDragStart(e, line)}
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r={4}
                  fill="#3b82f6"
                  className="pointer-events-none"
                />
                
                {/* Endpoint 1 - resize handle */}
                <circle
                  cx={line.x1}
                  cy={line.y1}
                  r={8}
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  className="pointer-events-auto cursor-crosshair hover:scale-125 transition-transform origin-center"
                  onPointerDown={(e) => handleEndpointDragStart(e, line, 'endpoint1')}
                />
                
                {/* Endpoint 2 - resize handle */}
                <circle
                  cx={line.x2}
                  cy={line.y2}
                  r={8}
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  className="pointer-events-auto cursor-crosshair hover:scale-125 transition-transform origin-center"
                  onPointerDown={(e) => handleEndpointDragStart(e, line, 'endpoint2')}
                />
              </>
            )}
          </g>
        );
      })}

      {/* Preview line while drawing */}
      {dragMode === 'draw' && startPoint && currentEndPoint && (
        <>
          <line
            x1={startPoint.x}
            y1={startPoint.y}
            x2={currentEndPoint.x}
            y2={currentEndPoint.y}
            stroke={currentColor}
            strokeWidth={currentThickness}
            strokeLinecap="round"
            className="opacity-70"
          />
          {/* Snap indicator dots */}
          <circle cx={startPoint.x} cy={startPoint.y} r={4} fill={currentColor} />
          <circle cx={currentEndPoint.x} cy={currentEndPoint.y} r={4} fill={currentColor} />
        </>
      )}
    </svg>
  );
}
