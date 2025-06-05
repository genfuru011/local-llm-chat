#!/bin/bash

# Local LLM Chat 起動スクリプト
# 非エンジニア向けワンクリック起動

echo "🚀 Local LLM Chat を起動しています..."

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

# Ollamaの確認
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollamaがインストールされていません"
    echo "Ollamaをインストールしてください: https://ollama.ai"
    read -p "Enterキーを押して終了..."
    exit 1
fi

# Ollamaサービスの起動確認
if ! pgrep -f "ollama serve" > /dev/null; then
    echo "📦 Ollama サービスを起動中..."
    ollama serve &
    sleep 3
fi

# Node.jsの確認
if ! command -v npm &> /dev/null; then
    echo "❌ Node.jsがインストールされていません"
    echo "Node.jsをインストールしてください: https://nodejs.org"
    read -p "Enterキーを押して終了..."
    exit 1
fi

# 依存関係のインストール確認
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストール中..."
    npm install
fi

# アプリケーションの起動
echo "🌐 アプリケーションを起動中..."
npm run build > /dev/null 2>&1 &
sleep 5
npm run start > /dev/null 2>&1 &

# ブラウザでアプリを開く
sleep 3
echo "✅ ブラウザでアプリを開いています..."
open http://localhost:3000

echo "🎉 Local LLM Chat が起動しました！"
echo "ブラウザが開かない場合は、http://localhost:3000 にアクセスしてください"
echo ""
echo "終了するには、このターミナルウィンドウを閉じてください"

# プロセスが終了するまで待機
wait
