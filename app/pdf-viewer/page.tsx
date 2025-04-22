'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdvancedPdfViewer from '@/components/AdvancedPdfViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PdfViewerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfId, setPdfId] = useState<string>('sample');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get PDF URL from query parameters or use a sample PDF
    const urlParam = searchParams.get('url');
    const idParam = searchParams.get('id');
    
    if (urlParam) {
      setPdfUrl(decodeURIComponent(urlParam));
      if (idParam) {
        setPdfId(idParam);
      } else {
        // Generate an ID from the URL if not provided
        setPdfId(btoa(urlParam).replace(/[+/=]/g, '').substring(0, 10));
      }
    } else {
      // Use a minimal embedded PDF data URL
      const minimalPdfDataUrl = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PAovRmlsdGVyIC9GbGF0ZURlY29kZQovTGVuZ3RoIDM4Cj4+CnN0cmVhbQp4nCvkMlAwUDC1NNUzMVGwMDHUszRSKErOCOQqVPBMcQ1xDQkKCXV09XR1DfEMcc0FAJvdCxcKZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9SZXNvdXJjZXMgPDwKPj4KL0NvbnRlbnRzIDUgMCBSCi9QYXJlbnQgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFs0IDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9wcm9kdWNlciAoUERGTGliIDIuMTMuMCBodHRwczovL3BkZmxpYi5vcmcpCi9tb2REYXRlIChEOjIwMjMwNzA1MTgwMDQ5WikKPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI4MSAwMDAwMCBuIAowMDAwMDAwMjI2IDAwMDAwIG4gCjAwMDAwMDAzMzAgMDAwMDAgbiAKMDAwMDAwMDEyNiAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgovSW5mbyAzIDAgUgo+PgpzdGFydHhyZWYKNDI4CiUlRU9GCg==';
      setPdfUrl(minimalPdfDataUrl);
      setPdfId('sample');
    }
  }, [searchParams]);

  const handleBack = () => {
    router.push('/');
  };

  const handleSaveAnnotations = (annotations: any[]) => {
    console.log('Saving annotations:', annotations);
    // In a real application, you would save these to a database
    alert(`Saved ${annotations.length} annotations`);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
        <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="container mx-auto py-8">
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
        <h1 className="text-2xl font-bold">PDF Viewer with Annotations</h1>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-6 shadow-xl">
        <AdvancedPdfViewer 
          pdfUrl={pdfUrl} 
          pdfId={pdfId}
          onSave={handleSaveAnnotations}
        />
      </div>
      
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-md p-4 text-blue-500">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the toolbar to navigate between pages and zoom in/out</li>
          <li>Click on the drawing tools (Ink, Rectangle, Polygon) to start annotating</li>
          <li>Select a color and line thickness from the dropdown menus</li>
          <li>Click "Save" to store your annotations</li>
          <li>Click "Export" to download annotations in XFDF format</li>
        </ul>
      </div>
    </div>
  );
}
