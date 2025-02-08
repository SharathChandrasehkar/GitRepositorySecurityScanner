const fs = require('fs');
const path = require('path');

// Helper function to check for misconfigurations in configuration files
const checkMisconfigurations = async (repoPath) => {
    const misconfigFiles = ['.env', 'config.json', 'settings.yml'];

    const misconfigIssues = [];

    // Check each file for insecure patterns
    misconfigFiles.forEach((file) => {
    const filePath = path.join(repoPath, file);

    if (fs.existsSync(filePath)) {
        const fileContents = fs.readFileSync(filePath, 'utf-8');

        // Case 1: Detecting debug=true in config files
        if (fileContents.includes('debug=true')) {
            misconfigIssues.push(`Insecure debug setting found in ${file}`);
        }

        // Case 2: Check for hardcoded credentials or API keys
        if (fileContents.includes('password=') || fileContents.includes('API_KEY=') || 
            fileContents.includes('AWS_ACCESS_KEY_ID') ||
            fileContents.includes('DATABASE_PASSWORD') ||
            fileContents.includes('SECRET_KEY')) {
            misconfigIssues.push(`Hardcoded credentials found in ${file}`);
        }

        // Case 3: Detecting exposed ports (such as a default port like 80 or 8080 in settings)
        if (fileContents.includes('port=80') || fileContents.includes('port=8080')) {
            misconfigIssues.push(`Exposed port (80 or 8080) found in ${file}`);
        }

        // Case 4: Checking for dangerous flags or unsafe settings (e.g., allow_insecure=true)
        if (fileContents.includes('allow_insecure=true')) {
            misconfigIssues.push(`Insecure flag (allow_insecure=true) found in ${file}`);
        }

        // Case 5: Permissions check for configuration files (e.g., `.env` or `.git`)
        if (file.includes('.env') || file.includes('.git')) {
            const stats = fs.statSync(filePath);
            if (stats.mode & 0o022) {  // Check if the file has public write permissions
                misconfigIssues.push(`Insecure permissions found on ${file}`);
            }
        }
    }
    });

    console.log("misconfigIssues --",misconfigIssues);
    for (let misconf of misconfigIssues) {
        misconf.resolutionGuidance = getResolutionGuidance(misconf);
        misconf.filepath = repoPath;
    }
    console.log("after misconfigIssues --",misconfigIssues);
    return misconfigIssues;
};

module.exports = { checkMisconfigurations };
