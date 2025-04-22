/**
 * Utility functions for handling PDF files in IndexedDB
 */

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

const DB_NAME = 'pdf-storage';
const DB_VERSION = 1;
const PDF_STORE = 'pdfs';
const METADATA_STORE = 'metadata';

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create a store for PDF data
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE);
      }
      
      // Create a store for metadata with an index on id
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        const metadataStore = db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
        metadataStore.createIndex('id', 'id', { unique: true });
      }
    };
  });
};

// Store a PDF file in IndexedDB
export const storePdfInDB = async (pdfId: string, pdfData: string, fileName: string, fileSize: number): Promise<void> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE, METADATA_STORE], 'readwrite');
      
      transaction.onerror = (event) => {
        console.error('Transaction error:', event);
        reject(new Error('Failed to store PDF in IndexedDB'));
      };
      
      // Store the PDF data
      const pdfStore = transaction.objectStore(PDF_STORE);
      const pdfRequest = pdfStore.put(pdfData, pdfId);
      
      pdfRequest.onerror = (event) => {
        console.error('Error storing PDF data:', event);
        reject(new Error('Failed to store PDF data'));
      };
      
      // Store file metadata
      const fileMetadata: UploadedFile = {
        id: pdfId,
        name: fileName,
        size: fileSize,
        uploadedAt: new Date().toISOString()
      };
      
      const metadataStore = transaction.objectStore(METADATA_STORE);
      const metadataRequest = metadataStore.put(fileMetadata);
      
      metadataRequest.onerror = (event) => {
        console.error('Error storing metadata:', event);
        reject(new Error('Failed to store PDF metadata'));
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Error storing PDF in IndexedDB:', error);
    throw new Error('Failed to store PDF. There was an error with IndexedDB.');
  }
};

// Get a PDF file from IndexedDB
export const getPdfFromDB = async (pdfId: string): Promise<string | null> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE], 'readonly');
      const store = transaction.objectStore(PDF_STORE);
      const request = store.get(pdfId);
      
      request.onerror = (event) => {
        console.error('Error retrieving PDF:', event);
        reject(new Error('Failed to retrieve PDF from IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        resolve(request.result || null);
      };
    });
  } catch (error) {
    console.error('Error retrieving PDF from IndexedDB:', error);
    return null;
  }
};

// Get a list of all stored PDFs with metadata
export const getUploadedFilesFromDB = async (): Promise<UploadedFile[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.getAll();
      
      request.onerror = (event) => {
        console.error('Error retrieving PDF files:', event);
        reject(new Error('Failed to retrieve PDF files from IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        // Sort by uploadedAt in descending order (newest first)
        const files = request.result || [];
        files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        resolve(files);
      };
    });
  } catch (error) {
    console.error('Error retrieving PDF files from IndexedDB:', error);
    return [];
  }
};

// Remove a PDF from IndexedDB
export const removePdfFromDB = async (pdfId: string): Promise<void> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE, METADATA_STORE], 'readwrite');
      
      transaction.onerror = (event) => {
        console.error('Transaction error:', event);
        reject(new Error('Failed to remove PDF from IndexedDB'));
      };
      
      // Remove the PDF data
      const pdfStore = transaction.objectStore(PDF_STORE);
      pdfStore.delete(pdfId);
      
      // Remove the metadata
      const metadataStore = transaction.objectStore(METADATA_STORE);
      metadataStore.delete(pdfId);
      
      transaction.oncomplete = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Error removing PDF from IndexedDB:', error);
  }
};
