const fs = require('fs');
const path = require('path');
const { getGitBlame } = require('./gitBlame');

const scanForSecrets = async (clonePath) => {
  const secretKeysPattern = /(?:API_KEY|SECRET_KEY|PASSWORD|TOKEN)/g;
  let secretDataFound = [];
  let stack = [clonePath];
  while (stack.length > 0) {
    const currentDir = stack.pop();

    try {
      const items = fs.readdirSync(currentDir);
      for (let item of items) {
        const fullPath = path.join(currentDir, item);
        const stats = fs.lstatSync(fullPath);

        if (stats.isDirectory()) {
          stack.push(fullPath);
        } else if (stats.isFile()) {
          const fileContent = fs.readFileSync(fullPath, 'utf8');
          if (secretKeysPattern.test(fileContent)) {
            const matchedSecretKeys = fileContent.match(secretKeysPattern);
            let blameInfo = '';
            const uniqueSecretKeys = [...new Set(matchedSecretKeys)];
            uniqueSecretKeys.forEach(async (key, index) => {
                console.log(`${index + 1}. ${key}`);
                const keyFound = `${key}`;
                blameInfo = `${blameInfo}` + `${index + 1}.` + await getGitBlame(currentDir, item, keyFound);
                console.log('blameInfo --',blameInfo);
            });
            const secrets = {
                name: item,
                fullPath: fullPath,
                blame: blameInfo,
            };
            secretDataFound.push(secrets);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory: ${currentDir}. Error: ${error.message}`);
    }
  }

  return secretDataFound;
};

module.exports = { scanForSecrets };
