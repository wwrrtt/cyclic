#!/bin/bash

# 定义变量
TOKEN=${TOKEN:-'eyJhIjoiYjQ2N2Q5MGUzZDYxNWFhOTZiM2ZmODU5NzZlY2MxZjgiLCJ0IjoiNmZlMjE3MDEtYmRhOC00MzczLWIxMzAtYTkwOGMyZGUzZWJkIiwicyI6Ik1UUTBNMlUxTkRRdE1UazBaaTAwTW1FeUxUazFOalV0WVRObVl6RXlPVGhoTkRsbSJ9'}
WEB_PROGRAM=./web
CONFIG_FILE=./config.json
CLOUDFLARED_PROGRAM=./argo
TUNNEL_CMD="tunnel --edge-ip-version auto run --token $TOKEN"

# 定义函数
start_web_program() {
  if ! nohup "$WEB_PROGRAM" run "$CONFIG_FILE" >/dev/null 2>&1; then
    echo "Failed to start web program."
    exit 1
  fi
}

start_cloudflared_program() {
  if ! "$CLOUDFLARED_PROGRAM" "$TUNNEL_CMD"; then
    echo "Failed to start cloudflared program."
    exit 1
  fi
}

# 添加错误处理
trap 'echo "Error occurred. Exiting..."; exit 1' ERR

# 启动 web 程序和 cloudflared 程序
start_web_program
start_cloudflared_program

# 输出系统信息
echo "----- 系统进程...----- ."
ps -ef

echo "----- 系统信息...----- ."
cat /proc/version

echo "----- Done. -----"
