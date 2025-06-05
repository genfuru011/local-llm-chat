#!/bin/bash

# Local LLM Chat - macOS DMGインストーラー作成スクリプト
# 非エンジニア向けの配布可能なインストーラーを生成

set -e

echo "📦 Local LLM Chat インストーラーを作成中..."

# 設定
APP_NAME="Local LLM Chat"
APP_BUNDLE="${APP_NAME}.app"
DMG_NAME="Local-LLM-Chat-Installer"
BUILD_DIR="build"
DIST_DIR="dist"

# ディレクトリの準備
echo "🧹 ビルドディレクトリを準備中..."
rm -rf "$BUILD_DIR" "$DIST_DIR"
mkdir -p "$BUILD_DIR" "$DIST_DIR"

# アイコンの作成
echo "🎨 アプリケーションアイコンを作成中..."
./create-icon.sh

# Next.jsアプリのビルド
echo "🏗️  Next.jsアプリケーションをビルド中..."
npm run build

# アプリケーションバンドルの作成
echo "📱 macOSアプリケーションバンドルを作成中..."
APP_PATH="$BUILD_DIR/$APP_BUNDLE"
CONTENTS_DIR="$APP_PATH/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

mkdir -p "$MACOS_DIR" "$RESOURCES_DIR"

# Info.plistを作成
cat > "$CONTENTS_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Local LLM Chat</string>
    <key>CFBundleIdentifier</key>
    <string>com.locallm.chat</string>
    <key>CFBundleName</key>
    <string>Local LLM Chat</string>
    <key>CFBundleDisplayName</key>
    <string>Local LLM Chat</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>app-icon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    <key>NSRequiresAquaSystemAppearance</key>
    <false/>
</dict>
</plist>
EOF

# アイコンをコピー
if [ -f "build/app-icon.icns" ]; then
    cp "build/app-icon.icns" "$RESOURCES_DIR/"
fi

# 実行可能ファイルを作成
cat > "$MACOS_DIR/Local LLM Chat" << 'EOF'
#!/bin/bash

# Local LLM Chat 起動スクリプト
# アプリケーションバンドル内から実行

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
BUNDLE_DIR="$(dirname "$APP_DIR")"
PROJECT_DIR="$BUNDLE_DIR/Local-LLM-Chat-Project"

# ログディレクトリ
LOG_DIR="$HOME/Library/Logs/Local-LLM-Chat"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/app.log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "$(date): 🚀 Local LLM Chat を起動しています..."

# Ollamaの確認
check_ollama() {
    if ! command -v ollama &> /dev/null; then
        osascript -e '
        display dialog "Ollamaがインストールされていません。

自動でインストールしますか？

「はい」を選択すると、ブラウザでOllamaのダウンロードページが開きます。" buttons {"キャンセル", "はい"} default button "はい" with icon caution
        ' 
        if [ $? -eq 0 ]; then
            open "https://ollama.ai/download"
        fi
        exit 1
    fi
    
    # Ollamaサービスの起動
    if ! pgrep -f "ollama serve" > /dev/null; then
        echo "$(date): 📦 Ollama サービスを起動中..."
        ollama serve > "$LOG_DIR/ollama.log" 2>&1 &
        sleep 3
    fi
    
    # デフォルトモデルの確認
    if ! ollama list | grep -q "llama3.2"; then
        echo "$(date): 📥 基本モデルをダウンロード中..."
        osascript -e 'display notification "基本モデルをダウンロードしています..." with title "Local LLM Chat"'
        ollama pull llama3.2 >> "$LOG_FILE" 2>&1 &
    fi
}

# Node.jsの確認
check_nodejs() {
    if ! command -v node &> /dev/null; then
        osascript -e '
        display dialog "Node.jsがインストールされていません。

自動でインストールしますか？

「はい」を選択すると、ブラウザでNode.jsのダウンロードページが開きます。" buttons {"キャンセル", "はい"} default button "はい" with icon caution
        '
        if [ $? -eq 0 ]; then
            open "https://nodejs.org/ja/download/"
        fi
        exit 1
    fi
}

# プロジェクトの初期化
init_project() {
    if [ ! -d "$PROJECT_DIR" ]; then
        echo "$(date): 📁 プロジェクトを初期化中..."
        mkdir -p "$PROJECT_DIR"
        
        # プロジェクトファイルを展開（Resources内に含める）
        if [ -d "$BUNDLE_DIR/Local LLM Chat.app/Contents/Resources/project" ]; then
            cp -r "$BUNDLE_DIR/Local LLM Chat.app/Contents/Resources/project/"* "$PROJECT_DIR/"
        fi
    fi
    
    cd "$PROJECT_DIR"
    
    # 依存関係のインストール
    if [ ! -d "node_modules" ]; then
        echo "$(date): 📦 依存関係をインストール中..."
        osascript -e 'display notification "必要なファイルをインストールしています..." with title "Local LLM Chat"'
        npm install >> "$LOG_FILE" 2>&1
    fi
}

# アプリケーションの起動
start_app() {
    echo "$(date): 🌐 アプリケーションを起動中..."
    
    # ポートの確認
    if lsof -i :3000 > /dev/null 2>&1; then
        echo "$(date): ⚠️  ポート3000は既に使用中です"
        PORT=3001
    else
        PORT=3000
    fi
    
    # Next.jsサーバーを起動
    npm run start >> "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    
    # サーバーの起動を待機
    sleep 5
    
    # ブラウザでアプリを開く
    echo "$(date): ✅ ブラウザでアプリを開いています..."
    open "http://localhost:$PORT"
    
    osascript -e 'display notification "Local LLM Chatが起動しました！" with title "Local LLM Chat"'
    
    # アプリの終了を監視
    wait $SERVER_PID
}

# メイン実行
main() {
    check_ollama
    check_nodejs
    init_project
    start_app
}

# エラーハンドリング
trap 'echo "$(date): ❌ エラーが発生しました。ログ: $LOG_FILE"' ERR

main "$@"
EOF

# 実行権限を付与
chmod +x "$MACOS_DIR/Local LLM Chat"

# プロジェクトファイルをResourcesにコピー
echo "📁 プロジェクトファイルをパッケージング中..."
mkdir -p "$RESOURCES_DIR/project"
cp -r ./* "$RESOURCES_DIR/project/" 2>/dev/null || true
# 不要なファイルを除外
rm -rf "$RESOURCES_DIR/project/build" "$RESOURCES_DIR/project/dist" "$RESOURCES_DIR/project/node_modules" "$RESOURCES_DIR/project/.next"

# DMGファイルの作成
echo "💿 DMGインストーラーを作成中..."

# 一時的なDMGディレクトリを作成
DMG_TEMP_DIR="$BUILD_DIR/dmg-temp"
mkdir -p "$DMG_TEMP_DIR"

# アプリケーションとApplicationsフォルダへのシンボリックリンクを作成
cp -r "$APP_PATH" "$DMG_TEMP_DIR/"
ln -s /Applications "$DMG_TEMP_DIR/Applications"

# README.txtを作成
cat > "$DMG_TEMP_DIR/README.txt" << 'EOF'
Local LLM Chat インストール手順

1. 「Local LLM Chat.app」を「Applications」フォルダにドラッグ&ドロップしてください

2. 初回起動時に以下のソフトウェアが必要です：
   - Ollama (AI モデル実行環境)
   - Node.js (アプリケーション実行環境)
   
   必要に応じて自動的にダウンロードページが開きます。

3. インストール完了後、アプリケーションフォルダから「Local LLM Chat」を起動してください

4. 初回起動時は AIモデルのダウンロードに時間がかかる場合があります

問題が発生した場合は、以下のログファイルを確認してください：
~/Library/Logs/Local-LLM-Chat/app.log

サポート: https://github.com/your-repo/local-llm-chat
EOF

# DMGを作成
if command -v create-dmg &> /dev/null; then
    echo "🔧 create-dmgを使用してDMGを作成中..."
    npx create-dmg "$DMG_TEMP_DIR" "$DIST_DIR" \
        --dmg-title="Local LLM Chat Installer" \
        --window-size=600,400 \
        --icon-size=100 \
        --app-drop-link=450,200 \
        --icon="Local LLM Chat.app" 150,200 \
        --hide-extension="Local LLM Chat.app" \
        --background-color="#f0f0f0" 2>/dev/null || {
        echo "⚠️  create-dmgでの作成に失敗。hdiutilを使用します..."
        hdiutil create -srcfolder "$DMG_TEMP_DIR" -volname "Local LLM Chat Installer" "$DIST_DIR/$DMG_NAME.dmg"
    }
else
    echo "🔧 hdiutilを使用してDMGを作成中..."
    hdiutil create -srcfolder "$DMG_TEMP_DIR" -volname "Local LLM Chat Installer" "$DIST_DIR/$DMG_NAME.dmg"
fi

# 署名（開発者アカウントがある場合）
if command -v codesign &> /dev/null && [ -n "${DEVELOPER_ID:-}" ]; then
    echo "✍️  アプリケーションに署名中..."
    codesign --force --deep --sign "$DEVELOPER_ID" "$APP_PATH"
fi

# 完了
echo ""
echo "🎉 インストーラーの作成が完了しました！"
echo ""
echo "📁 出力ファイル:"
echo "   • DMGファイル: $DIST_DIR/$DMG_NAME.dmg"
echo "   • アプリバンドル: $APP_PATH"
echo ""
echo "📋 配布手順:"
echo "   1. DMGファイルを他のユーザーに送信"
echo "   2. ユーザーはDMGをマウントしてアプリをApplicationsフォルダにドラッグ"
echo "   3. 初回起動時にOllamaとNode.jsの自動インストールが案内される"
echo ""
echo "⚠️  注意: 初回起動時はAIモデルのダウンロードに時間がかかります"
