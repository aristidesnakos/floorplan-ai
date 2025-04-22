# PDF.js Implementation Roadmap

## Overview

This document outlines the implementation plan for integrating Mozilla's PDF.js into our architectural floor plan annotation application. We'll be following Option 3 from the recommendations, using the open-source approach with PDF.js for viewing and a custom annotation layer.

## Current Architecture

- Next.js application for PDF annotation of architectural floor plans
- Using react-pdf wrapper over PDF.js
- Basic rectangular annotation functionality
- Annotations stored in localStorage and via API routes

## Implementation Goals

- Replace react-pdf with direct PDF.js implementation
- Enhance annotation capabilities for architectural floor plans
- Implement freehand/ink drawing tools
- Add shape tools (rectangles, polygons)
- Maintain or improve the current annotation storage system

## Phase 1: PDF.js Core Integration (Week 1)

### 1.1 Setup and Installation
- [ ] Download PDF.js source from GitHub or use CDN
- [ ] Set up directory structure following Mozilla's recommendations
- [ ] Configure build process for PDF.js integration

### 1.2 Core Viewer Implementation
- [ ] Create basic PDF.js viewer component
- [ ] Implement PDF loading and rendering
- [ ] Set up worker configuration
- [ ] Implement page navigation and zoom controls

### 1.3 Integration with Next.js
- [ ] Handle SSR considerations for PDF.js
- [ ] Ensure proper asset loading
- [ ] Create fallback mechanisms for worker loading

## Phase 2: Annotation System (Week 2)

### 2.1 Basic Annotation Layer
- [ ] Implement PDF.js annotation layer
- [ ] Create annotation rendering system
- [ ] Develop annotation event handling

### 2.2 Drawing Tools
- [ ] Implement freehand/ink annotation tool
- [ ] Create rectangle and polygon shape tools
- [ ] Develop tool selection UI
- [ ] Implement color and style controls

### 2.3 Annotation Data Structure
- [ ] Design annotation data format
- [ ] Create serialization/deserialization methods
- [ ] Implement annotation export/import functionality

## Phase 3: Storage and Integration (Week 3)

### 3.1 Client-side Storage
- [ ] Enhance localStorage implementation
- [ ] Add IndexedDB support for larger annotations
- [ ] Implement caching mechanisms

### 3.2 Server-side Integration
- [ ] Update API routes for new annotation format
- [ ] Implement server-side validation
- [ ] Create database schema updates if needed

### 3.3 Synchronization
- [ ] Develop offline-first capabilities
- [ ] Implement conflict resolution
- [ ] Create background sync mechanisms

## Phase 4: UI/UX Enhancements (Week 4)

### 4.1 Toolbar Design
- [ ] Create intuitive tool selection interface
- [ ] Implement annotation property controls
- [ ] Develop annotation management UI

### 4.2 Viewer Customization
- [ ] Style PDF.js viewer to match application design
- [ ] Implement responsive design considerations
- [ ] Add accessibility enhancements

### 4.3 User Experience
- [ ] Add tooltips and help documentation
- [ ] Implement keyboard shortcuts
- [ ] Create user onboarding flow

## Phase 5: Testing and Optimization (Week 5)

### 5.1 Functional Testing
- [ ] Test PDF loading and rendering
- [ ] Validate annotation creation and editing
- [ ] Verify storage and retrieval

### 5.2 Performance Optimization
- [ ] Optimize rendering for large documents
- [ ] Improve annotation layer performance
- [ ] Reduce memory usage

### 5.3 Browser Compatibility
- [ ] Test across major browsers
- [ ] Implement fallbacks for unsupported features
- [ ] Address mobile-specific considerations

## Technical Considerations

### PDF.js Integration
- PDF.js uses a web worker for parsing and rendering
- Worker must be properly configured for Next.js environment
- Static assets need to be correctly placed in the public directory

### Annotation Implementation
- PDF.js provides basic annotation support that needs to be extended
- Custom drawing tools require canvas manipulation
- Coordinate systems need careful handling between screen and PDF space

### Performance
- Large architectural plans may require optimization
- Consider lazy loading and virtualization for multi-page documents
- Implement caching strategies for improved performance

## Resources

- [PDF.js GitHub Repository](https://github.com/mozilla/pdf.js)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/getting_started/)
- [PDF.js Examples](https://mozilla.github.io/pdf.js/examples/)
- [PDF Specification (for annotation formats)](https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf)
