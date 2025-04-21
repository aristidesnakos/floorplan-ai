'use client';

import React from 'react';
import { getUploadedFiles, removePdfFromStorage } from '@/lib/fileUtils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

interface PdfListProps {
  onSelectPdf: (pdfId: string) => void;
  className?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

export default function PdfList({ onSelectPdf, className = '' }: PdfListProps) {
  const [files, setFiles] = React.useState<UploadedFile[]>([]);

  React.useEffect(() => {
    // Load the list of PDFs from local storage
    const loadPdfFiles = () => {
      const uploadedFiles = getUploadedFiles();
      setFiles(uploadedFiles);
    };

    loadPdfFiles();

    // Set up event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pdf_files') {
        loadPdfFiles();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleDelete = (e: React.MouseEvent, pdfId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this PDF?')) {
      removePdfFromStorage(pdfId);
      setFiles(prevFiles => prevFiles.filter(file => file.id !== pdfId));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (files.length === 0) {
    return (
      <div className={`text-center text-white/70 py-4 ${className}`}>
        No PDFs have been uploaded yet.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold text-white/90">Recent PDFs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file) => (
          <Card key={file.id} className="overflow-hidden bg-white/5 border-white/10">
            <CardHeader className="p-4">
              <CardTitle className="text-lg truncate text-white/90">{file.name}</CardTitle>
              <CardDescription className="text-white/70">
                {formatFileSize(file.size)} • Uploaded on {formatDate(file.uploadedAt)}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <Button
                variant="default"
                onClick={() => onSelectPdf(file.id)}
                className="bg-white/10 hover:bg-white/20 text-white/90"
              >
                Open & Annotate
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(e, file.id)}
                className="text-white/50 hover:text-white/90 hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
