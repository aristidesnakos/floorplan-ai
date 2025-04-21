'use client';

import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PdfAnnotator } from '../components/PdfAnnotator';
import { Button } from '../components/ui/button';

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  return (
    <main className="container mx-auto p-4 md:p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold mb-4">PDF Drawing Annotator</h1>

      {!selectedFile ? (
        <div className="w-full max-w-md flex flex-col items-center bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4 text-center">
            Select a multi-page PDF file containing architectural drawings to begin annotating.
          </p>
          <FileUploader onFileSelect={handleFileSelect} />
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-4">
          {/* Option to change file */}
          <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
            Upload Different PDF
          </Button>
          {/* Display filename */}
          <p className="text-sm text-gray-700 font-medium">
            Annotating: <span className="font-semibold text-blue-600">{selectedFile.name}</span>
          </p>
          <PdfAnnotator key={selectedFile.name} file={selectedFile} /> {/* Use key to force remount on file change */}
        </div>
      )}
    </main>
  );
}
