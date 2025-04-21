export interface Annotation {
  id: string;
  pdfId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdAt: string;
}

export interface AnnotationDrawState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}
