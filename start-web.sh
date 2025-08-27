#!/bin/bash
# Web版開発サーバー起動スクリプト

echo "🎯 ディスクゴルフアプリ - Web版起動中..."

# 既存のプロセスを停止
killall -9 node 2>/dev/null
killall -9 expo 2>/dev/null
sleep 1

# ポート8082でWeb版を起動
PORT=8082 npx expo start --web --port 8082

echo "ブラウザで http://localhost:8082 にアクセスしてください"