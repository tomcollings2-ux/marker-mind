import React, { useRef, useState, useEffect } from 'react';
import type { Drawing } from '@shared/schema';
import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  drawings: Drawing[];
  onAddDrawing: (drawing: { color: string; thickness: number; path: Point[] }) => void;
  isDrawingMode: boolean;
  currentColor: string;
  currentThickness: number;
  zoom?: number;
  pan?: { x: number; y: number };
}

export function DrawingCanvas({ 
  drawings, 
  onAddDrawing, 
  isDrawingMode,
  currentColor = '#000000',
  currentThickness = 4,
  zoom = 1,
  pan = { x: 0, y: 0 }
}: DrawingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCoordinates = (e: React.PointerEvent) => {
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
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawingMode) return;
    e.preventDefault();
    setIsDrawing(true);
    const point = getCoordinates(e);
    setCurrentPath([point]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !isDrawingMode) return;
    e.preventDefault();
    const point = getCoordinates(e);
    setCurrentPath(prev => [...prev, point]);
  };

  const handlePointerUp = () => {
    if (!isDrawing || !isDrawingMode) return;
    setIsDrawing(false);
    
    if (currentPath.length > 1) {
      onAddDrawing({
        color: currentColor,
        thickness: currentThickness,
        path: currentPath
      });
    }
    setCurrentPath([]);
  };

  const pointsToSvgPath = (points: unknown) => {
    const pathPoints = points as Point[];
    if (!pathPoints || pathPoints.length === 0) return '';
    const d = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return d;
  };

  return (
    <svg
      ref={svgRef}
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none touch-none",
        isDrawingMode && "pointer-events-auto cursor-crosshair"
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <defs>
        <filter id="marker-roughness">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </defs>

      {drawings.map((drawing) => (
        <path
          key={drawing.id}
          d={pointsToSvgPath(drawing.path)}
          stroke={drawing.color}
          strokeWidth={drawing.thickness}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'url(#marker-roughness)' }}
        />
      ))}

      {currentPath.length > 0 && (
        <path
          d={pointsToSvgPath(currentPath)}
          stroke={currentColor}
          strokeWidth={currentThickness}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-70"
        />
      )}
    </svg>
  );
}
