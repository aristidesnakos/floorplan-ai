'use client';

import React, { useRef } from 'react';
import PdfList from '@/components/PdfList';
import { fileToBase64, generatePdfId, storePdfInStorage } from '@/lib/fileUtils';

interface PdfUploadSectionProps {
  onPdfUpload: (pdfId: string) => void;
  onPdfSelect: (pdfId: string) => void;
  className?: string;
}

const PdfUploadSection: React.FC<PdfUploadSectionProps> = ({
  onPdfUpload,
  onPdfSelect,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        // Convert file to base64
        const base64Data = await fileToBase64(file);

        // Generate a unique ID for the PDF
        const pdfId = generatePdfId(file.name);

        // Store the PDF in storage with metadata
        await storePdfInStorage(pdfId, base64Data, file.name, file.size);

        // Notify parent component
        onPdfUpload(pdfId);
      } catch (error) {
        console.error('Error processing PDF:', error);
        alert('Failed to process the PDF file. The file might be too large.');
      }
    } else if (file) {
      alert('Please select a PDF file.');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`upload-container ${className}`}>
      <div className="glass-hero">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Upload Architectural PDF</h2>
          <p className="text-white/70 mb-6">Upload a PDF file to view and annotate</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-upload"
          />

          <button
            onClick={handleButtonClick}
            className="file-upload-button"
          >
            Choose File <span>No file chosen</span>
          </button>

          <p className="file-size-text mt-4">Max file size: 10MB</p>
        </div>

        <PdfList onSelectPdf={onPdfSelect} className="mt-8" />
      </div>
    </div>
  );
};

export default PdfUploadSection;
