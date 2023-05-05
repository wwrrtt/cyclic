const express = require('express');
const { spawn } = require('child_process');
const app = express();

const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const url = 'https://github.com/cloudflare/cloudflared/releases/download/2023.5.0/cloudflared-linux-amd64';

const downloadFile = async (url) => {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const tempFilePath = `${tempDir}/cloudflared-linux-amd64`;

    const file = fs.createWriteStream(tempFilePath);
    https.get(url, response => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('文件下载成功！');
        resolve(tempFilePath);
      });
    }).on('error', err => {
      reject(`下载文件时出错：${err}`);
    });
  });
};

const startWeb = () => {
  const webCopyPath = path.join(os.tmpdir(), 'web.sh');
  fs.copyFile('./web.sh', webCopyPath, (err) => {
    if (err) {
      console.error(`复制文件时出错：${err}`);
      return;
    }
    fs.chmod(webCopyPath, '755', (err) => {
      if (err) {
        console.error(`更改文件权限时出错：${err}`);
        return;
      }
      const web = spawn(webCopyPath, ['run', './config.json']);

      web.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });
      web.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      web.on('close', (code) => {
        console.log(`web.sh脚本执行完成，退出码：${code}`);
      });
    });
  });
};

const startArgo = (filePath) => {
  fs.readFile('./token.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(`读取认证令牌时出错：${err}`);
      return;
    }
    fs.chmod(filePath, '755', (err) => {
      if (err) {
        console.error(`更改文件权限时出错：${err}`);
        return;
      }
      const argo = spawn(filePath, ['tunnel', '--edge-ip-version', 'auto', 'run', '--token', data.trim()]);

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
  });
};

downloadFile(url).then(filePath => {
  startWeb();
  startArgo(filePath);
}).catch(err => {
  console.error(`下载文件时出错：${err}`);
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000, () => {
  console.log('应用程序已启动，监听端口3000');
});
