'use client';

import React, { ChangeEvent, useRef } from 'react';
import { Button } from './ui/button';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

export function FileUploader({ onFileSelect }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else if (file) {
      // Basic validation feedback
      alert('Please select a PDF file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click(); // Trigger hidden file input
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        id="pdf-upload"
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden" // Hide the default input
      />
      <Button onClick={handleButtonClick}>
        Upload Architectural PDF
      </Button>
    </div>
  );
}
