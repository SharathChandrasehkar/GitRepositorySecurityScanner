const { deleteFolderRecursive } = require('../utils/deleteFolderRecursive');
const simpleGit = require('simple-git');
const git = simpleGit();

const gitClone = async (repoUrl) => {
  let clonePath = '';
  try {
    const repoName = repoUrl.split('/').pop().replace('.git', '');
    clonePath = `/tmp/${repoName}`;

    await deleteFolderRecursive(clonePath);
    await git.clone(repoUrl, clonePath);
  } catch (err) {
    console.error('Error reading directory:', err);
  }

  return clonePath;
};

module.exports = { gitClone };