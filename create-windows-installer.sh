#!/bin/bash

# Local LLM Chat - Windows NSISインストーラー作成スクリプト
# クロスプラットフォーム対応の配布可能なインストーラーを生成

set -e

echo "🪟 Local LLM Chat Windows インストーラーを作成中..."

# 設定
APP_NAME="Local LLM Chat"
BUILD_DIR="build"
DIST_DIR="dist"

# ディレクトリの準備
echo "🧹 ビルドディレクトリを準備中..."
mkdir -p "$BUILD_DIR" "$DIST_DIR"

# Next.jsアプリのビルド
echo "🏗️  Next.jsアプリケーションをビルド中..."
npm run build

# electron-builderを使用してWindowsインストーラーを作成
echo "📦 Windows NSISインストーラーを作成中..."
npx electron-builder --win --publish=never

# Windows専用の起動スクリプトを作成
cat > "$BUILD_DIR/start-app.bat" << 'EOF'
@echo off
title Local LLM Chat

echo 🚀 Local LLM Chat を起動しています...

REM Ollamaの確認
where ollama >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ollamaがインストールされていません
    echo 📥 Ollamaをダウンロードしてインストールしてください
    start https://ollama.ai/download
    pause
    exit /b 1
)

REM Node.jsの確認
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.jsがインストールされていません
    echo 📥 Node.jsをダウンロードしてインストールしてください
    start https://nodejs.org/en/download/
    pause
    exit /b 1
)

REM Ollamaサービスの起動
echo 📦 Ollama サービスを起動中...
start /b ollama serve

REM 依存関係のインストール
if not exist "node_modules" (
    echo 📦 依存関係をインストール中...
    npm install
)

REM アプリケーションの起動
echo 🌐 アプリケーションを起動中...
start /b npm run start

REM ブラウザでアプリを開く
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo ✅ Local LLM Chatが起動しました！
echo 🌐 ブラウザでhttp://localhost:3000を開いてください
pause
EOF

# 完了
echo ""
echo "🎉 Windowsインストーラーの作成が完了しました！"
echo ""
echo "📁 出力ファイル:"
echo "   • Windows EXE: $DIST_DIR/"
echo "   • Windows バッチファイル: $BUILD_DIR/start-app.bat"
echo ""
echo "📋 配布手順:"
echo "   1. EXEファイルをWindowsユーザーに送信"
echo "   2. ユーザーはEXEを実行してインストール"
echo "   3. 初回起動時にOllamaとNode.jsのインストールが案内される"
