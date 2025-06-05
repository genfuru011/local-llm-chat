# Local LLM Chat - インストール・配布ガイド

## 📦 概要

Local LLM Chatは、ローカル環境でLLMモデルと対話できるWebアプリケーションです。非エンジニア向けの簡単なインストーラーを提供し、技術的な知識がなくても簡単に導入できます。

## 🚀 配布オプション

### 1. macOS DMGインストーラー（推奨）

#### 作成方法
```bash
./create-installer.sh
```

#### 特徴
- ✅ ドラッグ&ドロップでインストール
- ✅ 自動的なOllama/Node.js依存関係チェック
- ✅ プロフェッショナルなアプリケーションバンドル
- ✅ 初回起動時の自動セットアップ

#### 配布ファイル
- `dist/Local-LLM-Chat-Installer.dmg` (約700KB)

### 2. Electron デスクトップアプリ

#### 作成方法
```bash
npm run build-electron
```

#### 特徴
- ✅ クロスプラットフォーム対応（macOS, Windows, Linux）
- ✅ ネイティブアプリケーション体験
- ✅ 自動ウィンドウ管理
- ✅ システム統合

### 3. Windows NSISインストーラー

#### 作成方法
```bash
./create-windows-installer.sh
```

#### 特徴
- ✅ Windows標準のインストーラー体験
- ✅ レジストリ統合
- ✅ アンインストーラー自動生成
- ✅ バッチファイルによる簡単起動

### 4. シンプルシェルスクリプト

#### 作成方法
```bash
./start-app.sh
```

#### 特徴
- ✅ 最も軽量（スクリプトファイル1つ）
- ✅ 開発者向け
- ✅ カスタマイズ可能

## 📋 インストール手順

### macOSユーザー向け

1. **DMGファイルをダウンロード**
   - `Local-LLM-Chat-Installer.dmg`をダウンロード

2. **DMGをマウント**
   - DMGファイルをダブルクリック

3. **アプリをインストール**
   - `Local LLM Chat.app`を`Applications`フォルダにドラッグ

4. **初回起動**
   - アプリケーションフォルダから`Local LLM Chat`を起動
   - 必要に応じてOllamaとNode.jsのインストールガイドが表示される

### Windowsユーザー向け

1. **EXEファイルをダウンロード**
   - `Local LLM Chat Setup.exe`をダウンロード

2. **インストーラーを実行**
   - EXEファイルをダブルクリック
   - インストールウィザードに従って進行

3. **初回起動**
   - デスクトップショートカットまたはスタートメニューから起動
   - 必要に応じて依存関係のインストールガイドが表示される

## ⚙️ システム要件

### 最小要件
- **OS**: macOS 10.15+ / Windows 10+ / Ubuntu 18.04+
- **RAM**: 8GB以上
- **ストレージ**: 5GB以上の空き容量
- **ネットワーク**: 初回セットアップ時のみ必要

### 推奨要件
- **OS**: macOS 12+ / Windows 11+
- **RAM**: 16GB以上
- **ストレージ**: 10GB以上の空き容量
- **CPU**: Apple Silicon / Intel Core i5 以上

## 🔧 依存関係

### 自動インストール対象
1. **Ollama** - LLMモデル実行環境
   - macOS: https://ollama.ai/download
   - Windows: https://ollama.ai/download

2. **Node.js** - アプリケーション実行環境
   - macOS: https://nodejs.org/ja/download/
   - Windows: https://nodejs.org/en/download/

### 自動ダウンロード対象
- **Llama 3.2** - デフォルトLLMモデル（約2GB）

## 🚨 トラブルシューティング

### 起動時の問題

1. **"アプリケーションが破損している"エラー（macOS）**
   ```bash
   sudo xattr -r -d com.apple.quarantine "/Applications/Local LLM Chat.app"
   ```

2. **ポート使用中エラー**
   - 別のアプリケーションがポート3000を使用している
   - ターミナルで確認: `lsof -i :3000`
   - 該当プロセスを終了してから再起動

3. **Ollamaモデルダウンロードが遅い**
   - 初回起動時は2-5GBのモデルダウンロードが必要
   - ネットワーク環境により10-30分かかる場合があります

### ログファイル確認

#### macOS
```bash
~/Library/Logs/Local-LLM-Chat/app.log
```

#### Windows
```
%APPDATA%\Local-LLM-Chat\logs\app.log
```

## 📈 配布戦略

### 1. 内部配布（企業・チーム）
- DMGファイルまたはEXEファイルをファイル共有システムで配布
- セットアップ手順書を併せて配布

### 2. パブリック配布
- GitHub Releasesページでアセット公開
- 自動更新機能（electron-updaterで実装可能）
- コード署名（開発者証明書による署名）

### 3. 企業導入
- MDM（Mobile Device Management）システムでの一括配布
- サイレントインストールオプション
- グループポリシーでの設定管理

## 🔒 セキュリティ考慮事項

### コード署名
```bash
# macOS（開発者証明書が必要）
codesign --force --deep --sign "Developer ID Application: Your Name" "Local LLM Chat.app"

# Windows（コード署名証明書が必要）
signtool sign /f certificate.p12 /p password "Local LLM Chat Setup.exe"
```

### 配布時の注意
- 署名されていないアプリケーションは警告が表示される
- 企業配布の場合は適切な証明書の取得を推奨
- ユーザーへの事前説明とサポート体制の準備

## 📞 サポート

### ドキュメント
- README.md - 基本的な使用方法
- このガイド - インストール・配布手順

### 問題報告
- GitHub Issues - バグ報告・機能要求
- ログファイル添付を推奨

### コミュニティ
- GitHub Discussions - 質問・議論
- 企業導入サポート（別途相談）

---

**作成日**: 2025年6月5日  
**バージョン**: 1.0.0  
**対応プラットフォーム**: macOS, Windows, Linux
