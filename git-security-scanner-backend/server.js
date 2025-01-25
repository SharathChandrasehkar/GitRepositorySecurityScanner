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

// Enable CORS for all origins (you can specify more granular settings if needed)
app.use(cors());

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

    // Function to check for misconfigurations in the repo
    const checkMisconfigurations = async (clonePath1) => {
        const issues = [];
    
        // Check if .env file exists and contains keys
        const envFilePath = path.join(clonePath1, '.env');
        console.log('envFilePath:',envFilePath);
        if (fs.existsSync(envFilePath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
        const sensitiveKeys = ['AWS_ACCESS_KEY_ID', 'DATABASE_PASSWORD', 'SECRET_KEY'];
    
        sensitiveKeys.forEach((key) => {
            if (envConfig[key]) {
            issues.push(`Sensitive key found in .env: ${key}`);
            }
        });
        }
    
        // Check for misconfigured .gitignore files
        const gitignorePath = path.join(clonePath1, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignoreContent.includes('.env')) {
            issues.push('.env file should be added to .gitignore to prevent it from being tracked by Git');
        }
        }
    
        return issues;
    };

    const cpath = '/tmp/GitRepositorySecurityScanner/git-security-scanner-frontend';
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
const checkVulnerabilities = async (cpath1) => {
  try {
    // Wrap exec in a Promise to handle async behavior
    const stdout = await new Promise((resolve, reject) => {
      exec('npm audit --json', { cwd: cpath1 }, (error, stdout, stderr) => {
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


const getGitBlame = async (filePath, cpath2) => {
  try {
    // Running 'git blame' command for the specific file
    const stdout = await new Promise((resolve, reject) => {
      exec(`git blame ${filePath}`, { cwd: cpath2 }, (error, stdout, stderr) => {
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


const checkVulnerabilities = async (cpath1) => {
  try {
    const stdout = await new Promise((resolve, reject) => {
      exec('npm audit --json', { cwd: cpath1 }, (error, stdout, stderr) => {
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
        console.log('pkgInfo --',JSON.stringify(pkgInfo));
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
  
  try {
    const files = await fs.readdir(dirPath);  // Asynchronously read the directory

    for (let file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);  // Asynchronously get file stats

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
    console.error('Error scanning directory:', err);
  }

  return unwantedFiles;
};

(async () => {
  try {
    let vulnerabilities = await checkVulnerabilities(cpath);
    let misconfigurations = await checkMisconfigurations(cpath);
    let unwantedFiles = await scanDirectory(cpath); 
    console.log('Vulnerabilities:', vulnerabilities);

    if (unwantedFiles.length === 0) {
      unwantedFiles = { message: 'No unwanted files found' };
    }
    


    // Example result structure
    const scanResults = {
      secrets: secretDataFound,
      misconfigurations: misconfigurations,
      vulnerabilities: vulnerabilities,
      unwantedFiles: unwantedFiles,
    };

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

async function runNpmAudit(repoPath) {
  try {
    // Make sure you provide the right options to match your requirements
    const auditResult = await libnpm.audit({ cwd: repoPath, json: true });
    console.log('Audit Results:', auditResult);
  } catch (err) {
    console.error('Error running npm audit:', err);
  }
}

const port = 5000;
app.listen(port, () => {
  console.log(`Backend is running on http://localhost:${port}`);
});
