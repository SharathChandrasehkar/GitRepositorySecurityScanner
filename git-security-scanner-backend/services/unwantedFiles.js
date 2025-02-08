const fs = require('fs');
const path = require('path');

const unwantedPatterns = [
  '.env',
  '.git/',
  '.log',
  'node_modules/',
  '.vscode/',
  '.idea/',
  '.DS_Store',
  'Thumbs.db',
  '*.bak',
  '*.swp',
  '*.sqlite3',
  '*.db',
  'dist/',
  'build/',
];

const scanDirectoryForUnwantedFiles = async (dirPath) => {
  let unwantedFiles = [];
  
  try {
    const files = await fs.promises.readdir(dirPath);

    for (let file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.promises.stat(filePath);

      if (unwantedPatterns.some(pattern => filePath.includes(pattern))) {
        unwantedFiles.push(filePath);
      }

      if (stat.isDirectory()) {
        const subDirFiles = await scanDirectoryForUnwantedFiles(filePath);
        unwantedFiles = unwantedFiles.concat(subDirFiles);
      }
    }
  } catch (err) {
    console.error('Error reading directory:', err);
  }

  return unwantedFiles;
};

module.exports = { scanDirectoryForUnwantedFiles };
