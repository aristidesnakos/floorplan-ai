# PDF.js Implementation Guide

This document provides an overview of the PDF.js implementation in the project, including how to use it, how it works, and how to extend it.

## Overview

The project uses Mozilla's PDF.js library to provide advanced PDF viewing and annotation capabilities. The implementation includes:

- Direct integration with PDF.js core library
- Custom annotation tools (ink/freehand, rectangle, polygon)
- Annotation storage and export functionality
- Responsive UI with zoom and navigation controls

## Getting Started

### Installation

The PDF.js files are automatically set up when you run the development server or build the project. The setup script (`scripts/setup-pdfjs.js`) downloads and configures the necessary PDF.js files.

If you want to manually set up PDF.js, you can run:

```bash
pnpm setup-pdfjs
```

### Usage

To use the PDF.js viewer in your application:

1. Navigate to the home page and click on "Open Advanced Viewer"
2. Or go directly to `/pdf-viewer` to see the advanced PDF viewer
3. You can also pass a PDF URL as a query parameter: `/pdf-viewer?url=https://example.com/sample.pdf`

## Components

### PdfJsViewer

A basic PDF.js viewer component that provides PDF rendering and navigation capabilities.

```tsx
import PdfJsViewer from '@/components/PdfJsViewer';

<PdfJsViewer pdfUrl="/path/to/document.pdf" />
```

### PdfAnnotationLayer

A component that adds annotation capabilities to the PDF viewer.

```tsx
import PdfAnnotationLayer from '@/components/PdfAnnotationLayer';

<PdfAnnotationLayer
  page={pdfPage}
  scale={scale}
  width={width}
  height={height}
  annotations={annotations}
  onAnnotationCreate={handleAnnotationCreate}
  currentTool={currentTool}
  currentColor={currentColor}
  strokeWidth={strokeWidth}
/>
```

### AdvancedPdfViewer

A combined component that includes both the PDF.js viewer and annotation layer, along with a toolbar for controlling the viewer and annotation tools.

```tsx
import AdvancedPdfViewer from '@/components/AdvancedPdfViewer';

<AdvancedPdfViewer
  pdfUrl="/path/to/document.pdf"
  pdfId="unique-id"
  onSave={handleSaveAnnotations}
/>
```

## Annotation System

### Annotation Types

The system supports three types of annotations:

1. **Ink/Freehand**: Draw freehand lines on the PDF
2. **Rectangle**: Create rectangular annotations
3. **Polygon**: Create polygon annotations by clicking to add points

### Annotation Data Structure

Annotations are stored with the following structure:

```typescript
interface Annotation {
  id: string;
  type: 'ink' | 'rectangle' | 'polygon';
  points: { x: number; y: number }[];
  color: string;
  width: number;
}
```

### Saving Annotations

Annotations can be saved in two ways:

1. **Local Storage**: By default, annotations are saved to localStorage
2. **Custom Handler**: You can provide an `onSave` callback to the `AdvancedPdfViewer` component to handle saving annotations to your backend

### Exporting Annotations

Annotations can be exported in XFDF format, which is a standard format for PDF annotations. This allows for interoperability with other PDF viewers and editors.

## Configuration

### PDF.js Worker

The PDF.js worker is configured in `lib/pdfjs-config.ts`. You can modify this file to change the worker configuration.

### PDF.js Options

The PDF.js options are also defined in `lib/pdfjs-config.ts`. You can modify these options to change the behavior of the PDF.js library.

## Extending the Implementation

### Adding New Annotation Types

To add a new annotation type:

1. Update the `Annotation` interface in `components/PdfAnnotationLayer.tsx` to include the new type
2. Add the new tool to the toolbar in `components/AdvancedPdfViewer.tsx`
3. Implement the drawing logic in `components/PdfAnnotationLayer.tsx`
4. Add export support in the `exportAnnotations` function in `components/AdvancedPdfViewer.tsx`

### Customizing the UI

The UI can be customized by modifying the components:

- `components/PdfJsViewer.tsx`: Basic viewer UI
- `components/AdvancedPdfViewer.tsx`: Advanced viewer UI with annotation tools

## Troubleshooting

### PDF.js Worker Issues

If you encounter issues with the PDF.js worker:

1. Check that the worker file is correctly loaded from the public directory
2. Verify that the worker path is correctly set in `lib/pdfjs-config.ts`
3. Check the browser console for any errors related to the worker

### Annotation Issues

If annotations are not working correctly:

1. Ensure the annotation layer is correctly positioned over the PDF
2. Check that the coordinate system is correctly mapped between the PDF and the annotation layer
3. Verify that the annotation data is correctly formatted

## Resources

- [PDF.js Documentation](https://mozilla.github.io/pdf.js/getting_started/)
- [PDF.js GitHub Repository](https://github.com/mozilla/pdf.js)
- [XFDF Specification](https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/xfdf_spec_3.0.pdf)
