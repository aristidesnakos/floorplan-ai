export interface AnnotationData {
  id?: string; // Optional: ID exists for saved annotations
  pdfId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt?: Date;
}

export interface AnnotationRect extends AnnotationData {
  isSaving?: boolean; // For UI feedback
}
