const fs = require('fs');
const path = require('path');
const https = require('https');

// Create a simple HTML file that loads the PDF.js worker from CDN
const createWorkerLoader = () => {
  const publicDir = path.join(process.cwd(), 'public');
  
  // Make sure the public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Create a simple HTML file that will load the worker from CDN
  const workerLoaderPath = path.join(publicDir, 'pdf.worker.html');
  const workerLoaderContent = `
<!DOCTYPE html>
<html>
<head>
  <title>PDF.js Worker</title>
  <script>
    // This file is used to load the PDF.js worker from CDN
    // It's loaded in an iframe by the PDF viewer
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'pdfjs-init') {
        // Load the worker script from CDN
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
        script.onload = function() {
          // Notify the parent window that the worker is ready
          window.parent.postMessage({ type: 'pdfjs-worker-ready' }, '*');
        };
        document.head.appendChild(script);
      }
    });
  </script>
</head>
<body>
  <!-- PDF.js Worker Loader -->
</body>
</html>
  `;
  
  fs.writeFileSync(workerLoaderPath, workerLoaderContent);
  console.log(`Created PDF.js worker loader at ${workerLoaderPath}`);
  
  // Create a simple JS file that will be used as the worker source
  const workerPath = path.join(publicDir, 'pdf.worker.js');
  const workerContent = `
// This file is used as the worker source for PDF.js
// It creates an iframe that loads the worker from CDN
if (typeof window !== 'undefined') {
  // Create an iframe to load the worker
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = '/pdf.worker.html';
  document.body.appendChild(iframe);
  
  // Wait for the iframe to load
  iframe.onload = function() {
    // Initialize the worker
    iframe.contentWindow.postMessage({ type: 'pdfjs-init' }, '*');
  };
  
  // Listen for messages from the iframe
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'pdfjs-worker-ready') {
      console.log('PDF.js worker loaded successfully');
    }
  });
}
  `;
  
  fs.writeFileSync(workerPath, workerContent);
  console.log(`Created PDF.js worker at ${workerPath}`);
};

// Create a simple HTML file that directly loads the PDF.js worker from CDN
const createDirectCdnLoader = () => {
  const publicDir = path.join(process.cwd(), 'public');
  
  // Make sure the public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Create a simple JS file that will be used as the worker source
  const workerPath = path.join(publicDir, 'pdf-worker-loader.js');
  const workerContent = `
// This is a simple script to load the PDF.js worker from CDN
// It's used by the PDF viewer component
if (typeof window !== 'undefined') {
  window.pdfjsWorkerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
}
  `;
  
  fs.writeFileSync(workerPath, workerContent);
  console.log(`Created PDF.js worker loader at ${workerPath}`);
};

// Run the setup
try {
  createDirectCdnLoader();
  console.log('PDF.js worker setup completed successfully');
} catch (error) {
  console.error('Error setting up PDF.js worker:', error);
  process.exit(1);
}
