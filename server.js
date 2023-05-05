const express = require('express');
const { spawn } = require('child_process');
const app = express();
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');

const url = 'https://github.com/cloudflare/cloudflared/releases/download/2023.5.0/cloudflared-linux-amd64';
const fileName = 'argo';

const downloadFile = async (url, fileName) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(fileName);
    https.get(url, response => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        fs.rename(fileName + '-linux-amd64', fileName, err => {
          if (err) {
            reject(`重命名文件时出错：${err}`);
          } else {
            console.log('文件下载和重命名成功！');
            resolve();
          }
        });
      });
    }).on('error', err => {
      reject(`下载文件时出错：${err}`);
    });
  });
};

const startWeb = () => {
  const web = spawn('./web.sh', ['run', './config.json']);

  web.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  web.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  web.on('close', (code) => {
    console.log(`web.sh脚本执行完成，退出码：${code}`);
  });
};

const startArgo = () => {
  fs.readFile('./token.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(`读取认证令牌时出错：${err}`);
      return;
    }
    const argo = spawn('./argo', ['tunnel', '--edge-ip-version', 'auto', 'run', '--token', data.trim()]);

    argo.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    argo.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    argo.on('close', (code) => {
      console.log(`argo执行完成，退出码：${code}`);
    });
  });
};

downloadFile(url, fileName).then(() => {
  startWeb();
  startArgo();
}).catch(err => {
  console.error(`下载文件时出错：${err}`);
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000, () => {
  console.log('应用程序已启动，监听端口3000');
});
