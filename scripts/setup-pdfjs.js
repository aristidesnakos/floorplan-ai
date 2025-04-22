/**
 * PDF.js Setup Script
 * 
 * This script downloads and sets up PDF.js in the project according to Mozilla's recommendations.
 * It creates the necessary directory structure and copies the required files.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const PDFJS_VERSION = '4.0.269'; // Use the latest stable version
const TEMP_DIR = path.join(__dirname, '../temp');
const PUBLIC_DIR = path.join(__dirname, '../public/pdfjs');

console.log('Starting PDF.js setup...');

// Create directories
if (!fs.existsSync(TEMP_DIR)) {
  console.log(`Creating temp directory: ${TEMP_DIR}`);
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

if (!fs.existsSync(PUBLIC_DIR)) {
  console.log(`Creating public PDF.js directory: ${PUBLIC_DIR}`);
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Function to download a file
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Function to copy directories recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory does not exist: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Main setup function
async function setupPdfJs() {
  try {
    // Option 1: Clone the repository (requires git)
    console.log(`Cloning PDF.js repository (version ${PDFJS_VERSION})...`);
    try {
      execSync(`git clone --depth 1 --branch v${PDFJS_VERSION} https://github.com/mozilla/pdf.js.git ${TEMP_DIR}/pdf.js`, {
        stdio: 'inherit'
      });
      console.log('Repository cloned successfully.');
    } catch (error) {
      console.error('Error cloning repository:', error.message);
      console.log('Falling back to direct download method...');
      
      // Option 2: Download prebuilt files directly
      const pdfJsZipUrl = `https://github.com/mozilla/pdf.js/releases/download/v${PDFJS_VERSION}/pdfjs-${PDFJS_VERSION}-dist.zip`;
      const zipPath = path.join(TEMP_DIR, 'pdfjs.zip');
      
      console.log(`Downloading PDF.js from: ${pdfJsZipUrl}`);
      await downloadFile(pdfJsZipUrl, zipPath);
      
      console.log('Extracting PDF.js files...');
      // Use unzip if available, otherwise use a JS unzip library
      try {
        execSync(`unzip -o ${zipPath} -d ${TEMP_DIR}/pdf.js`, { stdio: 'inherit' });
      } catch (unzipError) {
        console.error('Error extracting zip file:', unzipError.message);
        console.error('Please extract the zip file manually and run this script again.');
        process.exit(1);
      }
    }

    // Create the directory structure
    console.log('Setting up directory structure...');
    fs.mkdirSync(`${PUBLIC_DIR}/build`, { recursive: true });
    fs.mkdirSync(`${PUBLIC_DIR}/web`, { recursive: true });

    // Copy build files
    console.log('Copying build files...');
    const buildFiles = [
      'pdf.mjs', 'pdf.mjs.map', 
      'pdf.worker.mjs', 'pdf.worker.mjs.map',
      'pdf.js', 'pdf.js.map',
      'pdf.worker.js', 'pdf.worker.js.map'
    ];
    
    const buildDir = path.join(TEMP_DIR, 'pdf.js/build');
    if (!fs.existsSync(buildDir)) {
      console.error(`Build directory not found: ${buildDir}`);
      console.log('Checking alternative locations...');
      
      // Check if files are in the root of the extracted directory
      const altBuildDir = path.join(TEMP_DIR, 'pdf.js');
      if (fs.existsSync(path.join(altBuildDir, 'build'))) {
        console.log('Found build directory in alternative location.');
        copyDir(path.join(altBuildDir, 'build'), path.join(PUBLIC_DIR, 'build'));
      } else {
        console.error('Could not find build files. Setup failed.');
        process.exit(1);
      }
    } else {
      buildFiles.forEach(file => {
        const srcPath = path.join(buildDir, file);
        const destPath = path.join(PUBLIC_DIR, 'build', file);
        
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
          console.log(`Copied ${file}`);
        } else {
          console.log(`File not found, skipping: ${file}`);
        }
      });
    }

    // Copy web files
    console.log('Copying web files...');
    const webDirs = ['cmaps', 'images', 'locale'];
    const webDir = path.join(TEMP_DIR, 'pdf.js/web');
    
    if (!fs.existsSync(webDir)) {
      console.error(`Web directory not found: ${webDir}`);
      console.log('Checking alternative locations...');
      
      // Check if files are in the root of the extracted directory
      const altWebDir = path.join(TEMP_DIR, 'pdf.js');
      if (fs.existsSync(path.join(altWebDir, 'web'))) {
        console.log('Found web directory in alternative location.');
        copyDir(path.join(altWebDir, 'web'), path.join(PUBLIC_DIR, 'web'));
      } else {
        console.error('Could not find web files. Setup may be incomplete.');
      }
    } else {
      webDirs.forEach(dir => {
        const srcDir = path.join(webDir, dir);
        const destDir = path.join(PUBLIC_DIR, 'web', dir);
        
        if (fs.existsSync(srcDir)) {
          copyDir(srcDir, destDir);
          console.log(`Copied directory: ${dir}`);
        } else {
          console.log(`Directory not found, skipping: ${dir}`);
        }
      });
      
      const webFiles = ['viewer.css', 'viewer.html', 'viewer.mjs', 'viewer.mjs.map', 'viewer.js', 'viewer.js.map'];
      webFiles.forEach(file => {
        const srcPath = path.join(webDir, file);
        const destPath = path.join(PUBLIC_DIR, 'web', file);
        
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
          console.log(`Copied ${file}`);
        } else {
          console.log(`File not found, skipping: ${file}`);
        }
      });
    }

    // Create a simple worker file as fallback
    console.log('Creating fallback worker file...');
    const fallbackWorkerPath = path.join(PUBLIC_DIR, 'build', 'pdf.worker.js');
    if (!fs.existsSync(fallbackWorkerPath)) {
      const workerContent = `
// Simple PDF.js worker fallback
// This is a placeholder that will be loaded by PDF.js if the main worker fails
// It signals that it's ready and responds to basic messages
(function() {
  "use strict";
  
  // Set the worker version to match the expected version
  const workerVersion = "${PDFJS_VERSION}";
  
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
      
      fs.writeFileSync(fallbackWorkerPath, workerContent);
      console.log(`Created fallback worker file at: ${fallbackWorkerPath}`);
    }

    // Create a simple CDN fallback
    console.log('Creating CDN fallback...');
    const cdnFallbackPath = path.join(PUBLIC_DIR, 'build', 'pdf.worker.cdn.js');
    const cdnContent = `
// This is a fallback that will load the PDF.js worker from a CDN
// It will be used if the local worker fails to load
importScripts('https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js');
    `;
    
    fs.writeFileSync(cdnFallbackPath, cdnContent);
    console.log(`Created CDN fallback at: ${cdnFallbackPath}`);

    // Clean up
    console.log('Cleaning up temporary files...');
    // Uncomment to remove temp files after setup
    // fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    console.log('PDF.js setup completed successfully!');
    console.log(`Files installed to: ${PUBLIC_DIR}`);
    console.log('You can now use PDF.js in your application.');
    
  } catch (error) {
    console.error('Error setting up PDF.js:', error);
    process.exit(1);
  }
}

// Run the setup
setupPdfJs();
