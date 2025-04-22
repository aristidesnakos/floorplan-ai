/**
 * PDF.js Configuration Utility
 * 
 * This file provides utilities for configuring PDF.js in the application.
 * It handles worker initialization and provides helper functions for PDF operations.
 */

import { GlobalWorkerOptions } from 'pdfjs-dist';

/**
 * Sets up the PDF.js worker
 * This must be called before using any PDF.js functionality
 */
export function setupPdfJsWorker(): void {
  if (typeof window === 'undefined') return; // Skip during SSR
  
  try {
    // Use the worker file in the public directory
    GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
    
    console.log('PDF.js worker configured successfully');
  } catch (error) {
    console.error('Error setting up PDF.js worker:', error);
  }
}

/**
 * Checks if PDF.js is properly configured
 * @returns {boolean} True if PDF.js is configured, false otherwise
 */
export function isPdfJsConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  
  return !!GlobalWorkerOptions.workerSrc;
}

/**
 * Gets the current PDF.js worker URL
 * @returns {string} The current worker URL or empty string if not set
 */
export function getPdfJsWorkerUrl(): string {
  if (typeof window === 'undefined') return '';
  
  return GlobalWorkerOptions.workerSrc || '';
}

/**
 * Utility function to convert a File or Blob to a data URL
 * @param {File|Blob} file - The file to convert
 * @returns {Promise<string>} A promise that resolves to the data URL
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Utility function to convert a data URL to a Uint8Array
 * @param {string} dataUrl - The data URL to convert
 * @returns {Uint8Array} The resulting Uint8Array
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * PDF.js configuration options
 */
export const PDF_JS_OPTIONS = {
  cMapUrl: '/pdfjs/web/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/pdfjs/web/standard_fonts/',
  disableAutoFetch: false,
  disableStream: false,
  disableFontFace: false,
  enableXfa: true,
  useSystemFonts: true,
};
