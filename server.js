const express = require('express');
const { spawn } = require('child_process');
const app = express();

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = 'https://github.com/cloudflare/cloudflared/releases/download/2023.5.0/cloudflared-linux-amd64';
const fileName = 'argo';

const downloadFile = async (url, fileName) => {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, fileName);

    const file = fs.createWriteStream(tempFilePath);
    https.get(url, response => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        const destFilePath = path.join(__dirname, fileName);
        fs.copyFile(tempFilePath + '-linux-amd64', destFilePath, err => {
          if (err) {
            reject(`复制文件时出错：${err}`);
          } else {
            console.log('文件下载和复制成功！');
            fs.unlink(tempFilePath + '-linux-amd64', err => {
              if (err) {
                console.error(`删除临时文件时出错：${err}`);
              } else {
                console.log('临时文件删除成功！');
              }
            });
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
