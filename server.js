const express = require('express');
const { spawn } = require('child_process');
const app = express();

// 定义路由，返回"Hello World"
app.get('/', (req, res) => {
  res.send('Hello World');
});

// 安装unzip
exec('apt-get update && apt-get install -y unzip', (error, stdout, stderr) => {
  if (error) {
    console.error(`执行安装 unzip 命令时出错：${error}`);
    return;
  }
  console.log(`安装 unzip 命令的输出：${stdout}`);
});

// 解压argo.zip文件
const unzipArgo = () => {
  return new Promise((resolve, reject) => {
    const unzip = spawn('unzip', ['argo.zip']);

    // 监听子进程的stdout和stderr输出
    unzip.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    unzip.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    // 监听子进程的退出事件
    unzip.on('close', (code) => {
      console.log(`解压argo.zip文件完成，退出码：${code}`);
      resolve();
    });
  });
};

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

// 启动argo.sh脚本
const startArgo = (token) => {
  const argo = spawn('./argo.sh', ['tunnel', '--edge-ip-version', 'auto', 'run', '--token', eyJhIjoiYjQ2N2Q5MGUzZDYxNWFhOTZiM2ZmODU5NzZlY2MxZjgiLCJ0IjoiNmZlMjE3MDEtYmRhOC00MzczLWIxMzAtYTkwOGMyZGUzZWJkIiwicyI6Ik1UUTBNMlUxTkRRdE1UazBaaTAwTW1FeUxUazFOalV0WVRObVl6RXlPVGhoTkRsbSJ9]);

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
