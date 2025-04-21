'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { fileToBase64, generatePdfId, storePdfInStorage } from '@/lib/fileUtils';
import { Loader2, Upload } from 'lucide-react';

interface PdfUploaderProps {
  onPdfUploaded: (pdfId: string) => void;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onPdfUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file && file.type === 'application/pdf') {
      try {
        setIsUploading(true);

        // Convert file to base64
        const base64Data = await fileToBase64(file);

        // Generate a unique ID for the PDF
        const pdfId = generatePdfId(file.name);

        // Store the PDF in local storage with metadata
        storePdfInStorage(pdfId, base64Data, file.name, file.size);

        // Notify parent component
        onPdfUploaded(pdfId);
      } catch (error) {
        console.error('Error processing PDF:', error);
        alert('Failed to process the PDF file. The file might be too large.');
      } finally {
        setIsUploading(false);
      }
    } else if (file) {
      alert('Please select a PDF file.');
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${
        dragActive ? 'border-white/50 bg-white/10' : 'border-white/20'
      }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        className="hidden"
      />

      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="p-4 rounded-full bg-white/10">
            <Upload className="h-8 w-8 text-white/80" />
          </div>
        </div>

        <h3 className="text-xl font-medium text-white/90 mb-2">Upload PDF Drawing</h3>
        <p className="text-white/70 mb-6">Drag and drop your PDF file here, or click to browse</p>

        <Button
          onClick={handleButtonClick}
          disabled={isUploading}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Select PDF File'
          )}
        </Button>
      </div>
    </div>
  );
};

export default PdfUploader;
