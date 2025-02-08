const { promisify } = require('util');
const { exec } = require('child_process');

const getGitBlame = async (filePath, fileName, searchPattern) => {
    try {
      // Running 'git blame' command for the specific file
      const stdout = await new Promise((resolve, reject) => {
        exec(`git blame ${filePath}/${fileName}`, { cwd: filePath, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
          if (stderr) {
            reject(`Error in git blame: ${stderr}`);
          }
          if (error) {
            reject(`git blame failed with error: ${error.message}`);
          }
          //console.log("stdout --",stdout);
          // Split the output into lines
          const lines = stdout.split('\n');
          let output = '';

          // Loop through each line and check if it contains the package name
          for (const line of lines) {
            // Check if the line contains the package name
            if (line.includes(searchPattern)) {
              console.log(`line: ${line}`);

              let result = line.match(/\((.*?)\)/);

              if (result) {
                console.log(result[1]);  // Output: "world"
                // The commit hash is the first part of the line, and the username is the author name
                const parts = result[1].trim().split(' ');

                const author = parts[0]; // Commit hash is the first element
                const onDate = parts[1]; // Author name is the second element
                //console.log(`Package "${searchPattern}" was added/modified in commit: ${commitHash}`);
                //console.log(`Author: ${author}`);
                output = `Modification information for Package "${searchPattern}" : ${result[1]}`;

              } else {
                console.log("No match found");
                output = "No match found";
              }
              // Exit the loop once the package name is found
              break; // Exits the loop
            }
          }
          resolve(output); // Resolve the promise after the loop is finished
        });
      });
      return stdout; // Return the output of the git blame
    } catch (err) {
      console.error('Error running git blame:', err);
      throw err;
    }
  };

  module.exports = { getGitBlame };