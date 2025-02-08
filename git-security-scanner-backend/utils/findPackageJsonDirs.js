const fs = require('fs');
const path = require('path');

const findPackageJsonDirs = (dir) => {
  let packageJsonDirs = [];

  const items = fs.readdirSync(dir);

  for (let item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (fs.existsSync(path.join(fullPath, 'package.json'))) {
        packageJsonDirs.push(fullPath);
      }

      packageJsonDirs = packageJsonDirs.concat(findPackageJsonDirs(fullPath));
    }
  }

  return packageJsonDirs;
};

module.exports = { findPackageJsonDirs };
