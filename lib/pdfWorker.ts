import { pdfjs } from 'react-pdf';

// Setup the PDF.js worker
export const setupPdfWorker = (): void => {
  if (typeof window !== 'undefined') {
    try {
      // Use the fallback worker file created by the download script
      const workerSrc = '/pdf.worker.js';
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

      console.log('PDF.js worker set to local file');
    } catch (error) {
      console.error('Error setting up PDF.js worker:', error);
    }
  }
};
