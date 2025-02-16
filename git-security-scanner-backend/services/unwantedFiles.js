const fs = require('fs');
const path = require('path');
const { getGitBlame } = require('./gitBlame');

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
      const fullPath = path.join(dirPath, file);
      console.log('fullPath ---',fullPath);
      const stat = await fs.promises.stat(fullPath);

      if (unwantedPatterns.some(pattern => fullPath.includes(pattern))) {
        //const filePath = path.dirname(fullPath);
        //const fileName = path.basename(fullPath);    
        //const blameInfo = await getGitBlame(filePath, fileName, pattern);
        //unwantedFiles.blame = blameInfo;

        const unwantedFile = {
          name: file,
          fullPath: fullPath.replace(/\\tmp\\/g, ''),
        };
        unwantedFiles.push(unwantedFile);
      }

      if (stat.isDirectory()) {
        const subDirFiles = await scanDirectoryForUnwantedFiles(fullPath);
        unwantedFiles = unwantedFiles.concat(subDirFiles);
      }
    }
  } catch (err) {
    console.error('Error reading directory:', err);
  }

  return unwantedFiles;
};

module.exports = { scanDirectoryForUnwantedFiles };
