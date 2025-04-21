'use client';

import React, { useState, useEffect } from 'react';
import PdfViewer from '@/components/PdfViewer';
import { getPdfFromStorage } from '@/lib/fileUtils';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import PdfUploadSection from '@/components/PdfUploadSection';

const Home = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);

  // Load PDF data when a PDF is selected
  useEffect(() => {
    if (selectedPdfId) {
      const data = getPdfFromStorage(selectedPdfId);
      setPdfData(data);
    } else {
      setPdfData(null);
    }
  }, [selectedPdfId]);

  const handlePdfUpload = (pdfId: string) => {
    setSelectedPdfId(pdfId);
  };

  const handlePdfSelect = (pdfId: string) => {
    setSelectedPdfId(pdfId);
  };

  const handleBack = () => {
    setSelectedPdfId(null);
    setPdfData(null);
  };

  return (
    <div className="blueprint-bg">
      <Header title="PDF Drawing Annotator" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!selectedPdfId ? (
          <PdfUploadSection
            onPdfUpload={handlePdfUpload}
            onPdfSelect={handlePdfSelect}
          />
        ) : (
          <div className="upload-container">
            <div className="glass-hero">
              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="mb-4 hover:bg-white/10 border-white/20 text-white/90"
                >
                  ← Back to Upload
                </Button>
              </div>
              {pdfData ? (
                <PdfViewer pdfData={pdfData} pdfId={selectedPdfId} />
              ) : (
                <div className="p-8 text-center text-white/70">
                  Loading PDF...
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default Home;
