// server.js
const express = require('express');
const bodyParser = require('body-parser');
const simpleGit = require('simple-git');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);
const libnpm = require('libnpm');

const app = express();
const git = simpleGit();

const corsOptions = {
  origin: ['http://localhost:3000', 'https://gitrepositorysecurityscannerfrontend.onrender.com'], // Add local and deployed origins
};

// Use the CORS middleware
app.use(cors(corsOptions));

// Enable CORS for all origins (you can specify more granular settings if needed)
//app.use(cors());

app.use(bodyParser.json());

app.post('/scan', async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  try {
    // Clone the repository (you may want to clone it into a temporary directory)
    const repoName = repoUrl.split('/').pop().replace('.git', '');
    const clonePath = `/tmp/${repoName}`;
    deleteFolderRecursive(clonePath);
    await git.clone(repoUrl, clonePath);
    
    // Security checks to perform (examples):

    // 1. Sensitive data check (scan for known secrets like keys)
    const secretKeysPattern = /(?:API_KEY|SECRET_KEY|PASSWORD|TOKEN)/g;
    let secretDataFound = [];
    const fs = require('fs');
    const files = fs.readdirSync(clonePath);
    /*for (let file of files) {
      const filePath = `${clonePath}/${file}`;
      console.log('filePath',filePath);
      if(filePath.endsWith('.git')) continue;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      if (secretKeysPattern.test(fileContent)) {
        secretDataFound.push(file);
      }
    }*/

    // Initialize stack with the root directory
    let stack = [clonePath];

    while (stack.length > 0) {
        const currentDir = stack.pop();  // Get the current directory from the stack

        try {
            // Read the contents of the current directory
            const items = fs.readdirSync(currentDir);

            // Process each item in the directory
            for (let item of items) {
                const fullPath = path.join(currentDir, item);  // Get full path

                // Get the stats of the current item
                const stats = fs.lstatSync(fullPath);

                if (stats.isDirectory()) {
                    // If it's a directory, add it to the stack
                    console.log(`Directory: ${fullPath}`);
                    stack.push(fullPath);
                } else if (stats.isFile()) {
                    // If it's a file, read its contents
                    console.log(`File: ${fullPath}`);
                    const fileContent = fs.readFileSync(fullPath, 'utf8');
                    console.log(fileContent);  // Process the file content as needed
                    if (secretKeysPattern.test(fileContent)) {
                        secretDataFound.push(item);
                    }
                }
            }
        } catch (error) {
            console.error(`Error reading directory: ${currentDir}. Error: ${error.message}`);
        }
    }

    // Helper function to check for misconfigurations in configuration files
    const checkMisconfigurations = async (repoPath) => {
      const misconfigFiles = ['.env', 'config.json', 'settings.yml'];

      const misconfigIssues = [];

      // Check each file for insecure patterns
      misconfigFiles.forEach((file) => {
        const filePath = path.join(repoPath, file);

        if (fs.existsSync(filePath)) {
          const fileContents = fs.readFileSync(filePath, 'utf-8');

          // Example 1: Detecting debug=true in config files
          if (fileContents.includes('debug=true')) {
            misconfigIssues.push(`Insecure debug setting found in ${file}`);
          }

          // Example 2: Check for hardcoded credentials or API keys
          if (fileContents.includes('password=') || fileContents.includes('API_KEY=') || 
              fileContents.includes('AWS_ACCESS_KEY_ID') ||
              fileContents.includes('DATABASE_PASSWORD') ||
              fileContents.includes('SECRET_KEY')) {
            misconfigIssues.push(`Hardcoded credentials found in ${file}`);
          }

          // Example 3: Detecting exposed ports (such as a default port like 80 or 8080 in settings)
          if (fileContents.includes('port=80') || fileContents.includes('port=8080')) {
            misconfigIssues.push(`Exposed port (80 or 8080) found in ${file}`);
          }

          // Example 4: Checking for dangerous flags or unsafe settings (e.g., allow_insecure=true)
          if (fileContents.includes('allow_insecure=true')) {
            misconfigIssues.push(`Insecure flag (allow_insecure=true) found in ${file}`);
          }

          // Example 5: Permissions check for configuration files (e.g., `.env` or `.git`)
          if (file.includes('.env') || file.includes('.git')) {
            const stats = fs.statSync(filePath);
            if (stats.mode & 0o022) {  // Check if the file has public write permissions
              misconfigIssues.push(`Insecure permissions found on ${file}`);
            }
          }
        }
      });

      return misconfigIssues;
    };

    //const cpath = '/tmp/GitRepositorySecurityScanner/git-security-scanner-frontend';
    // Function to run npm audit and return vulnerabilities
    /*let checkVulnerabilities = (cpath) => {
      return new Promise((resolve, reject) => {
          console.log("Clone path:", cpath); // Debugging
          exec('npm audit --json', { cwd: cpath }, (error, stdout, stderr) => {
              if (error || stderr) {
                  console.error(stderr); // Log the stderr for more details
                  reject('Error running npm audit');
                  return;
              }
              
              if (!stdout) {
                  reject('No output from npm audit');
                  return;
              }
  
              try {
                  const auditResults = JSON.parse(stdout);
                  const vulnerabilities = auditResults.advisories || [];
                  const vulnIssues = vulnerabilities.map((vuln) => {
                      return `${vuln.module}: ${vuln.title} (${vuln.severity})`;
                  });
                  resolve(vulnIssues);
              } catch (err) {
                  reject('Error parsing npm audit results');
              }
          });
      });
    };

    exec('npm audit --json', { cwd: cpath }, (error, stdout, stderr) => {
      if (stderr) {
          console.error('stderr:', stderr);  // Log stderr for more details
      }

      if (error && !stderr) {
          // This will catch the case where there's an error but no stderr output
          console.log('npm audit completed with exit code 1. Continuing to parse output...',stdout);
          try {
            // If there is no error or stderr, parse the JSON results
            const auditResults = JSON.parse(stdout);
            console.log('auditResults--',auditResults);
            if (auditResults && auditResults.vulnerabilities) {
              // Process the vulnerabilities
              checkVulnerabilities = Object.entries(auditResults.vulnerabilities).map(([pkgName, pkgInfo]) => ({
                name: pkgInfo.name,
                severity: pkgInfo.severity,
                range: pkgInfo.range,
                fixAvailable: pkgInfo.fixAvailable ? pkgInfo.fixAvailable.version : 'No fix available',
              }));
            } 
        } catch (err) {
            console.error('Error parsing npm audit results:', err);
        }
      }    
    });*/



    /*
    --- working start ---
    const checkVulnerabilities = async (cpath) => {
      try {
        // Wrap exec in a Promise to handle async behavior
        const stdout = await new Promise((resolve, reject) => {
          exec('npm audit --json', { cwd: cpath }, (error, stdout, stderr) => {
            if (stderr) {
                console.error('stderr:', stderr);  // Log stderr for more details
            }

            if (error && !stderr) {
              console.log('npm audit completed with exit code 1. Continuing to parse output...', stdout);
              // Resolve the promise with stdout (the output of the command)
              resolve(stdout);
            }        
          });
        });

        // Log stdout for debugging
        console.log('stdout from npm audit:', stdout);

        // Parse the result of npm audit
        let auditResults;
        try {
          auditResults = JSON.parse(stdout);
        } catch (err) {
          console.error('Error parsing npm audit results:', err);
          throw new Error('Failed to parse npm audit output.');
        }

        if (auditResults && auditResults.vulnerabilities) {
          // Process the vulnerabilities
          const vulnerabilities = Object.entries(auditResults.vulnerabilities).map(([pkgName, pkgInfo]) => ({
            name: pkgInfo.name,
            severity: pkgInfo.severity,
            range: pkgInfo.range,
            fixAvailable: pkgInfo.fixAvailable ? pkgInfo.fixAvailable.version : 'No fix available',
          }));

          return vulnerabilities; // Return the vulnerabilities array
        } else {
          console.log('No vulnerabilities found.');
          return []; // Return empty array if no vulnerabilities are found
        }
      } catch (err) {
        console.error('Error processing npm audit:', err);
        throw err; // Rethrow the error to handle it in the calling function
      }
    };
    ---working end---
    */


    const getGitBlame = async (filePath, cpath) => {
      try {
        // Running 'git blame' command for the specific file
        const stdout = await new Promise((resolve, reject) => {
          exec(`git blame ${filePath}`, { cwd: cpath }, (error, stdout, stderr) => {
            if (stderr) {
              reject(`Error in git blame: ${stderr}`);
            }
            if (error) {
              reject(`git blame failed with error: ${error.message}`);
            }
            resolve(stdout); // Return the output of git blame
          });
        });
        return stdout;
      } catch (err) {
        console.error('Error running git blame:', err);
        throw err;
      }
    };

    const getResolutionGuidance = (vulnerability) => {
      // Example guidance based on severity
      const severity = vulnerability.severity.toLowerCase();
      let guidance = '';

      switch (severity) {
        case 'high':
          guidance = 'This is a high-severity vulnerability. You should upgrade to the latest fixed version as soon as possible. Check the advisories for potential impact.';
          break;
        case 'moderate':
          guidance = 'This is a moderate-severity vulnerability. If possible, upgrade to the recommended fixed version to mitigate risks.';
          break;
        case 'low':
          guidance = 'This is a low-severity vulnerability. You can monitor the situation and consider upgrading when convenient.';
          break;
        default:
          guidance = 'Please check the advisory for further details on resolving this issue.';
          break;
      }

      // You can also include example code or further steps based on the vulnerability type
      if (vulnerability.fixAvailable !== 'No fix available') {
        guidance += `\nUpgrade ${vulnerability.name} to version ${vulnerability.fixAvailable} to resolve the issue.`;
      } else {
        guidance += '\nNo fix available yet. Stay updated with the project for any future patches.';
      }

      return guidance;
    };

    // Function to get the Git commit history and diffs for a specific file (package.json or package-lock.json)
    const getGitCommitHistoryWithDiff = async (filePath) => {
      try {
        const log = await git.log([filePath]); // Get the log for package.json or package-lock.json
        const commitHistoryWithDiffs = [];

        // For each commit, get the diff for the file
        for (const commit of log.all) {
          const diff = await git.diff([commit.hash, '--', filePath]);
          commitHistoryWithDiffs.push({ commit, diff });
        }

        return commitHistoryWithDiffs;
      } catch (error) {
        console.error('Error getting git commit history or diff:', error);
      }
    };

    const checkVulnerabilities = async (cpath) => {
      try {
        const stdout = await new Promise((resolve, reject) => {
          exec('npm audit --json', { cwd: cpath }, (error, stdout, stderr) => {
            if (stderr) {
              console.error('stderr:', stderr);
            }
            if (error && !stderr) {
              console.log('npm audit completed with exit code 1. Continuing to parse output...', stdout);
            }
            resolve(stdout);
          });
        });

        // Parse npm audit results
        let auditResults;
        try {
          auditResults = JSON.parse(stdout);
        } catch (err) {
          console.error('Error parsing npm audit results:', err);
          throw new Error('Failed to parse npm audit output.');
        }

        const vulnerabilities = [];

        if (auditResults && auditResults.vulnerabilities) {
          for (const [pkgName, pkgInfo] of Object.entries(auditResults.vulnerabilities)) {
            const vulnerability = {
              name: pkgInfo.name,
              severity: pkgInfo.severity,
              range: pkgInfo.range,
              fixAvailable: pkgInfo.fixAvailable ? pkgInfo.fixAvailable.version : 'No fix available',
            };

            // Add git blame information for the file(s) impacted
            /*console.log('pkgInfo --',JSON.stringify(pkgInfo));
            // Check if nodes are available and valid
            if (pkgInfo.nodes && pkgInfo.nodes.length > 0) {
              const filePath = pkgInfo.nodes[0].path;

              // Log the filePath to debug
              console.log('File path from npm audit:', filePath);

              if (filePath) {
                try {
                  const blame = await getGitBlame(filePath, cpath);
                  vulnerability.blame = blame;
                } catch (blameError) {
                  console.error(`Error running git blame on file ${filePath}:`, blameError);
                  vulnerability.blameError = blameError.message;
                }
              } else {
                console.warn(`No valid file path found for ${pkgInfo.name}. Skipping git blame.`);
                vulnerability.blame = 'No path available for git blame.';
              }
            } else {
              console.warn(`No nodes found for ${pkgInfo.name}. Skipping git blame.`);
              vulnerability.blame = 'No nodes found for git blame.';
            }
            */

            // Check Git history for package.json or package-lock.json
            const gitHistoryWithDiffs = await getGitCommitHistoryWithDiff('package.json'); // or 'package-lock.json'

            gitHistoryWithDiffs.forEach(({ commit, diff }) => {
              // If the diff shows changes related to the package (like package version update or package addition)
              if (diff.includes(vulnerability)) {
                console.log(`Package ${vulnerability.name} was added/updated in commit by ${commit.author_name} (${commit.date}):`);
                console.log(`Commit message: ${commit.message}`);
                console.log(`Diff: ${diff}`);
                vulnerability.blame = `Package ${vulnerability.name} was added/updated in commit by ${commit.author_name} (${commit.date}):`
              }
            });
            // Get guidance on how to resolve the issue
            vulnerability.resolutionGuidance = getResolutionGuidance(vulnerability);

            vulnerabilities.push(vulnerability);
          }
        } else {
          console.log('No vulnerabilities found.');
        }

        return vulnerabilities;
      } catch (err) {
        console.error('Error processing npm audit:', err);
        throw err;
      }
    };



    // Unwanted files and directories patterns
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
      'build/'
    ];

    // Function to recursively scan the directory and find unwanted files asynchronously
    const scanDirectory = async (dirPath) => {
      let unwantedFiles = [];
      console.log("dirPath --", dirPath);

      try {
        // Read the contents of the directory
        const files = await fs.promises.readdir(dirPath);
        console.log('Files:', files);

        for (let file of files) {
          const filePath = path.join(dirPath, file);
          const stat = await fs.promises.stat(filePath);  // Asynchronously get file stats

          // Check if the file matches any unwanted pattern
          if (unwantedPatterns.some(pattern => filePath.includes(pattern))) {
            unwantedFiles.push(filePath);
          }

          // Recurse into subdirectories if it's a directory
          if (stat.isDirectory()) {
            const subDirFiles = await scanDirectory(filePath);
            unwantedFiles = unwantedFiles.concat(subDirFiles);
          }
        }
      } catch (err) {
        console.error('Error reading directory:', err);
      }

      return unwantedFiles;
    };

    (async () => {
      try {
        const packageJsonDirs = findPackageJsonDirs(clonePath); 
        console.log("packageJsonFiles --",packageJsonDirs);
        // Define functions to gather results for each cpath
        const gatherResults = async (cpath) => {
          const vulnerabilities = await checkVulnerabilities(cpath);
          const misconfigurations = await checkMisconfigurations(cpath);
          const unwantedFiles = await scanDirectory(cpath);

          return {
            vulnerabilities,
            misconfigurations,
            unwantedFiles
          };
        };

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
      } catch (err) {
        console.error('Failed to get vulnerabilities:', err);
      }
    })();

    //const repoPath = path.join(__dirname, '/tmp/GitRepositorySecurityScanner/git-security-scanner-frontend'); // replace with the actual repo path
    //runNpmAudit('/tmp/GitRepositorySecurityScanner/git-security-scanner-frontend');

    

  } catch (error) {
    console.error('Error scanning repo:', error);
    res.status(500).json({ error: 'Error during scanning' });
  }
});

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file, index) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
    console.log('Folder and contents deleted successfully');
  }
}

/*async function runNpmAudit(repoPath) {
  try {
    // Ensure you're in the correct directory before running npm audit
    const result = await execPromise('npm audit --json', { cwd: repoPath });

    // Print the audit results (this will print the JSON output)
    //console.log('Audit Result:', result.stdout);
    return result.stdout;
  } catch (err) {
    console.log('Error running npm audit:', err);
  }
}*/

/*async function runNpmAudit(repoPath) {
  try {
    // Make sure you provide the right options to match your requirements
    const auditResult = await libnpm.audit({ cwd: repoPath, json: true });
    console.log('Audit Results:', auditResult);
  } catch (err) {
    console.error('Error running npm audit:', err);
  }
}*/

function findPackageJsonDirs(dir) {
  let packageJsonDirs = [];

  // Read the contents of the directory
  const items = fs.readdirSync(dir);

  for (let item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    // Check if it's a directory
    if (stat.isDirectory()) {
      // Check if this directory contains a package.json
      if (fs.existsSync(path.join(fullPath, 'package.json'))) {
        // Add the directory path if it contains package.json
        packageJsonDirs.push(fullPath);
      }

      // Recursively search in subdirectories
      packageJsonDirs = packageJsonDirs.concat(findPackageJsonDirs(fullPath));
    }
  }

  return packageJsonDirs;
}

const port = process.env.PORT || 5000;  // Fallback to 5000 if no PORT is set by the environment
app.listen(port, () => {
  console.log(`Backend is running on http://localhost:${port}`);
});
