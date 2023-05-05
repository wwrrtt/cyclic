const express = require('express');
const { spawn } = require('child_process');
const app = express();
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');

const url = 'https://github.com/cloudflare/cloudflared/releases/download/2023.5.0/cloudflared-linux-amd64';
const fileName = 'argo';

// 下载文件
const file = fs.createWriteStream(fileName);
https.get(url, response => {
  response.pipe(file);

  // 重命名文件
  file.on('finish', () => {
    file.close();
    fs.rename(fileName + '-linux-amd64', fileName, err => {
      if (err) {
        console.error(`重命名文件时出错：${err}`);
      } else {
        console.log('文件下载和重命名成功！');
      }
    });
  });
}).on('error', err => {
  console.error(`下载文件时出错：${err}`);
});

// 定义路由，返回"Hello World"
app.get('/', (req, res) => {
  res.send('Hello World');
});

// 启动web.sh脚本
const startWeb = () => {
  const web = spawn('./web.sh', ['run', './config.json']);

  // 监听子进程的stdout和stderr输出
  web.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  web.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  // 监听子进程的退出事件
  web.on('close', (code) => {
    console.log(`web.sh脚本执行完成，退出码：${code}`);
  });
};

// 启动argo
const startArgo = (token) => {
  const argo = spawn('./argo', ['tunnel', '--edge-ip-version', 'auto', 'run', '--token', eyJhIjoiYjQ2N2Q5MGUzZDYxNWFhOTZiM2ZmODU5NzZlY2MxZjgiLCJ0IjoiNmZlMjE3MDEtYmRhOC00MzczLWIxMzAtYTkwOGMyZGUzZWJkIiwicyI6Ik1UUTBNMlUxTkRRdE1UazBaaTAwTW1FeUxUazFOalV0WVRObVl6RXlPVGhoTkRsbSJ9]);

  // 监听子进程的stdout和stderr输出
  argo.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  argo.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  // 监听子进程的退出事件
  argo.on('close', (code) => {
    console.log(`argo.sh脚本执行完成，退出码：${code}`);
  });
};

// 启动Node.js服务器
const startServer = () => {
  const server = app.listen(3000, () => {
    console.log('App listening on port 3000!');
  });

  // 监听服务器的关闭事件
  server.on('close', () => {
    console.log('Server closed');
  });
};

// 启动应用程序
const startApp = async () => {
  try {
    await unzipArgo();
    console.log('argo.sh脚本解压完成');
    startWeb();
    const token = process.env.Token || '';
    startArgo(token);
    startServer();
  } catch (error) {
    console.error('启动应用程序时出错：', error);
    process.exit(1);
  }
};

// 调用启动应用程序函数
startApp();
