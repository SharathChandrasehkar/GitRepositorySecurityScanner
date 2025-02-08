// Utility to delete folder recursively
const deleteFolderRecursive = (folderPath) => {
    const fs = require('fs');
    const path = require('path');
    
    if (fs.existsSync(folderPath)) {
      fs.readdirSync(folderPath).forEach((file, index) => {
        const curPath = path.join(folderPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          deleteFolderRecursive(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(folderPath);
      console.log('Folder and contents deleted successfully');
    }
};

module.exports = { deleteFolderRecursive };