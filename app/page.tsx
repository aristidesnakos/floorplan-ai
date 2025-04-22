'use client';

import React, { useState, useEffect } from 'react';
import { getPdfFromStorage } from '@/lib/fileUtils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import PdfUploadSection from '@/components/PdfUploadSection';
import SimplePdfViewer from '@/components/SimplePdfViewer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';

const Home = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);

  // Load PDF data when a PDF is selected
  useEffect(() => {
    const loadPdfData = async () => {
      if (selectedPdfId) {
        const data = await getPdfFromStorage(selectedPdfId);
        setPdfData(data);
      } else {
        setPdfData(null);
      }
    };

    loadPdfData();
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
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-white">
        {/* PDF.js Advanced Viewer Promo */}
        <div className="mb-8 p-6 glass-hero rounded-lg">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 md:mr-6">
              <h2 className="text-2xl font-bold mb-2">Try Our New PDF.js Viewer</h2>
              <p className="text-white/80 mb-4">
                Experience our advanced PDF viewer with enhanced annotation tools powered by Mozilla's PDF.js.
                Draw freehand, create shapes, and export annotations in standard formats.
              </p>
              <Link href="/pdf-viewer" passHref>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <FileText className="mr-2 h-4 w-4" />
                  Open Advanced Viewer
                </Button>
              </Link>
            </div>
            <div className="flex-shrink-0 bg-white/5 p-4 rounded-lg border border-white/10">
              <FileText className="h-24 w-24 text-blue-400" />
            </div>
          </div>
        </div>
        
        {!selectedPdfId ? (
          <PdfUploadSection
            onPdfUpload={handlePdfUpload}
            onPdfSelect={handlePdfSelect}
          />
        ) : (
          <div className="upload-container">
            <div className="glass-hero">
              {pdfData ? (
                <SimplePdfViewer pdfData={pdfData} onBack={handleBack} />
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
