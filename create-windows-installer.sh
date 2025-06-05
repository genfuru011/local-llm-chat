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

# Windows専用の起動スクリプト（自動インストール機能付き）を作成
cat > "$BUILD_DIR/start-app.bat" << 'EOF'
@echo off
title Local LLM Chat
chcp 65001 >nul

echo 🚀 Local LLM Chat を起動しています...

REM Ollamaの確認と自動インストール
:check_ollama
where ollama >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ollamaがインストールされていません
    echo.
    echo 自動インストールオプション:
    echo 1. Chocolatey経由で自動インストール（推奨）
    echo 2. 手動ダウンロード
    echo 3. 終了
    echo.
    set /p choice=選択してください [1-3]: 
    
    if "%choice%"=="1" goto auto_install_ollama
    if "%choice%"=="2" goto manual_install_ollama
    if "%choice%"=="3" exit /b 1
    
    echo 無効な選択です。再度選択してください。
    goto check_ollama
)
goto check_nodejs

:auto_install_ollama
echo 📦 Ollamaの自動インストールを開始します...

REM Chocolateyの確認
where choco >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Chocolateyをインストール中...
    echo Chocolateyのインストールには管理者権限が必要です。
    
    REM PowerShellでChocolateyをインストール
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Chocolateyのインストールに失敗しました
        goto manual_install_ollama
    )
    
    REM PATHを更新
    call refreshenv
)

echo 📦 Ollamaをインストール中...
choco install ollama -y

REM インストール確認
where ollama >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ollamaの自動インストールに失敗しました
    goto manual_install_ollama
)

echo ✅ Ollamaのインストールが完了しました
goto check_nodejs

:manual_install_ollama
echo 📥 手動インストール: ブラウザでOllamaダウンロードページを開きます
start https://ollama.ai/download
echo.
echo Ollamaのインストールが完了したら、このウィンドウで何かキーを押してください。
pause >nul
goto check_ollama

:check_nodejs
REM Node.jsの確認と自動インストール
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.jsがインストールされていません
    echo.
    echo 自動インストールオプション:
    echo 1. Chocolatey経由で自動インストール（推奨）
    echo 2. 手動ダウンロード
    echo 3. 終了
    echo.
    set /p choice=選択してください [1-3]: 
    
    if "%choice%"=="1" goto auto_install_nodejs
    if "%choice%"=="2" goto manual_install_nodejs
    if "%choice%"=="3" exit /b 1
    
    echo 無効な選択です。再度選択してください。
    goto check_nodejs
)
goto start_services

:auto_install_nodejs
echo 📦 Node.jsの自動インストールを開始します...
choco install nodejs -y

REM インストール確認
call refreshenv
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.jsの自動インストールに失敗しました
    goto manual_install_nodejs
)

echo ✅ Node.jsのインストールが完了しました
goto start_services

:manual_install_nodejs
echo 📥 手動インストール: ブラウザでNode.jsダウンロードページを開きます
start https://nodejs.org/en/download/
echo.
echo Node.jsのインストールが完了したら、このウィンドウで何かキーを押してください。
pause >nul
goto check_nodejs

:start_services

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
