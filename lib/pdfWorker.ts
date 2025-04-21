import { pdfjs } from 'react-pdf';

// Setup the PDF.js worker
export const setupPdfWorker = (): void => {
  // Set the worker source
  // Use local worker file from public directory
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
};
