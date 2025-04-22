/**
 * Utility functions for handling PDF files in storage
 * This file provides a compatibility layer that uses IndexedDB for storage
 * but maintains the same API as the previous localStorage implementation
 */

import {
  storePdfInDB,
  getPdfFromDB,
  getUploadedFilesFromDB,
  removePdfFromDB
} from './indexedDbUtils';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

// Store a PDF file in storage
export const storePdfInStorage = async (pdfId: string, pdfData: string, fileName: string, fileSize: number): Promise<void> => {
  try {
    // Use IndexedDB for storage
    await storePdfInDB(pdfId, pdfData, fileName, fileSize);
  } catch (error) {
    console.error('Error storing PDF in storage:', error);
    throw new Error('Failed to store PDF. The file might be too large.');
  }
};

// Get a PDF file from storage
export const getPdfFromStorage = async (pdfId: string): Promise<string | null> => {
  try {
    // Try IndexedDB first
    return await getPdfFromDB(pdfId);
  } catch (error) {
    console.error('Error retrieving PDF from storage:', error);
    return null;
  }
};

// Get a list of all stored PDFs with metadata
export const getUploadedFiles = async (): Promise<UploadedFile[]> => {
  try {
    // Get files from IndexedDB
    return await getUploadedFilesFromDB();
  } catch (error) {
    console.error('Error retrieving PDF files from storage:', error);
    return [];
  }
};

// Get a list of all stored PDF IDs (for backward compatibility)
export const getStoredPdfList = async (): Promise<string[]> => {
  try {
    const files = await getUploadedFiles();
    return files.map(file => file.id);
  } catch (error) {
    console.error('Error retrieving PDF list from storage:', error);
    return [];
  }
};

// Remove a PDF from storage
export const removePdfFromStorage = async (pdfId: string): Promise<void> => {
  try {
    // Remove from IndexedDB
    await removePdfFromDB(pdfId);
  } catch (error) {
    console.error('Error removing PDF from storage:', error);
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
