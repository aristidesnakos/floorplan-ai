'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// Import the worker setup function
import { setupPdfWorker } from '@/lib/pdfWorker';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  // Initialize the worker
  setupPdfWorker();
}

interface SimplePdfViewerProps {
  pdfData: string;
  onBack?: () => void;
}

const SimplePdfViewer: React.FC<SimplePdfViewerProps> = ({ pdfData, onBack }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error('Error loading PDF:', err);
    setError(`Error loading PDF. Please try again.`);
    setIsLoading(false);

    // Try to reinitialize the worker
    if (typeof window !== 'undefined') {
      try {
        setupPdfWorker();
      } catch (e) {
        console.error('Failed to reinitialize worker:', e);
      }
    }
  };

  const changePage = (offset: number) => {
    if (!numPages) return;
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
    }
  };

  const changeZoom = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(2.5, scale + delta));
    setScale(newScale);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div>
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="mr-2 hover:bg-white/10 border-white/20 text-white/90"
            >
              ← Back
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-white/90">
            {pageNumber} / {numPages || '?'}
          </span>

          <Button
            variant="outline"
            onClick={() => changePage(1)}
            disabled={!numPages || pageNumber >= numPages}
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => changeZoom(-0.1)}
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-white/90">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="outline"
            onClick={() => changeZoom(0.1)}
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="w-full relative overflow-hidden bg-white/5 rounded-md p-4 max-h-[80vh] overflow-y-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center p-10 text-red-500">
            <p>{error}</p>
            <p className="mt-4 text-white/70 text-sm">
              Try refreshing the page or using a different PDF file.
            </p>
          </div>
        ) : (
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
              <div className="flex flex-col items-center justify-center p-10 text-red-500">
                <p>Failed to load PDF</p>
              </div>
            }
          >
            {isLoading ? null : (
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-white/70" />
                  </div>
                }
              />
            )}
          </Document>
        )}
      </div>
    </div>
  );
};

export default SimplePdfViewer;
