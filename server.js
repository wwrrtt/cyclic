const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();

const cloudflaredUrl = 'https://github.com/cloudflare/cloudflared/releases/download/2023.5.0/cloudflared-linux-amd64';
const webUrl = 'https://github.com/wwrrtt/cyclic/raw/main/web';
const configUrl = 'https://raw.githubusercontent.com/wwrrtt/cyclic/main/config.json';
const startUrl = 'https://raw.githubusercontent.com/wwrrtt/cyclic/main/start.sh';

function downloadFile(url, destination, callback) {
  const file = fs.createWriteStream(destination);

  https.get(url, (res) => {
    res.pipe(file);

    file.on('finish', () => {
      file.close(() => {
        console.log(`${destination} downloaded.`);
        callback();
      });
    });
  }).on('error', (error) => {
    console.error(`Error downloading ${destination}:`, error);
  });
}

// Download cloudflared binary
downloadFile(cloudflaredUrl, path.join(__dirname, 'cloudflared-linux-amd64'), () => {
  // Set permission
  fs.chmodSync(path.join(__dirname, 'cloudflared-linux-amd64'), '755');
  console.log(`cloudflared-linux-amd64 permission set.`);

  // Download web file
  downloadFile(webUrl, path.join(__dirname, 'web'), () => {
    // Download start.sh file
    downloadFile(startUrl, path.join(__dirname, 'start.sh'), () => {
      // Load config.json
      downloadFile(configUrl, path.join(__dirname, 'config.json'), () => {
        // Serve "Hello, World!" on the assigned domain
        app.get('/', (req, res) => {
          res.send('Hello, World!');
        });

        // Execute start script
        executeStartScript();
      });
    });
  });
});

function executeStartScript() {
  const cloudflaredPath = path.join(__dirname, 'cloudflared-linux-amd64');
  const startPath = path.join(__dirname, 'start.sh');

  if (fs.existsSync(cloudflaredPath) && fs.existsSync(startPath)) {
    const startProcess = spawn('bash', [startPath], { stdio: 'inherit' });

    startProcess.on('close', (code) => {
      console.log(`start.sh exited with code ${code}`);
    });
  }
}

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
