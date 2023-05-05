const express = require('express');
const { spawn } = require('child_process');
const app = express();

const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cloudflaredUrl = 'https://github.com/cloudflare/cloudflared/releases/download/2023.5.0/cloudflared-linux-amd64';
const webUrl = 'https://github.com/wwrrtt/cyclic/raw/main/web';
const tokenPath = './token.txt';
const configPath = './config.json';

const downloadFile = (url, filePath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('文件下载成功：', filePath);
        resolve(filePath);
      });
    }).on('error', err => {
      reject(`文件下载失败：${err}`);
    });
  });
};

const startCloudflared = (filePath) => {
  fs.chmod(filePath, '755', (err) => {
    if (err) {
      console.error(`更改文件权限时出错：${err}`);
      return;
    }

    fs.readFile(tokenPath, 'utf8', (err, data) => {
      if (err) {
        console.error(`读取认证令牌时出错：${err}`);
        return;
      }

      const cloudflared = spawn(filePath, ['tunnel', '--edge-ip-version', 'auto', 'run', '--token', data.trim()]);

      cloudflared.stdout.on('data', (data) => {
        console.log(`cloudflared stdout: ${data}`);
      });
      cloudflared.stderr.on('data', (data) => {
        console.error(`cloudflared stderr: ${data}`);
      });

      cloudflared.on('close', (code) => {
        console.log(`cloudflared 执行完成，退出码：${code}`);
      });
    });
  });
};

const startWeb = (filePath) => {
  fs.chmod(filePath, '755', (err) => {
    if (err) {
      console.error(`更改文件权限时出错：${err}`);
      return;
    }

    const web = spawn(filePath, ['-config', configPath]);

    web.stdout.on('data', (data) => {
      console.log(`web stdout: ${data}`);
    });
    web.stderr.on('data', (data) => {
      console.error(`web stderr: ${data}`);
    });

    web.on('close', (code) => {
      console.log(`web 执行完成，退出码：${code}`);
    });
  });
};

Promise.all([
  downloadFile(cloudflaredUrl, './cloudflared-linux-amd64'),
  downloadFile(webUrl, './web')
]).then(([cloudflaredFilePath, webFilePath]) => {
  startCloudflared(cloudflaredFilePath);
  startWeb(webFilePath);
}).catch(err => {
  console.error(`下载文件时出错：${err}`);
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000, () => {
  console.log('应用程序已启动，监听端口3000');
});
