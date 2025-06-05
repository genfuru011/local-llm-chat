#!/bin/bash

# macOS Application Bundle Creator
# Local LLM Chat を .app 形式にパッケージ化

APP_NAME="Local LLM Chat"
APP_DIR="${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

echo "📦 macOSアプリケーション (.app) を作成中..."

# 既存の.appディレクトリを削除
rm -rf "${APP_DIR}"

# ディレクトリ構造を作成
mkdir -p "${MACOS_DIR}"
mkdir -p "${RESOURCES_DIR}"

# Info.plistを作成
cat > "${CONTENTS_DIR}/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Local LLM Chat</string>
    <key>CFBundleIdentifier</key>
    <string>com.example.local-llm-chat</string>
    <key>CFBundleName</key>
    <string>Local LLM Chat</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>app-icon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.14</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# 実行ファイルを作成
cat > "${MACOS_DIR}/Local LLM Chat" << 'EOF'
#!/bin/bash

# アプリケーションのディレクトリを取得
APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
BUNDLE_DIR="$(dirname "$APP_DIR")"

echo "🚀 Local LLM Chat を起動しています..."

# Ollamaの確認と起動
if ! command -v ollama &> /dev/null; then
    osascript -e 'display dialog "Ollamaがインストールされていません。\nhttps://ollama.ai からインストールしてください。" buttons {"OK"} default button "OK"'
    exit 1
fi

if ! pgrep -f "ollama serve" > /dev/null; then
    echo "📦 Ollama サービスを起動中..."
    ollama serve &
    sleep 3
fi

# Node.jsの確認
if ! command -v npm &> /dev/null; then
    osascript -e 'display dialog "Node.jsがインストールされていません。\nhttps://nodejs.org からインストールしてください。" buttons {"OK"} default button "OK"'
    exit 1
fi

# プロジェクトディレクトリに移動
cd "$BUNDLE_DIR"

# 依存関係のインストール確認
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストール中..."
    npm install
fi

# アプリケーションの起動
echo "🌐 アプリケーションを起動中..."
npm run build > /dev/null 2>&1
npm run start > /dev/null 2>&1 &

# ブラウザでアプリを開く
sleep 3
open http://localhost:3000

echo "✅ Local LLM Chat が起動しました！"
EOF

# 実行権限を付与
chmod +x "${MACOS_DIR}/Local LLM Chat"

# アイコンファイルを作成（オプション）
# アイコンがある場合はこちらにコピー
# cp app-icon.icns "${RESOURCES_DIR}/"

echo "✅ ${APP_DIR} が作成されました！"
echo "Finderで ${APP_DIR} をダブルクリックして起動できます"
