const fs = require('fs');
const path = require('path');

// Find the pdfjs-dist package
const findPdfjsDistPath = () => {
  try {
    // Try to find the package in node_modules
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    // Check direct installation
    const directPath = path.join(nodeModulesPath, 'pdfjs-dist');
    if (fs.existsSync(directPath)) {
      return directPath;
    }
    
    // Check in .pnpm directory (for pnpm users)
    const pnpmDir = path.join(nodeModulesPath, '.pnpm');
    if (fs.existsSync(pnpmDir)) {
      const pnpmDirs = fs.readdirSync(pnpmDir);
      const pdfjsDir = pnpmDirs.find(dir => dir.startsWith('pdfjs-dist@'));
      
      if (pdfjsDir) {
        return path.join(pnpmDir, pdfjsDir, 'node_modules', 'pdfjs-dist');
      }
    }
    
    throw new Error('pdfjs-dist package not found');
  } catch (error) {
    console.error('Error finding pdfjs-dist:', error);
    throw error;
  }
};

// Copy worker files to public directory
const copyWorkerFiles = () => {
  try {
    const pdfjsDistPath = findPdfjsDistPath();
    console.log('Found pdfjs-dist at:', pdfjsDistPath);
    
    const publicDir = path.join(process.cwd(), 'public');
    
    // Make sure the public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Check for different possible worker file locations and formats
    const possibleWorkerPaths = [
      path.join(pdfjsDistPath, 'build', 'pdf.worker.js'),
      path.join(pdfjsDistPath, 'build', 'pdf.worker.min.js'),
      path.join(pdfjsDistPath, 'build', 'pdf.worker.mjs'),
      path.join(pdfjsDistPath, 'build', 'pdf.worker.min.mjs'),
      path.join(pdfjsDistPath, 'legacy', 'build', 'pdf.worker.js'),
      path.join(pdfjsDistPath, 'legacy', 'build', 'pdf.worker.min.js')
    ];
    
    let copiedFiles = 0;
    
    for (const workerPath of possibleWorkerPaths) {
      if (fs.existsSync(workerPath)) {
        const fileName = path.basename(workerPath);
        const destPath = path.join(publicDir, fileName);
        
        console.log(`Copying ${workerPath} to ${destPath}...`);
        fs.copyFileSync(workerPath, destPath);
        console.log(`Successfully copied ${fileName}`);
        copiedFiles++;
      }
    }
    
    if (copiedFiles === 0) {
      throw new Error('No PDF.js worker files found');
    }
    
    console.log(`Copied ${copiedFiles} worker files to public directory`);
    
    // Create a simple worker file that will work for sure
    const simpleWorkerPath = path.join(publicDir, 'pdf.worker.js');
    const workerContent = `
    // This is a simple PDF.js worker file
    // It will load the actual worker from the CDN
    importScripts('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js');
    `;
    
    fs.writeFileSync(simpleWorkerPath, workerContent);
    console.log('Created simple worker file at', simpleWorkerPath);
    
  } catch (error) {
    console.error('Error copying worker files:', error);
    process.exit(1);
  }
};

copyWorkerFiles();
