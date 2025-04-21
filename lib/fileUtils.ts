/**
 * Utility functions for handling PDF files in local storage
 */

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

// Store a PDF file in local storage
export const storePdfInStorage = (pdfId: string, pdfData: string, fileName: string, fileSize: number): void => {
  try {
    // Store the PDF data
    localStorage.setItem(`pdf_${pdfId}`, pdfData);

    // Store file metadata
    const fileMetadata: UploadedFile = {
      id: pdfId,
      name: fileName,
      size: fileSize,
      uploadedAt: new Date().toISOString()
    };

    // Update the list of stored PDFs
    const storedFiles = getUploadedFiles();
    const updatedFiles = [fileMetadata, ...storedFiles.filter(file => file.id !== pdfId)];
    localStorage.setItem('pdf_files', JSON.stringify(updatedFiles));
  } catch (error) {
    console.error('Error storing PDF in local storage:', error);
    throw new Error('Failed to store PDF. The file might be too large for local storage.');
  }
};

// Get a PDF file from local storage
export const getPdfFromStorage = (pdfId: string): string | null => {
  try {
    return localStorage.getItem(`pdf_${pdfId}`);
  } catch (error) {
    console.error('Error retrieving PDF from local storage:', error);
    return null;
  }
};

// Get a list of all stored PDFs with metadata
export const getUploadedFiles = (): UploadedFile[] => {
  try {
    const filesJson = localStorage.getItem('pdf_files');
    return filesJson ? JSON.parse(filesJson) : [];
  } catch (error) {
    console.error('Error retrieving PDF files from local storage:', error);
    return [];
  }
};

// Get a list of all stored PDF IDs (for backward compatibility)
export const getStoredPdfList = (): string[] => {
  try {
    const files = getUploadedFiles();
    return files.map(file => file.id);
  } catch (error) {
    console.error('Error retrieving PDF list from local storage:', error);
    return [];
  }
};

// Remove a PDF from local storage
export const removePdfFromStorage = (pdfId: string): void => {
  try {
    // Remove the PDF data
    localStorage.removeItem(`pdf_${pdfId}`);

    // Update the list of stored PDFs
    const storedFiles = getUploadedFiles();
    const updatedFiles = storedFiles.filter(file => file.id !== pdfId);
    localStorage.setItem('pdf_files', JSON.stringify(updatedFiles));
  } catch (error) {
    console.error('Error removing PDF from local storage:', error);
  }
};

// Convert a File object to a base64 string
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Generate a unique ID for a PDF file
export const generatePdfId = (fileName: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const sanitizedFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${sanitizedFileName}_${timestamp}_${randomStr}`;
};
