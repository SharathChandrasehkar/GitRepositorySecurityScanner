const { scanForSecrets } = require('../services/scanForSecrets');
const { checkVulnerabilities } = require('../services/checkVulnerabilities');
const { checkMisconfigurations } = require('../services/checkMisconfigurations');
const { scanDirectoryForUnwantedFiles } = require('../services/unwantedFiles');
const { getGitBlame } = require('../services/gitBlame');
const { gitClone } = require('../services/gitClone');
const { findPackageJsonDirs } = require('../utils/findPackageJsonDirs');

const scanRepository = async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  try {
    /*const repoName = repoUrl.split('/').pop().replace('.git', '');
    const clonePath = `/tmp/${repoName}`;

    await deleteFolderRecursive(clonePath);
    await git.clone(repoUrl, clonePath);*/
    const clonePath = await gitClone(repoUrl);

    const secretDataFound = await scanForSecrets(clonePath);
    const packageJsonDirs = findPackageJsonDirs(clonePath); 
    console.log("packageJsonFiles --",packageJsonDirs);

    // Iterate over all cpaths and gather results asynchronously
    const scanResults = { secrets: secretDataFound, misconfigurations: [], vulnerabilities: [], unwantedFiles: [] };

    for (let cpath of packageJsonDirs) {
      const results = await gatherResults(cpath);
      scanResults.misconfigurations.push(...results.misconfigurations);
      scanResults.vulnerabilities.push(...results.vulnerabilities);
      scanResults.unwantedFiles.push(...results.unwantedFiles);
    }

    // Send results back to the frontend
    res.json(scanResults);
  } catch (error) {
    console.error('Error scanning repo:', error);
    res.status(500).json({ error: 'Error during scanning' });
  }
};

const gatherResults = async (cpath) => {
  const vulnerabilities = await checkVulnerabilities(cpath);
  const misconfigurations = await checkMisconfigurations(cpath);
  const unwantedFiles = await scanDirectoryForUnwantedFiles(cpath);

  // Get git blame for vulnerabilities and misconfigurations
  for (let vuln of vulnerabilities) {
    try {
      const blameInfo = await getGitBlame(cpath, 'package-lock.json', vuln.name); // Assume each vulnerability has filePath
      console.log('blameInfo -----',blameInfo);
      vuln.blame = blameInfo; // Store blame info in the vulnerability object
    } catch (error) {
      vuln.blame = `Error retrieving blame info: ${error.message}`;
    }
  }

  for (let misconf of misconfigurations) {
    try {
      //const blameInfo = await getGitBlame(cpath+'/package-lock.json', cpath); // Assume each misconfiguration has filePath
      const blameInfo = '';
      misconf.blame = blameInfo;
    } catch (error) {
      misconf.blame = `Error retrieving blame info: ${error.message}`;
    }
  }

  for (let unwanted of unwantedFiles) {
    try {
      //const blameInfo = await getGitBlame(cpath+'/package-lock.json', cpath); // Assume each unwanted file has filePath
      const blameInfo = '';
      unwanted.blame = blameInfo;
    } catch (error) {
      unwanted.blame = `Error retrieving blame info: ${error.message}`;
    }
  }

  return {
    vulnerabilities,
    misconfigurations,
    unwantedFiles
  };
};

module.exports = { scanRepository };
