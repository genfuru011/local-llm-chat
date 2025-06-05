# 🤖 Local LLM Chat

**プライベート・セキュアなローカルAIチャットアプリケーション**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> 📖 [English README](./READMEen.md) | 日本語 README

## 🌟 概要

Local LLM Chatは、完全にローカル環境で動作するAIチャットアプリケーションです。インターネット接続不要で、プライベートかつセキュアにAIとの対話を楽しめます。

### ✨ 主な特徴

- 🔒 **プライバシー重視** - データはすべてローカルに保存
- 🚀 **簡単インストール** - ワンクリックでOllamaとNode.jsを自動インストール
- 🎨 **モダンUI** - 美しく直感的なユーザーインターフェース
- ⚡ **高速応答** - ローカル処理によるリアルタイム対話
- 🔄 **モデル管理** - AIモデルの簡単なダウンロード・切り替え
- 🌐 **クロスプラットフォーム** - macOS・Windows対応

## 📦 インストール

### macOS（推奨）

1. [Local-LLM-Chat-Installer.dmg](./dist/Local-LLM-Chat-Installer.dmg)をダウンロード
2. DMGファイルを開いてApplicationsフォルダにドラッグ
3. アプリケーションを起動（初回起動時に自動セットアップ）

### Windows

1. [Local-LLM-Chat-Windows-Portable.zip](./dist/Local-LLM-Chat-Windows-Portable.zip)をダウンロード
2. 任意の場所に解凍
3. `Local LLM Chat.exe`を実行
4. 詳細手順は[Windowsセットアップガイド](./dist/WINDOWS-SETUP-GUIDE.md)を参照

## 🚀 使用方法

### 初回起動

1. アプリケーションを起動すると自動的にブラウザが開きます
2. 必要な依存関係（Ollama・Node.js）が自動でインストールされます
3. 設定パネルからAIモデルを選択・ダウンロード
4. チャットを開始！

### AIモデルの管理

- **モデル選択**: ドロップダウンメニューから利用可能なモデルを選択
- **新規モデル**: 「カスタムモデル」オプションでモデル名を入力
- **ダウンロード**: 進行状況バーでダウンロード状況を確認
- **削除**: 不要なモデルを簡単に削除

### サポートされているモデル

- **Gemma2**: Google製の高性能モデル
- **Llama3**: Meta製の最新モデル
- **Mistral**: 軽量で高速なモデル
- **CodeLlama**: プログラミング特化モデル
- その他のOllama対応モデル

## 🛠️ 開発者向け

### 前提条件

- Node.js 18以上
- npm または yarn
- Ollama

### セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd local-llm-chat

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### ビルド

```bash
# 本番用ビルド
npm run build

# macOS用インストーラー作成
./create-installer.sh

# Windows用ポータブル版作成
./create-windows-installer.sh
```

### プロジェクト構造

```
📦 local-llm-chat/
├── app/                    # Next.jsアプリケーション
│   ├── api/               # APIエンドポイント
│   ├── page.tsx           # メインチャットUI
│   └── layout.tsx         # アプリレイアウト
├── components/            # UIコンポーネント
├── lib/                   # ユーティリティ関数
├── dist/                  # 配布用ファイル
└── build/                 # ビルド成果物
```

## 🔧 技術スタック

- **フロントエンド**: Next.js 15.0.0, React, TypeScript
- **スタイリング**: Tailwind CSS, shadcn/ui
- **デスクトップ**: Electron
- **AI**: Ollama, Vercel AI SDK
- **ビルド**: electron-builder

## 📚 ドキュメント

- [インストールガイド](./INSTALLATION_GUIDE.md)
- [自動インストールガイド](./AUTO_INSTALL_GUIDE.md)
- [Windowsセットアップガイド](./dist/WINDOWS-SETUP-GUIDE.md)
- [インストーラー状況](./INSTALLER_STATUS.md)
- [プロジェクト整理レポート](./CLEANUP_REPORT.md)

## 🆘 トラブルシューティング

### よくある問題

**Q: アプリが起動しない**
- Node.js 18以上がインストールされているか確認
- Ollamaサービスが起動しているか確認（`ollama serve`）

**Q: モデルダウンロードが失敗する**
- インターネット接続を確認
- ディスク容量を確認（モデルは数GB必要）

**Q: チャットが応答しない**
- Ollamaサービスが動作中か確認
- 選択したモデルが正しくダウンロードされているか確認

### サポート

問題が解決しない場合は、以下の情報と共にIssueを作成してください：
- OS・バージョン
- エラーメッセージ
- 再現手順

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 👥 開発チーム

**Local LLM Chat Team**

---

⭐ このプロジェクトが役に立った場合は、ぜひスターを付けてください！
