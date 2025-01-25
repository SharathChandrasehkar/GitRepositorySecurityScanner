// server.js
const express = require('express');
const bodyParser = require('body-parser');
const simpleGit = require('simple-git');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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
    const checkMisconfigurations = (clonePath) => {
        const issues = [];
    
        // Check if .env file exists and contains keys
        const envFilePath = path.join(clonePath, '.env');
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
        const gitignorePath = path.join(clonePath, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignoreContent.includes('.env')) {
            issues.push('.env file should be added to .gitignore to prevent it from being tracked by Git');
        }
        }
    
        return issues;
    };

    // Function to run npm audit and return vulnerabilities
    const checkVulnerabilities = (clonePath) => {
        return new Promise((resolve, reject) => {
        exec('npm audit --json', { cwd: clonePath }, (error, stdout, stderr) => {
            if (error || stderr) {
            reject('Error running npm audit');
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

    // Example result structure
    const scanResults = {
      secrets: secretDataFound,
      misconfigurations: checkMisconfigurations,
      vulnerabilities: checkVulnerabilities,
      unwantedFiles: ['.env', '.git', '.log'],
    };

    // Send results back to the frontend
    res.json(scanResults);

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

const port = 5000;
app.listen(port, () => {
  console.log(`Backend is running on http://localhost:${port}`);
});
