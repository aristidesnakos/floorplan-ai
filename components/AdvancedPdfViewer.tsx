'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getDocument, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { setupPdfJsWorker, PDF_JS_OPTIONS } from '@/lib/pdfjs-config';
import PdfAnnotationLayer, { Annotation } from '@/components/PdfAnnotationLayer';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Loader2,
  Pencil,
  Square,
  Triangle,
  Save,
  Download
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AdvancedPdfViewerProps {
  pdfUrl: string;
  pdfId: string;
  onBack?: () => void;
  onSave?: (annotations: Annotation[]) => void;
}

export default function AdvancedPdfViewer({ 
  pdfUrl, 
  pdfId, 
  onBack,
  onSave 
}: AdvancedPdfViewerProps) {
  // PDF state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  
  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<'ink' | 'rectangle' | 'polygon' | null>(null);
  const [currentColor, setCurrentColor] = useState('#ff0000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  
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
  
  // Load annotations for the current page
  useEffect(() => {
    // In a real implementation, this would load annotations from a database or localStorage
    // For now, we'll just use an empty array
    setAnnotations([]);
  }, [pdfId, currentPage]);
  
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
  
  // Handle annotation creation
  const handleAnnotationCreate = (newAnnotation: Omit<Annotation, 'id'>) => {
    const annotation: Annotation = {
      ...newAnnotation,
      id: uuidv4(),
    };
    
    setAnnotations(prev => [...prev, annotation]);
  };
  
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
  
  // Tool selection
  const toggleTool = (tool: 'ink' | 'rectangle' | 'polygon') => {
    setCurrentTool(prev => prev === tool ? null : tool);
  };
  
  // Save annotations
  const saveAnnotations = () => {
    if (onSave) {
      onSave(annotations);
    } else {
      // Default implementation: save to localStorage
      const storageKey = `pdf_annotations_${pdfId}_${currentPage}`;
      localStorage.setItem(storageKey, JSON.stringify(annotations));
      alert('Annotations saved successfully!');
    }
  };
  
  // Export annotations as XFDF
  const exportAnnotations = () => {
    // Basic XFDF structure
    let xfdf = `<?xml version="1.0" encoding="UTF-8"?>
<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">
  <annots>`;
    
    // Add each annotation
    annotations.forEach(annotation => {
      if (annotation.type === 'ink') {
        // Ink annotation
        const pointsStr = annotation.points
          .map(p => `${p.x},${p.y}`)
          .join(';');
        
        xfdf += `
    <ink page="${currentPage - 1}" color="${annotation.color}" width="${annotation.width}" 
         rect="0,0,0,0" title="Annotation" subject="Ink" date="${new Date().toISOString()}">
      <inklist>${pointsStr}</inklist>
    </ink>`;
      } else if (annotation.type === 'rectangle') {
        // Rectangle annotation
        const x1 = annotation.points[0].x;
        const y1 = annotation.points[0].y;
        const x2 = annotation.points[1].x;
        const y2 = annotation.points[1].y;
        
        xfdf += `
    <square page="${currentPage - 1}" color="${annotation.color}" width="${annotation.width}" 
            rect="${x1},${y1},${x2},${y2}" title="Annotation" subject="Rectangle" date="${new Date().toISOString()}">
    </square>`;
      } else if (annotation.type === 'polygon') {
        // Polygon annotation
        const vertices = annotation.points
          .map(p => `${p.x},${p.y}`)
          .join(';');
        
        xfdf += `
    <polygon page="${currentPage - 1}" color="${annotation.color}" width="${annotation.width}" 
             vertices="${vertices}" title="Annotation" subject="Polygon" date="${new Date().toISOString()}">
    </polygon>`;
      }
    });
    
    // Close XFDF structure
    xfdf += `
  </annots>
</xfdf>`;
    
    // Create a download link
    const blob = new Blob([xfdf], { type: 'application/vnd.adobe.xfdf+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations_${pdfId}_page${currentPage}.xfdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="advanced-pdf-viewer flex flex-col w-full" ref={containerRef}>
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
        
        <div className="annotation-controls flex items-center space-x-2">
          <Button
            onClick={() => toggleTool('ink')}
            variant={currentTool === 'ink' ? 'default' : 'outline'}
            size="sm"
            className={currentTool === 'ink' 
              ? "bg-blue-600/80 hover:bg-blue-700 text-white" 
              : "hover:bg-white/10 border-white/20 text-white/90"}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Ink
          </Button>
          
          <Button
            onClick={() => toggleTool('rectangle')}
            variant={currentTool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            className={currentTool === 'rectangle' 
              ? "bg-blue-600/80 hover:bg-blue-700 text-white" 
              : "hover:bg-white/10 border-white/20 text-white/90"}
          >
            <Square className="h-4 w-4 mr-1" />
            Rectangle
          </Button>
          
          <Button
            onClick={() => toggleTool('polygon')}
            variant={currentTool === 'polygon' ? 'default' : 'outline'}
            size="sm"
            className={currentTool === 'polygon' 
              ? "bg-blue-600/80 hover:bg-blue-700 text-white" 
              : "hover:bg-white/10 border-white/20 text-white/90"}
          >
            <Triangle className="h-4 w-4 mr-1" />
            Polygon
          </Button>
          
          <select
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="color-selector bg-white/10 border border-white/20 rounded px-2 py-1 text-white/90 text-sm"
          >
            <option value="#ff0000">Red</option>
            <option value="#00ff00">Green</option>
            <option value="#0000ff">Blue</option>
            <option value="#ffff00">Yellow</option>
            <option value="#000000">Black</option>
          </select>
          
          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="width-selector bg-white/10 border border-white/20 rounded px-2 py-1 text-white/90 text-sm"
          >
            <option value="1">Thin</option>
            <option value="2">Medium</option>
            <option value="4">Thick</option>
          </select>
          
          <Button
            onClick={saveAnnotations}
            variant="outline"
            size="sm"
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          <Button
            onClick={exportAnnotations}
            variant="outline"
            size="sm"
            className="hover:bg-white/10 border-white/20 text-white/90"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
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
          
          {/* Annotation Layer */}
          {!isLoading && pageSize.width > 0 && (
            <PdfAnnotationLayer
              page={null}
              scale={scale}
              width={pageSize.width}
              height={pageSize.height}
              annotations={annotations}
              onAnnotationCreate={handleAnnotationCreate}
              currentTool={currentTool}
              currentColor={currentColor}
              strokeWidth={strokeWidth}
            />
          )}
        </div>
      </div>
      
      {/* Annotation Info */}
      {annotations.length > 0 && (
        <div className="annotation-info mt-2 text-white/70 text-sm">
          {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} on this page
        </div>
      )}
      
      {/* Tool Help */}
      {currentTool && (
        <div className="tool-help mt-2 text-white/70 text-sm">
          {currentTool === 'ink' && 'Click and drag to draw freehand lines'}
          {currentTool === 'rectangle' && 'Click and drag to create a rectangle'}
          {currentTool === 'polygon' && 'Click to add points, click near the first point to close the polygon'}
        </div>
      )}
      
      {/* Footer */}
      <div className="pdf-footer mt-2 text-center text-white/50 text-xs">
        Powered by PDF.js
      </div>
    </div>
  );
}
