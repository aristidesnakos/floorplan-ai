'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { AnnotationDrawState, Annotation } from '@/types/annotation';
import { getAnnotationsForPage, saveAnnotation } from '@/lib/annotationStorage';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, Pencil } from 'lucide-react';

// Initialize PDF.js worker
import { setupPdfWorker } from '@/lib/pdfWorker';
setupPdfWorker();

interface PdfViewerProps {
  pdfData: string;
  pdfId: string;
}

export default function PdfViewer({ pdfData, pdfId }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawState, setDrawState] = useState<AnnotationDrawState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [isAnnotationMode, setIsAnnotationMode] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load annotations when page changes
  useEffect(() => {
    if (pdfId && !isLoading) {
      const pageAnnotations = getAnnotationsForPage(pdfId, currentPage);
      setAnnotations(pageAnnotations);
    }
  }, [pdfId, currentPage, isLoading]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
    toast({
      title: "Error loading PDF",
      description: error.message,
      variant: "destructive"
    });
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.6));
  };

  const toggleAnnotationMode = () => {
    setIsAnnotationMode(prev => !prev);
    if (!isAnnotationMode) {
      toast({
        title: "Annotation mode enabled",
        description: "Click and drag to create annotations"
      });
    }
  };

  // Mouse event handlers for annotation drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isAnnotationMode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setDrawState({
      isDrawing: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  }, [isAnnotationMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawState.isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setDrawState(prev => ({
      ...prev,
      currentX: x,
      currentY: y,
    }));
  }, [drawState.isDrawing]);

  const handleMouseUp = useCallback(() => {
    if (!drawState.isDrawing) return;

    // Calculate width and height (ensure they are positive)
    const width = Math.abs(drawState.currentX - drawState.startX);
    const height = Math.abs(drawState.currentY - drawState.startY);

    // Only save if the annotation has a minimum size
    if (width > 0.01 && height > 0.01) {
      // Determine the actual top-left coordinates
      const x = Math.min(drawState.startX, drawState.currentX);
      const y = Math.min(drawState.startY, drawState.currentY);

      const newAnnotation = saveAnnotation({
        pdfId,
        pageNumber: currentPage,
        x,
        y,
        width,
        height,
        color: 'blue-600',
      });

      setAnnotations(prev => [...prev, newAnnotation]);
      toast({
        title: "Annotation saved",
        description: `Annotation created on page ${currentPage}`,
      });
    }

    setDrawState({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, [drawState, pdfId, currentPage, toast]);

  // Calculate the position and dimensions of the annotation being drawn
  const getCurrentRectStyle = () => {
    if (!drawState.isDrawing) return null;

    const x = Math.min(drawState.startX, drawState.currentX);
    const y = Math.min(drawState.startY, drawState.currentY);
    const width = Math.abs(drawState.currentX - drawState.startX);
    const height = Math.abs(drawState.currentY - drawState.startY);

    return {
      left: `${x * 100}%`,
      top: `${y * 100}%`,
      width: `${width * 100}%`,
      height: `${height * 100}%`,
    };
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* PDF Controls */}
      <div className="w-full flex justify-between items-center mb-4 bg-white/5 p-3 rounded-md">
        <div className="flex items-center space-x-2">
          <Button
            onClick={goToPrevPage}
            disabled={currentPage <= 1 || isLoading}
            variant="outline"
            size="sm"
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Prev</span>
          </Button>

          <Button
            onClick={goToNextPage}
            disabled={currentPage >= numPages || isLoading}
            variant="outline"
            size="sm"
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <span className="mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-white/80 text-sm">
            Page {currentPage} of {numPages}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleAnnotationMode}
            variant={isAnnotationMode ? "default" : "outline"}
            size="sm"
            className={isAnnotationMode
              ? "bg-blue-600/80 hover:bg-blue-700 text-white"
              : "hover:bg-white/10 border-white/20 text-white/90"}
          >
            <Pencil className="h-4 w-4 mr-1" />
            {isAnnotationMode ? "Drawing" : "Draw"}
          </Button>

          <Button
            onClick={zoomOut}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-white/80 text-sm">
            {Math.round(scale * 100)}%
          </span>

          <Button
            onClick={zoomIn}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer with Annotations */}
      <div
        ref={canvasRef}
        className="w-full relative overflow-hidden bg-white/5 rounded-md p-4 max-h-[80vh]"
        style={{ cursor: isAnnotationMode ? 'crosshair' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex flex-col items-center justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-white/70" />
              <span className="mt-2 text-white/70">Loading PDF...</span>
            </div>
          }
          error={
            <div className="p-10 text-red-400 bg-red-900/20 border border-red-800/30 rounded-md text-center">
              Failed to load PDF document. The file might be corrupted or too large.
            </div>
          }
        >
          {!isLoading && (
            <Page
              key={`page_${currentPage}`}
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <div className="flex justify-center items-center p-10">
                  <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                </div>
              }
              className="mx-auto"
            />
          )}
        </Document>

        {/* Display existing annotations */}
        {annotations.map(annotation => (
          <div
            key={annotation.id}
            className="absolute border-2 border-blue-600 bg-blue-500 bg-opacity-20 pointer-events-none"
            style={{
              left: `${annotation.x * 100}%`,
              top: `${annotation.y * 100}%`,
              width: `${annotation.width * 100}%`,
              height: `${annotation.height * 100}%`,
            }}
          />
        ))}

        {/* Display the annotation currently being drawn */}
        {drawState.isDrawing && (
          <div
            className="absolute border-2 border-blue-600 bg-blue-500 bg-opacity-20 pointer-events-none"
            style={getCurrentRectStyle() as React.CSSProperties}
          />
        )}
      </div>

      {isAnnotationMode && (
        <div className="mt-4 text-sm text-white/70">
          Click and drag to draw rectangular annotations on the PDF
        </div>
      )}
    </div>
  );
}
