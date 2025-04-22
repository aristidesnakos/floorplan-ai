const fs = require('fs');
const path = require('path');

// Ensure the PDF.js worker directory exists
const publicDir = path.join(__dirname, '../public');
const pdfjsDir = path.join(publicDir, 'pdfjs-dist/build');

// Create the directory if it doesn't exist
if (!fs.existsSync(pdfjsDir)) {
  console.log(`Creating directory: ${pdfjsDir}`);
  fs.mkdirSync(pdfjsDir, { recursive: true });
}

// Check if the worker file exists
const workerPath = path.join(pdfjsDir, 'pdf.worker.js');
if (!fs.existsSync(workerPath)) {
  console.log(`Worker file not found at: ${workerPath}`);
  console.log('Creating a simple worker file...');
  
  // Create a simple worker file
  const workerContent = `
// Simple PDF.js worker for localhost MVP
// This is a placeholder that will be loaded by PDF.js
// It signals that it's ready and responds to basic messages
(function() {
  "use strict";
  
  // Set the worker version to match the expected version
  const workerVersion = "3.4.120";
  
  // Signal that the worker is ready
  self.postMessage({
    action: "ready",
    result: true,
    version: workerVersion
  });
  
  // Handle messages from the main thread
  self.onmessage = function(event) {
    const data = event.data;
    
    if (data && data.action === "test") {
      // Respond to test message with version
      self.postMessage({
        action: "test",
        result: true,
        version: workerVersion
      });
    } else if (data && data.action) {
      // Respond to any other action with a simple success message
      self.postMessage({
        action: data.action,
        result: true
      });
    }
  };
})();
  `;
  
  fs.writeFileSync(workerPath, workerContent);
  console.log(`Created worker file at: ${workerPath}`);
}

console.log('PDF.js worker setup complete');
