'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PDFPageProxy } from 'pdfjs-dist';

export interface Annotation {
  id: string;
  type: 'ink' | 'rectangle' | 'polygon';
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface AnnotationDrawState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  points: { x: number; y: number }[];
}

interface PdfAnnotationLayerProps {
  page: PDFPageProxy | null;
  scale: number;
  width: number;
  height: number;
  annotations: Annotation[];
  onAnnotationCreate: (annotation: Omit<Annotation, 'id'>) => void;
  currentTool: 'ink' | 'rectangle' | 'polygon' | null;
  currentColor: string;
  strokeWidth: number;
}

export default function PdfAnnotationLayer({
  page,
  scale,
  width,
  height,
  annotations,
  onAnnotationCreate,
  currentTool,
  currentColor,
  strokeWidth,
}: PdfAnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawState, setDrawState] = useState<AnnotationDrawState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    points: [],
  });

  // Clear and redraw all annotations
  const redrawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all saved annotations
    annotations.forEach(annotation => {
      ctx.beginPath();
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.width;
      
      if (annotation.type === 'ink') {
        if (annotation.points.length < 2) return;
        
        ctx.moveTo(annotation.points[0].x * canvas.width, annotation.points[0].y * canvas.height);
        
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x * canvas.width, annotation.points[i].y * canvas.height);
        }
      } else if (annotation.type === 'rectangle') {
        if (annotation.points.length < 2) return;
        
        const startX = annotation.points[0].x * canvas.width;
        const startY = annotation.points[0].y * canvas.height;
        const endX = annotation.points[1].x * canvas.width;
        const endY = annotation.points[1].y * canvas.height;
        
        const rectWidth = endX - startX;
        const rectHeight = endY - startY;
        
        ctx.rect(startX, startY, rectWidth, rectHeight);
      } else if (annotation.type === 'polygon') {
        if (annotation.points.length < 3) return;
        
        ctx.moveTo(annotation.points[0].x * canvas.width, annotation.points[0].y * canvas.height);
        
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x * canvas.width, annotation.points[i].y * canvas.height);
        }
        
        ctx.closePath();
      }
      
      ctx.stroke();
    });
    
    // Draw current annotation in progress
    if (drawState.isDrawing && drawState.points.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth;
      
      if (currentTool === 'ink') {
        ctx.moveTo(drawState.points[0].x * canvas.width, drawState.points[0].y * canvas.height);
        
        for (let i = 1; i < drawState.points.length; i++) {
          ctx.lineTo(drawState.points[i].x * canvas.width, drawState.points[i].y * canvas.height);
        }
      } else if (currentTool === 'rectangle' && drawState.points.length >= 2) {
        const startX = drawState.points[0].x * canvas.width;
        const startY = drawState.points[0].y * canvas.height;
        const endX = drawState.points[drawState.points.length - 1].x * canvas.width;
        const endY = drawState.points[drawState.points.length - 1].y * canvas.height;
        
        const rectWidth = endX - startX;
        const rectHeight = endY - startY;
        
        ctx.rect(startX, startY, rectWidth, rectHeight);
      } else if (currentTool === 'polygon') {
        ctx.moveTo(drawState.points[0].x * canvas.width, drawState.points[0].y * canvas.height);
        
        for (let i = 1; i < drawState.points.length; i++) {
          ctx.lineTo(drawState.points[i].x * canvas.width, drawState.points[i].y * canvas.height);
        }
        
        // Connect to current mouse position if needed
        if (drawState.points.length > 1) {
          ctx.lineTo(drawState.currentX * canvas.width, drawState.currentY * canvas.height);
        }
      }
      
      ctx.stroke();
    }
  };

  // Set up canvas and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = width;
    canvas.height = height;
    
    redrawAnnotations();
  }, [width, height, annotations, drawState, currentTool, currentColor, strokeWidth]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentTool) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;
    
    setDrawState({
      isDrawing: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      points: [{ x, y }],
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawState.isDrawing || !currentTool) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;
    
    if (currentTool === 'ink') {
      setDrawState(prev => ({
        ...prev,
        currentX: x,
        currentY: y,
        points: [...prev.points, { x, y }],
      }));
    } else if (currentTool === 'rectangle') {
      setDrawState(prev => ({
        ...prev,
        currentX: x,
        currentY: y,
        points: [prev.points[0], { x, y }],
      }));
    } else if (currentTool === 'polygon') {
      setDrawState(prev => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));
    }
  };

  const handleMouseUp = () => {
    if (!drawState.isDrawing || !currentTool) return;
    
    // Finalize the annotation
    if (currentTool === 'ink' && drawState.points.length > 1) {
      onAnnotationCreate({
        type: 'ink',
        points: drawState.points,
        color: currentColor,
        width: strokeWidth,
      });
    } else if (currentTool === 'rectangle' && drawState.points.length >= 2) {
      onAnnotationCreate({
        type: 'rectangle',
        points: [drawState.points[0], drawState.points[drawState.points.length - 1]],
        color: currentColor,
        width: strokeWidth,
      });
    } else if (currentTool === 'polygon' && drawState.points.length >= 3) {
      // For polygon, we need at least 3 points
      onAnnotationCreate({
        type: 'polygon',
        points: drawState.points,
        color: currentColor,
        width: strokeWidth,
      });
    }
    
    setDrawState({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      points: [],
    });
  };

  const handleMouseLeave = () => {
    if (drawState.isDrawing && currentTool !== 'polygon') {
      handleMouseUp();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'polygon') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;
    
    if (!drawState.isDrawing) {
      // Start drawing a polygon
      setDrawState({
        isDrawing: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        points: [{ x, y }],
      });
    } else {
      // Add a point to the polygon
      setDrawState(prev => ({
        ...prev,
        points: [...prev.points, { x, y }],
      }));
      
      // Check if we're closing the polygon (clicking near the first point)
      if (drawState.points.length > 2) {
        const firstPoint = drawState.points[0];
        const distance = Math.sqrt(
          Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
        );
        
        if (distance < 0.01) {
          // Close the polygon
          handleMouseUp();
        }
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="annotation-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: currentTool ? 'auto' : 'none',
        cursor: currentTool ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  );
}
