const fs = require('fs');
const path = require('path');
const https = require('https');

// Get the pdfjs-dist version from package.json
const packageJson = require('../package.json');
const pdfjsVersion = packageJson.dependencies['pdfjs-dist'] || 
                    packageJson.devDependencies['pdfjs-dist'] || 
                    '5.1.91';

// Clean version number (remove ^ or ~ if present)
const cleanVersion = pdfjsVersion.replace(/[\^~]/, '');

// URLs for the worker files
const workerUrl = `https://unpkg.com/pdfjs-dist@${cleanVersion}/build/pdf.worker.min.js`;
const workerMjsUrl = `https://unpkg.com/pdfjs-dist@${cleanVersion}/build/pdf.worker.min.mjs`;

// Destination paths
const publicDir = path.join(__dirname, '../public');
const workerPath = path.join(publicDir, 'pdf.worker.min.js');
const workerMjsPath = path.join(publicDir, 'pdf.worker.min.mjs');

// Function to download a file
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${destination}...`);
    
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${url} successfully!`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Make sure the public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Download both worker files
Promise.all([
  downloadFile(workerUrl, workerPath),
  downloadFile(workerMjsUrl, workerMjsPath)
])
  .then(() => {
    console.log('All PDF.js worker files downloaded successfully!');
  })
  .catch((err) => {
    console.error('Error downloading PDF.js worker files:', err);
    process.exit(1);
  });
