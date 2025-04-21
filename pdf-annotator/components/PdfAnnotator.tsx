'use client';

import React, { useState, useEffect, useRef, useCallback, MouseEvent } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from './ui/button';
import { AnnotationRect, AnnotationData } from '../types';
import { useToast } from './ui/use-toast';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

interface PdfAnnotatorProps {
  file: File;
}

export function PdfAnnotator({ file }: PdfAnnotatorProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState<number>(1.5); // Initial zoom level
  const [annotations, setAnnotations] = useState<AnnotationRect[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Omit<AnnotationRect, 'id' | 'pdfId' | 'pageNumber' | 'createdAt'> | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState<boolean>(false);

  const pdfWrapperRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const pdfIdentifier = file.name; // Use filename as a simple ID

  // --- PDF Loading ---
  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setCurrentPage(1); // Reset to first page on new file load
    setAnnotations([]); // Clear annotations from previous PDF
    setIsLoadingPdf(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    toast({
      title: "Error Loading PDF",
      description: `Failed to load the PDF file. ${error.message}`,
      variant: "destructive",
    });
    setIsLoadingPdf(false);
  };

  // --- Annotation Fetching ---
  const fetchAnnotations = useCallback(async (page: number) => {
    setIsLoadingAnnotations(true);
    try {
      const response = await fetch(`/api/annotations/${encodeURIComponent(pdfIdentifier)}?pageNumber=${page}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch annotations: ${response.statusText}`);
      }
      const data: AnnotationData[] = await response.json();
      // Map fetched data to AnnotationRect for UI state
      setAnnotations(data.map(anno => ({...anno, isSaving: false })));
    } catch (error) {
      console.error("Fetch annotations error:", error);
      toast({
        title: "Error",
        description: "Could not fetch existing annotations.",
        variant: "destructive",
      });
      setAnnotations([]); // Clear annotations on error
    } finally {
      setIsLoadingAnnotations(false);
    }
  }, [pdfIdentifier, toast]);

  // Fetch annotations when page changes or file changes
  useEffect(() => {
    if (numPages > 0) {
      fetchAnnotations(currentPage);
    }
  }, [currentPage, numPages, fetchAnnotations]);

  // --- Annotation Drawing Logic ---
  const getRelativeCoords = (event: MouseEvent<HTMLDivElement>): { x: number; y: number } | null => {
    const container = pdfWrapperRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    // Calculate position relative to the container
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    // Normalize coordinates to be relative (0 to 1) based on container size
    const x = offsetX / rect.width;
    const y = offsetY / rect.height;

    // Clamp values between 0 and 1
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    // Only start drawing if clicking directly on the page area, not on existing annotations
    if ((event.target as HTMLElement)?.closest('.annotation-rect')) {
      return;
    }
    setIsDrawing(true);
    const point = getRelativeCoords(event);
    setStartPoint(point);
    setCurrentRect(null); // Reset temporary rectangle
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint) return;

    const currentPoint = getRelativeCoords(event);
    if (!currentPoint) return;

    const newRect = {
      x: Math.min(startPoint.x, currentPoint.x),
      y: Math.min(startPoint.y, currentPoint.y),
      width: Math.abs(startPoint.x - currentPoint.x),
      height: Math.abs(startPoint.y - currentPoint.y),
    };
    setCurrentRect(newRect);
  };

  const handleMouseUp = async (event: MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !currentRect || (currentRect.width < 0.005 && currentRect.height < 0.005)) {
      // If the rectangle is too small, or wasn't dragged, cancel drawing
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentRect(null);
      return;
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null); // Clear the temporary drawing rect

    const finalRectData: AnnotationData = {
      ...currentRect,
      pdfId: pdfIdentifier,
      pageNumber: currentPage,
    };

    // Optimistic UI update
    const optimisticId = `temp-${Date.now()}`; // Temporary ID for UI key
    const optimisticAnnotation: AnnotationRect = {
      ...finalRectData,
      id: optimisticId,
      isSaving: true,
    };
    setAnnotations(prev => [...prev, optimisticAnnotation]);

    // --- Annotation Saving ---
    try {
      const response = await fetch(`/api/annotations/${encodeURIComponent(pdfIdentifier)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalRectData), // Send data without temp ID
      });

      if (!response.ok) {
        throw new Error(`Failed to save annotation: ${response.statusText}`);
      }
      const savedAnnotation: AnnotationData = await response.json();

      // Update the optimistic annotation with the real data from the server
      setAnnotations(prev => prev.map(anno =>
        anno.id === optimisticId ? { ...savedAnnotation, isSaving: false } : anno
      ));

      toast({
        title: "Success",
        description: "Annotation saved.",
      });

    } catch (error) {
      console.error("Save annotation error:", error);
      toast({
        title: "Error Saving Annotation",
        description: "Could not save the annotation. Please try again.",
        variant: "destructive",
      });
      // Remove the optimistic annotation if save failed
      setAnnotations(prev => prev.filter(anno => anno.id !== optimisticId));
    }
  };

  // --- Page Navigation ---
  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(numPages, prev + 1));

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* --- PDF Viewer Area --- */}
      <div
        ref={pdfWrapperRef}
        className="relative border border-gray-300 overflow-auto max-h-[80vh]" // Limit height and allow scrolling
        style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { // Cancel drawing if mouse leaves the area
          if (isDrawing) {
            setIsDrawing(false);
            setStartPoint(null);
            setCurrentRect(null);
          }
        }}
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex justify-center items-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading PDF...</span>
            </div>
          }
          error={
            <div className="p-10 text-red-600 bg-red-100 border border-red-400 rounded">
              Failed to load PDF document. Please ensure it's a valid PDF.
            </div>
          }
        >
          {!isLoadingPdf && numPages > 0 && (
            <Page
              key={`page_${currentPage}`} // Important for re-rendering on page change
              pageNumber={currentPage}
              scale={pdfScale}
              renderTextLayer={false} // Improve performance if text selection isn't needed
              renderAnnotationLayer={false} // Disable default annotations if any
              loading={
                <div className="flex justify-center items-center p-10">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              }
            />
          )}
        </Document>

        {/* --- Annotation Overlays --- */}
        {isLoadingAnnotations && (
          <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-10">
            <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
          </div>
        )}
        {/* Display saved annotations */}
        {annotations.map((anno) => (
          <div
            key={anno.id}
            className={`annotation-rect absolute border-2 ${anno.isSaving ? 'border-yellow-500 animate-pulse' : 'border-blue-600'} bg-blue-500 bg-opacity-20 pointer-events-none`} // Existing annotations non-interactive
            style={{
              left: `${anno.x * 100}%`,
              top: `${anno.y * 100}%`,
              width: `${anno.width * 100}%`,
              height: `${anno.height * 100}%`,
              zIndex: 10, // Ensure annotations are above the page
            }}
          />
        ))}
        {/* Display the rectangle being drawn */}
        {isDrawing && currentRect && (
          <div
            className="absolute border-2 border-dashed border-red-600 bg-red-500 bg-opacity-20 pointer-events-none"
            style={{
              left: `${currentRect.x * 100}%`,
              top: `${currentRect.y * 100}%`,
              width: `${currentRect.width * 100}%`,
              height: `${currentRect.height * 100}%`,
              zIndex: 20, // Ensure drawing rect is on top
            }}
          />
        )}
      </div>

      {/* --- Controls --- */}
      {!isLoadingPdf && numPages > 0 && (
        <div className="flex items-center gap-4 mt-2">
          <Button onClick={goToPrevPage} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span>
            Page {currentPage} of {numPages}
          </span>
          <Button onClick={goToNextPage} disabled={currentPage >= numPages}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
