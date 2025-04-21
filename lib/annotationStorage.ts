import { Annotation } from '@/types/annotation';

// Key for storing annotations in localStorage
const ANNOTATION_STORAGE_KEY = 'pdf_annotations';

// Get all annotations from localStorage
export const getAllAnnotations = (): Record<string, Annotation[]> => {
  try {
    const storedAnnotations = localStorage.getItem(ANNOTATION_STORAGE_KEY);
    return storedAnnotations ? JSON.parse(storedAnnotations) : {};
  } catch (error) {
    console.error('Error retrieving annotations from localStorage:', error);
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
export const saveAnnotation = (annotationData: Omit<Annotation, 'id' | 'createdAt'>): Annotation => {
  try {
    const allAnnotations = getAllAnnotations();
    
    // Create a new annotation with ID and timestamp
    const newAnnotation: Annotation = {
      ...annotationData,
      id: generateAnnotationId(),
      createdAt: new Date().toISOString(),
    };
    
    // Add to the annotations for this PDF
    const pdfAnnotations = allAnnotations[annotationData.pdfId] || [];
    allAnnotations[annotationData.pdfId] = [...pdfAnnotations, newAnnotation];
    
    // Save back to localStorage
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
    
    // Save back to localStorage
    localStorage.setItem(ANNOTATION_STORAGE_KEY, JSON.stringify(allAnnotations));
    
    return true;
  } catch (error) {
    console.error('Error deleting annotation:', error);
    return false;
  }
};

// Generate a unique ID for an annotation
const generateAnnotationId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};
