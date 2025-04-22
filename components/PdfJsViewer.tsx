'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getDocument, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { setupPdfJsWorker, PDF_JS_OPTIONS } from '@/lib/pdfjs-config';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

interface PdfJsViewerProps {
  pdfUrl: string;
  onBack?: () => void;
}

export default function PdfJsViewer({ pdfUrl, onBack }: PdfJsViewerProps) {
  // PDF state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  // Initialize PDF.js worker
  useEffect(() => {
    setupPdfJsWorker();
  }, []);

  // Load the PDF document
  useEffect(() => {
    if (!pdfUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    const loadPdf = async () => {
      try {
        const loadingTask = getDocument({
          url: pdfUrl,
          ...PDF_JS_OPTIONS
        });
        
        // Optional: Add progress monitoring
        loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          const progress = total ? Math.round((loaded / total) * 100) : 0;
          console.log(`Loading PDF: ${progress}%`);
        };
        
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
        setIsLoading(false);
      }
    };
    
    loadPdf();
    
    return () => {
      // Cleanup
      if (pdfDoc) {
        pdfDoc.destroy();
        setPdfDoc(null);
      }
    };
  }, [pdfUrl]);

  // Render the current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Canvas element not available');
        }
        
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Canvas context not available');
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        setPageSize({
          width: viewport.width,
          height: viewport.height
        });
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
        setError('Failed to render PDF page');
      }
    };
    
    renderPage();
  }, [pdfDoc, currentPage, scale]);

  // Navigation functions
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  return (
    <div className="pdf-viewer-container flex flex-col w-full">
      {/* Controls */}
      <div className="controls-container flex justify-between items-center mb-4 bg-white/5 p-3 rounded-md">
        <div className="navigation-controls flex items-center space-x-2">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="hover:bg-white/10 border-white/20 text-white/90"
            >
              ← Back
            </Button>
          )}
          
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
          
          <span className="page-info text-white/80 text-sm">
            Page {currentPage} of {numPages}
          </span>
          
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
        </div>
        
        <div className="zoom-controls flex items-center space-x-2">
          <Button
            onClick={zoomOut}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="zoom-level text-white/80 text-sm">
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
      
      {/* PDF Viewer */}
      <div className="pdf-container w-full relative overflow-hidden bg-white/5 rounded-md p-4 max-h-[80vh] overflow-y-auto">
        {isLoading && (
          <div className="loading-indicator flex flex-col items-center justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            <span className="mt-2 text-white/70">Loading PDF...</span>
          </div>
        )}
        
        {error && (
          <div className="error-message p-10 text-red-400 bg-red-900/20 border border-red-800/30 rounded-md text-center">
            {error}
            <p className="mt-4 text-white/70 text-sm">
              Try refreshing the page or using a different PDF file.
            </p>
          </div>
        )}
        
        <div className="canvas-container" style={{ position: 'relative' }}>
          <canvas ref={canvasRef} className="pdf-canvas mx-auto" />
        </div>
      </div>
      
      {/* Footer */}
      <div className="pdf-footer mt-2 text-center text-white/50 text-xs">
        Powered by PDF.js
      </div>
    </div>
  );
}
