const { exec } = require('child_process');

const checkVulnerabilities = async (clonePath) => {
    try {
        const stdout = await new Promise((resolve, reject) => {
            exec('npm audit --json', { cwd: clonePath }, (error, stdout, stderr) => {
            if (stderr) {
                console.error('stderr:', stderr);
            }
            if (error && !stderr) {
                //console.log('npm audit completed with exit code 1. Continuing to parse output...', stdout);
                console.log('npm audit completed with exit code 1. Continuing to parse output...');
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
                filepath: clonePath,
                fixAvailable: pkgInfo.fixAvailable ? pkgInfo.fixAvailable.version : 'No fix available',
            };

            for (let vuln of vulnerabilities) {
                vuln.resolutionGuidance = getResolutionGuidance(vuln);
            }

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

const getResolutionGuidance = (issue) => {
    let guidance = '';
  
    switch (issue.type) {
      case 'vulnerability':
        guidance = `Upgrade ${issue.name} to version ${issue.fixAvailable} to resolve the issue.`;
        break;
      case 'misconfiguration':
        guidance = `Update ${issue.file} to remove insecure settings. For example, avoid setting 'debug=true' in production.`;
        break;
      case 'unwanted-file':
        guidance = `Remove unwanted file: ${issue.filePath}. It's generally a good practice to keep configuration files like .env, .git, etc., out of version control.`;
        break;
      default:
        guidance = 'Refer to the documentation for more details.';
        break;
    }
  
    return guidance;
};

module.exports = { checkVulnerabilities };
