# PDF.js Implementation Guide

This guide provides detailed instructions for implementing Mozilla's PDF.js in our architectural floor plan annotation application.

## 1. Installation and Setup

### 1.1 Download PDF.js

Clone the PDF.js repository:

```bash
git clone https://github.com/mozilla/pdf.js.git
cd pdf.js
```

### 1.2 Directory Structure

Following Mozilla's recommendations, set up the following directory structure:

```
public/
├── pdfjs/
│   ├── build/
│   │   ├── pdf.mjs
│   │   ├── pdf.mjs.map
│   │   ├── pdf.worker.mjs
│   │   └── pdf.worker.mjs.map
│   ├── web/
│   │   ├── cmaps/
│   │   ├── images/
│   │   ├── locale/
│   │   ├── viewer.css
│   │   ├── viewer.html
│   │   ├── viewer.mjs
│   │   └── viewer.mjs.map
```

### 1.3 Setup Script

Create a setup script to automate the installation process:

```javascript
// scripts/setup-pdfjs.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const PDFJS_VERSION = '4.0.269'; // Use the latest stable version
const TEMP_DIR = path.join(__dirname, '../temp');
const PUBLIC_DIR = path.join(__dirname, '../public/pdfjs');

// Create directories
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Clone PDF.js repository
console.log('Cloning PDF.js repository...');
execSync(`git clone --depth 1 --branch v${PDFJS_VERSION} https://github.com/mozilla/pdf.js.git ${TEMP_DIR}/pdf.js`);

// Copy necessary files
console.log('Copying files to public directory...');
fs.mkdirSync(`${PUBLIC_DIR}/build`, { recursive: true });
fs.mkdirSync(`${PUBLIC_DIR}/web`, { recursive: true });

// Copy build files
const buildFiles = ['pdf.mjs', 'pdf.mjs.map', 'pdf.worker.mjs', 'pdf.worker.mjs.map'];
buildFiles.forEach(file => {
  fs.copyFileSync(
    path.join(TEMP_DIR, 'pdf.js/build', file),
    path.join(PUBLIC_DIR, 'build', file)
  );
});

// Copy web files
const webDirs = ['cmaps', 'images', 'locale'];
webDirs.forEach(dir => {
  fs.mkdirSync(path.join(PUBLIC_DIR, 'web', dir), { recursive: true });
  copyDir(
    path.join(TEMP_DIR, 'pdf.js/web', dir),
    path.join(PUBLIC_DIR, 'web', dir)
  );
});

const webFiles = ['viewer.css', 'viewer.html', 'viewer.mjs', 'viewer.mjs.map'];
webFiles.forEach(file => {
  fs.copyFileSync(
    path.join(TEMP_DIR, 'pdf.js/web', file),
    path.join(PUBLIC_DIR, 'web', file)
  );
});

// Helper function to copy directories recursively
function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

console.log('PDF.js setup complete!');
```

## 2. Core Integration

### 2.1 PDF.js Worker Configuration

Create a utility file to configure the PDF.js worker:

```typescript
// lib/pdfjs-config.ts
import { GlobalWorkerOptions } from 'pdfjs-dist';

export function setupPdfJsWorker() {
  if (typeof window === 'undefined') return; // Skip during SSR
  
  try {
    // Set the worker source path
    GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';
    console.log('PDF.js worker configured successfully');
  } catch (error) {
    console.error('Error configuring PDF.js worker:', error);
  }
}
```

### 2.2 Basic PDF Viewer Component

Create a basic PDF viewer component using PDF.js:

```typescript
// components/PdfJsViewer.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getDocument, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { setupPdfJsWorker } from '@/lib/pdfjs-config';

interface PdfJsViewerProps {
  pdfUrl: string;
}

export default function PdfJsViewer({ pdfUrl }: PdfJsViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const loadingTask = getDocument(pdfUrl);
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
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Canvas context not available');
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
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
    <div className="pdf-viewer-container">
      {/* Controls */}
      <div className="pdf-controls">
        <button 
          onClick={goToPrevPage} 
          disabled={currentPage <= 1 || isLoading}
        >
          Previous
        </button>
        
        <span>
          Page {currentPage} of {numPages}
        </span>
        
        <button 
          onClick={goToNextPage} 
          disabled={currentPage >= numPages || isLoading}
        >
          Next
        </button>
        
        <button onClick={zoomOut} disabled={isLoading}>
          Zoom Out
        </button>
        
        <span>{Math.round(scale * 100)}%</span>
        
        <button onClick={zoomIn} disabled={isLoading}>
          Zoom In
        </button>
      </div>
      
      {/* PDF Rendering Canvas */}
      <div className="pdf-canvas-container">
        {isLoading && <div className="loading">Loading PDF...</div>}
        {error && <div className="error">{error}</div>}
        <canvas ref={canvasRef} className="pdf-canvas" />
      </div>
    </div>
  );
}
```

## 3. Annotation System

### 3.1 Annotation Layer Component

Create a component for handling annotations:

```typescript
// components/PdfAnnotationLayer.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PDFPageProxy } from 'pdfjs-dist';

interface Annotation {
  id: string;
  type: 'ink' | 'rectangle' | 'polygon';
  points: { x: number; y: number }[];
  color: string;
  width: number;
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

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
        
        const width = endX - startX;
        const height = endY - startY;
        
        ctx.rect(startX, startY, width, height);
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
    if (isDrawing && currentPoints.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth;
      
      if (currentTool === 'ink') {
        ctx.moveTo(currentPoints[0].x * canvas.width, currentPoints[0].y * canvas.height);
        
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x * canvas.width, currentPoints[i].y * canvas.height);
        }
      } else if (currentTool === 'rectangle' && currentPoints.length >= 2) {
        const startX = currentPoints[0].x * canvas.width;
        const startY = currentPoints[0].y * canvas.height;
        const endX = currentPoints[currentPoints.length - 1].x * canvas.width;
        const endY = currentPoints[currentPoints.length - 1].y * canvas.height;
        
        const rectWidth = endX - startX;
        const rectHeight = endY - startY;
        
        ctx.rect(startX, startY, rectWidth, rectHeight);
      } else if (currentTool === 'polygon') {
        ctx.moveTo(currentPoints[0].x * canvas.width, currentPoints[0].y * canvas.height);
        
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x * canvas.width, currentPoints[i].y * canvas.height);
        }
        
        // Connect to current mouse position if needed
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
  }, [width, height, annotations, currentPoints, isDrawing]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentTool) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;
    
    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentTool) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;
    
    if (currentTool === 'ink') {
      setCurrentPoints(prev => [...prev, { x, y }]);
    } else if (currentTool === 'rectangle') {
      setCurrentPoints(prev => [prev[0], { x, y }]);
    } else if (currentTool === 'polygon') {
      // For polygon, we update the last point until mouse up
      setCurrentPoints(prev => {
        const newPoints = [...prev];
        if (newPoints.length > 1) {
          newPoints[newPoints.length - 1] = { x, y };
        }
        return newPoints;
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentTool) return;
    
    // Finalize the annotation
    if (currentTool === 'ink' && currentPoints.length > 1) {
      onAnnotationCreate({
        type: 'ink',
        points: currentPoints,
        color: currentColor,
        width: strokeWidth,
      });
    } else if (currentTool === 'rectangle' && currentPoints.length >= 2) {
      onAnnotationCreate({
        type: 'rectangle',
        points: [currentPoints[0], currentPoints[currentPoints.length - 1]],
        color: currentColor,
        width: strokeWidth,
      });
    } else if (currentTool === 'polygon' && currentPoints.length >= 3) {
      // For polygon, we need at least 3 points
      onAnnotationCreate({
        type: 'polygon',
        points: currentPoints,
        color: currentColor,
        width: strokeWidth,
      });
    }
    
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const handleMouseLeave = () => {
    if (isDrawing && currentTool !== 'polygon') {
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
    
    if (!isDrawing) {
      // Start drawing a polygon
      setIsDrawing(true);
      setCurrentPoints([{ x, y }]);
    } else {
      // Add a point to the polygon
      setCurrentPoints(prev => [...prev, { x, y }]);
      
      // Check if we're closing the polygon (clicking near the first point)
      if (currentPoints.length > 2) {
        const firstPoint = currentPoints[0];
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
```

### 3.2 Annotation Storage Service

Create a service for managing annotations:

```typescript
// lib/annotation-service.ts
import { v4 as uuidv4 } from 'uuid';

export interface Annotation {
  id: string;
  pdfId: string;
  pageNumber: number;
  type: 'ink' | 'rectangle' | 'polygon';
  points: { x: number; y: number }[];
  color: string;
  width: number;
  createdAt: string;
}

// Key for storing annotations in localStorage or IndexedDB
const ANNOTATION_STORAGE_KEY = 'pdf_annotations';

// Get all annotations from storage
export const getAllAnnotations = (): Record<string, Annotation[]> => {
  try {
    const storedAnnotations = localStorage.getItem(ANNOTATION_STORAGE_KEY);
    return storedAnnotations ? JSON.parse(storedAnnotations) : {};
  } catch (error) {
    console.error('Error retrieving annotations from storage:', error);
    return {};
  }
};

// Get annotations for a specific PDF and page
export const getAnnotationsForPage = (pdfId: string, pageNumber: number): Annotation[] => {
  try {
    const allAnnotations = getAllAnnotations();
    const pdfAnnotations = allAnnotations[pdfId] || [];
    return pdfAnnotations.filter(annotation => annotation.pageNumber === pageNumber);
  } catch (error) {
    console.error('Error retrieving page annotations:', error);
    return [];
  }
};

// Save a new annotation
export const saveAnnotation = (
  annotationData: Omit<Annotation, 'id' | 'createdAt'>
): Annotation => {
  try {
    const allAnnotations = getAllAnnotations();
    
    // Create a new annotation with ID and timestamp
    const newAnnotation: Annotation = {
      ...annotationData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    // Add to the annotations for this PDF
    const pdfAnnotations = allAnnotations[annotationData.pdfId] || [];
    allAnnotations[annotationData.pdfId] = [...pdfAnnotations, newAnnotation];
    
    // Save back to storage
    localStorage.setItem(ANNOTATION_STORAGE_KEY, JSON.stringify(allAnnotations));
    
    return newAnnotation;
  } catch (error) {
    console.error('Error saving annotation:', error);
    throw new Error('Failed to save annotation');
  }
};

// Delete an annotation
export const deleteAnnotation = (pdfId: string, annotationId: string): boolean => {
  try {
    const allAnnotations = getAllAnnotations();
    
    if (!allAnnotations[pdfId]) {
      return false;
    }
    
    // Filter out the annotation to delete
    allAnnotations[pdfId] = allAnnotations[pdfId].filter(
      annotation => annotation.id !== annotationId
    );
    
    // Save back to storage
    localStorage.setItem(ANNOTATION_STORAGE_KEY, JSON.stringify(allAnnotations));
    
    return true;
  } catch (error) {
    console.error('Error deleting annotation:', error);
    return false;
  }
};

// Export annotations to XFDF format (for interoperability)
export const exportAnnotationsToXFDF = (pdfId: string): string => {
  try {
    const allAnnotations = getAllAnnotations();
    const pdfAnnotations = allAnnotations[pdfId] || [];
    
    // Basic XFDF structure
    let xfdf = `<?xml version="1.0" encoding="UTF-8"?>
<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">
  <annots>`;
    
    // Add each annotation
    pdfAnnotations.forEach(annotation => {
      if (annotation.type === 'ink') {
        // Ink annotation
        const pointsStr = annotation.points
          .map(p => `${p.x},${p.y}`)
          .join(';');
        
        xfdf += `
    <ink page="${annotation.pageNumber - 1}" color="${annotation.color}" width="${annotation.width}" 
         rect="0,0,0,0" title="Annotation" subject="Ink" date="${annotation.createdAt}">
      <inklist>${pointsStr}</inklist>
    </ink>`;
      } else if (annotation.type === 'rectangle') {
        // Rectangle annotation
        const x1 = annotation.points[0].x;
        const y1 = annotation.points[0].y;
        const x2 = annotation.points[1].x;
        const y2 = annotation.points[1].y;
        
        xfdf += `
    <square page="${annotation.pageNumber - 1}" color="${annotation.color}" width="${annotation.width}" 
            rect="${x1},${y1},${x2},${y2}" title="Annotation" subject="Rectangle" date="${annotation.createdAt}">
    </square>`;
      } else if (annotation.type === 'polygon') {
        // Polygon annotation
        const vertices = annotation.points
          .map(p => `${p.x},${p.y}`)
          .join(';');
        
        xfdf += `
    <polygon page="${annotation.pageNumber - 1}" color="${annotation.color}" width="${annotation.width}" 
             vertices="${vertices}" title="Annotation" subject="Polygon" date="${annotation.createdAt}">
    </polygon>`;
      }
    });
    
    // Close XFDF structure
    xfdf += `
  </annots>
</xfdf>`;
    
    return xfdf;
  } catch (error) {
    console.error('Error exporting annotations to XFDF:', error);
    throw new Error('Failed to export annotations');
  }
};

// Import annotations from XFDF format
export const importAnnotationsFromXFDF = (pdfId: string, xfdfString: string): boolean => {
  try {
    // This would require a proper XML parser in a real implementation
    // For now, we'll just show the structure
    
    // Parse XFDF string to extract annotations
    // Convert to our annotation format
    // Save to storage
    
    return true;
  } catch (error) {
    console.error('Error importing annotations from XFDF:', error);
    return false;
  }
};
```

## 4. Integration with Next.js

### 4.1 Combined PDF Viewer Component

Create a component that combines the PDF viewer and annotation layer:

```typescript
// components/AdvancedPdfViewer.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getDocument, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { setupPdfJsWorker } from '@/lib/pdfjs-config';
import PdfAnnotationLayer from './PdfAnnotationLayer';
import { 
  Annotation, 
  getAnnotationsForPage, 
  saveAnnotation 
} from '@/lib/annotation-service';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Pencil, 
  Square, 
  Polygon 
} from 'lucide-react';

interface AdvancedPdfViewerProps {
  pdfUrl: string;
  pdfId: string;
}

export default function AdvancedPdfViewer({ pdfUrl, pdfId }: AdvancedPdfViewerProps) {
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
        const loadingTask = getDocument(pdfUrl);
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
  
  // Load annotations when page changes
  useEffect(() => {
    if (pdfId) {
      const pageAnnotations = getAnnotationsForPage(pdfId, currentPage);
      setAnnotations(pageAnnotations);
    }
  }, [pdfId, currentPage]);
  
  // Render the current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
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
  const handleAnnotationCreate = (newAnnotation: Omit<Annotation, 'id' | 'createdAt' | 'pdfId' | 'pageNumber'>) => {
    const annotationData = {
      ...newAnnotation,
      pdfId,
      pageNumber: currentPage,
    };
    
    const savedAnnotation = saveAnnotation(annotationData);
    setAnnotations(prev => [...prev, savedAnnotation]);
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
  
  return (
    <div className="advanced-pdf-viewer" ref={containerRef}>
      {/* Controls */}
      <div className="controls-container">
        <div className="navigation-controls">
          <Button
            onClick={goToPrevPage}
            disabled={currentPage <= 1 || isLoading}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Prev</span>
          </Button>
          
          <span className="page-info">
            Page {currentPage} of {numPages}
          </span>
          
          <Button
            onClick={goToNextPage}
            disabled={currentPage >= numPages || isLoading}
            variant="outline"
            size="sm"
          >
            <span className="mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="zoom-controls">
          <Button
            onClick={zoomOut}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="zoom-level">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            onClick={zoomIn}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="annotation-controls">
          <Button
            onClick={() => toggleTool('ink')}
            variant={currentTool === 'ink' ? 'default' : 'outline'}
            size="sm"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Ink
          </Button>
          
          <Button
            onClick={() => toggleTool('rectangle')}
            variant={currentTool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
          >
            <Square className="h-4 w-4 mr-1" />
            Rectangle
          </Button>
          
          <Button
            onClick={() => toggleTool('polygon')}
            variant={currentTool === 'polygon' ? 'default' : 'outline'}
            size="sm"
          >
            <Polygon className="h-4 w-4 mr-1" />
            Polygon
          </Button>
          
          <select
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="color-selector"
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
            className="width-selector"
          >
            <option value="1">Thin</option>
            <option value="2">Medium</option>
            <option value="4">Thick</option>
          </select>
        </div>
      </div>
      
      {/* PDF Viewer */}
      <div className="pdf-container">
        {isLoading && (
          <div className="loading-indicator">
            Loading PDF...
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="canvas-container" style={{ position: 'relative' }}>
          <canvas ref={canvasRef} className="pdf-canvas" />
          
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
    </div>
  );
}
```

## 5. Server-Side Integration

### 5.1 API Route for Annotations

Update the API route to handle the new annotation format:

```typescript
// app/api/annotations/[pdfId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Annotation } from '@/lib/annotation-service';

// GET /api/annotations/{pdfId}?pageNumber=1
export async function GET(
  request: Request,
  { params }: { params: { pdfId: string } }
) {
  const pdfId = decodeURIComponent(params.pdfId);
  const { searchParams } = new URL(request.url);
  const pageNumberParam = searchParams.get('pageNumber');

  if (!pdfId || !pageNumberParam) {
    return NextResponse.json(
      { error: 'Missing pdfId or pageNumber parameter' },
      { status: 400 }
    );
  }

  const pageNumber = parseInt(pageNumberParam, 10);
  if (isNaN(pageNumber)) {
    return NextResponse.json(
      { error: 'Invalid pageNumber parameter' },
      { status: 400 }
    );
  }

  try {
    const annotations = await prisma.annotation.findMany({
      where: {
        pdfId: pdfId,
        pageNumber: pageNumber,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return NextResponse.json(annotations);
  } catch (error) {
    console.error('Failed to fetch annotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    );
  }
}

// POST /api/annotations/{pdfId}
export async function POST(
  request: Request,
  { params }: { params: { pdfId: string } }
) {
  const pdfId = decodeURIComponent(params.pdfId);
  try {
    const body: Omit<Annotation, 'id' | 'createdAt' | 'pdfId'> = await request.json();

    // Basic Validation
    if (
      body.pageNumber == null ||
      !body.type ||
      !body.points ||
      !Array.isArray(body.points) ||
      body.points.length < 2
    ) {
      return NextResponse.json({ error: 'Missing required annotation fields' }, { status: 400 });
    }

    const newAnnotationData = {
      ...body,
      pdfId: pdfId,
      points: JSON.stringify(body.points), // Convert points array to string for storage
    };

    const savedAnnotation = await prisma.annotation.create({
      data: newAnnotationData,
    });

    // Convert points back to array for response
    return NextResponse.json({
      ...savedAnnotation,
      points: JSON.parse(savedAnnotation.points as string),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to save annotation:', error);
    // Handle potential JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to save annotation' },
      { status: 500 }
    );
  }
}

// DELETE /api/annotations/{pdfId}/{annotationId}
export async function DELETE(
  request: Request,
  { params }: { params: { pdfId: string; annotationId: string } }
) {
  const { pdfId, annotationId } = params;
  
  try {
    await prisma.annotation.delete({
      where: {
        id: annotationId,
        pdfId: pdfId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete annotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}
```

### 5.2 Database Schema Update

Update the Prisma schema to support the new annotation format:

```prisma
// prisma/schema.prisma
model Annotation {
  id          String   @id @default(uuid())
  pdfId       String
  pageNumber  Int
  type        String   // 'ink', 'rectangle', 'polygon'
  points      Json     // Stored as JSON string
  color       String
  width       Float
  createdAt   DateTime @default(now())

  @@index([pdfId, pageNumber])
}
```

## 6. Testing and Optimization

### 6.1 Performance Optimization

For large architectural floor plans, consider these optimizations:

```typescript
// lib/pdf-optimization.ts
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Cache rendered pages to improve performance when switching between pages
export class PageCache {
  private cache: Map<number, ImageBitmap> = new Map();
  private maxSize: number;
  
  constructor(maxSize = 5) {
    this.maxSize = maxSize;
  }
  
  async getPage(pageNumber: number, renderFn: () => Promise<ImageBitmap>): Promise<ImageBitmap> {
    if (this.cache.has(pageNumber)) {
      return this.cache.get(pageNumber)!;
    }
    
    const renderedPage = await renderFn();
    
    // If cache is full, remove the oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(pageNumber, renderedPage);
    return renderedPage;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Render a page to an ImageBitmap for better performance
export async function renderPageToImageBitmap(
  page: PDFPageProxy,
  scale: number
): Promise<ImageBitmap> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context not available');
  }
  
  await page.render({
    canvasContext: context,
    viewport,
  }).promise;
  
  return createImageBitmap(canvas);
}

// Progressive loading for large PDFs
export function setupProgressiveLoading(
  pdfDocument: PDFDocumentProxy,
  onProgress: (loaded: number, total: number) => void
): void {
  // PDF.js already supports progressive loading
  // We can hook into the progress events
  
  let loaded = 0;
  const total = pdfDocument.numPages;
  
  // Pre-fetch pages in the background
  for (let i = 1; i <= total; i++) {
    pdfDocument.getPage(i).then(() => {
      loaded++;
      onProgress(loaded, total);
    }).catch(error => {
      console.error(`Error pre-fetching page ${i}:`, error);
    });
  }
}
```

### 6.2 Testing Checklist

Create a testing checklist to ensure all functionality works correctly:

1. **PDF Loading**
   - [ ] Load small PDFs (< 1MB)
   - [ ] Load medium PDFs (1-10MB)
   - [ ] Load large PDFs (> 10MB)
   - [ ] Handle loading errors gracefully

2. **PDF Navigation**
   - [ ] Page navigation (next/previous)
   - [ ] Zoom in/out
   - [ ] Proper rendering at different zoom levels

3. **Annotation Tools**
   - [ ] Ink/freehand drawing
   - [ ] Rectangle creation
   - [ ] Polygon creation
   - [ ] Color selection
   - [ ] Line width selection

4. **Annotation Management**
   - [ ] Save annotations
   - [ ] Load annotations
   - [ ] Delete annotations
   - [ ] Export annotations (XFDF)
   - [ ] Import annotations (XFDF)

5. **Performance**
   - [ ] Smooth rendering of complex floor plans
   - [ ] Responsive annotation drawing
   - [ ] Memory usage monitoring
   - [ ] Page switching performance

6. **Browser Compatibility**
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Edge

## 7. Deployment Considerations

### 7.1 Next.js Configuration

Update the Next.js configuration to properly handle PDF.js assets:

```typescript
// next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow PDF.js worker to be loaded from the public directory
  headers: async () => [
    {
      source: '/pdfjs/:path*',
      headers: [
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp',
        },
      ],
    },
  ],
  
  // Increase the asset size limit for PDF files if needed
  experimental: {
    largePageDataBytes: 128 * 1024, // 128KB
  },
};

export default nextConfig;
```

### 7.2 Production Build Script

Create a build script that ensures PDF.js is properly set up before building:

```javascript
// scripts/build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure PDF.js is set up
console.log('Setting up PDF.js...');
require('./setup-pdfjs');

// Check if PDF.js files are in place
const pdfjsBuildDir = path.join(__dirname, '../public/pdfjs/build');
if (!fs.existsSync(pdfjsBuildDir) || !fs.readdirSync(pdfjsBuildDir).length) {
  console.error('PDF.js files are missing. Setup failed.');
  process.exit(1);
}

// Run the Next.js build
console.log('Building Next.js application...');
execSync('next build', { stdio: 'inherit' });

console.log('Build completed successfully!');
```

## 8. Conclusion

This implementation guide provides a comprehensive approach to integrating Mozilla's PDF.js into a Next.js application for architectural floor plan annotation. By following these steps, you'll create a robust PDF viewing and annotation system with support for freehand drawing, shapes, and advanced annotation management.

The solution leverages the power of PDF.js for rendering while implementing custom annotation tools tailored to the needs of architectural floor plans. The modular approach allows for future enhancements and optimizations as needed.
