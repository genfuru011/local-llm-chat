# 🤖 OpenAI Chat

**OpenAI APIを使用したモダンなAIチャットアプリケーション**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> 📖 [English README](./READMEen.md) | 日本語 README

## 🌟 概要

OpenAI Chatは、OpenAI APIを使用してGPTモデルと対話できるモダンなWebアプリケーションです。最新のGPT-4oモデルを含む様々なOpenAIモデルとリアルタイムで会話できます。

### ✨ 主な特徴

- � **最新のGPTモデル** - GPT-4o、GPT-4 Turbo、GPT-3.5 Turboなど
- � **セキュア** - APIキーはローカルに安全に保存
- 🎨 **モダンUI** - 美しく直感的なユーザーインターフェース
- ⚡ **リアルタイム** - ストリーミング応答による高速対話
- 🔄 **モデル切り替え** - 用途に応じたモデル選択
- 🌐 **Web対応** - ブラウザで動作するシンプルな構成

## 📦 インストール

### 前提条件

- Node.js 18以上
- OpenAI APIキー（[OpenAI Platform](https://platform.openai.com/api-keys)から取得）

### セットアップ

1. リポジトリをクローン:
```bash
git clone https://github.com/your-username/openai-chat.git
cd openai-chat
```

2. 依存関係をインストール:
```bash
npm install
```

3. 開発サーバーを起動:
```bash
npm run dev
```

4. ブラウザで http://localhost:3000 を開く

## 🚀 使用方法

### 初期設定

1. アプリケーションを起動
2. 設定ボタンをクリック
3. OpenAI APIキーを入力
4. 接続テストを実行して確認
5. 使用したいモデルを選択
6. チャットを開始！

### APIキーの管理

- **APIキー入力**: 設定画面でOpenAI APIキーを安全に入力
- **接続テスト**: APIキーが正しく設定されているかテスト
- **モデル更新**: 利用可能なモデル一覧を取得
- **ローカル保存**: APIキーはブラウザのローカルストレージに保存

### サポートされているモデル

- **GPT-4o**: 最新の高性能マルチモーダルモデル
- **GPT-4 Turbo**: 高速で高性能なGPT-4
- **GPT-4**: 高品質な応答を生成する標準モデル
- **GPT-3.5 Turbo**: コストパフォーマンスに優れたモデル
- その他のOpenAI対応モデル

## 🛠️ 開発者向け

### 前提条件

- Node.js 18以上
- npm または yarn
- OpenAI APIキー

### セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd openai-chat

# 依存関係をインストール
npm install

# 環境変数を設定（オプション）
echo "OPENAI_API_KEY=your-api-key-here" > .env.local

# 開発サーバーを起動
npm run dev
```

### ビルド

```bash
# 本番用ビルド
npm run build
npm start

# デスクトップアプリ（Electron）のビルド
npm run build-electron
```

### プロジェクト構造

```
📦 openai-chat/
├── app/                    # Next.jsアプリケーション
│   ├── api/               # APIエンドポイント
│   │   ├── chat/          # チャットAPI
│   │   ├── test-connection/ # 接続テスト
│   │   └── openai-models/ # モデル一覧取得
│   ├── page.tsx           # メインチャットUI
│   └── layout.tsx         # アプリレイアウト
├── components/            # UIコンポーネント
├── lib/                   # ユーティリティ関数
└── public/                # 静的ファイル
```

## 🔧 技術スタック

- **フロントエンド**: Next.js 15.0.0, React, TypeScript
- **スタイリング**: Tailwind CSS, shadcn/ui
- **AI**: OpenAI API, Vercel AI SDK
- **デスクトップ**: Electron（オプション）

## � セキュリティ

- APIキーはローカルストレージに保存
- OpenAI APIとのHTTPS通信
- 環境変数での設定にも対応
- クライアントサイドでのAPIキー管理

## 🆘 トラブルシューティング

### よくある問題

**Q: APIキーエラーが発生する**
- OpenAI APIキーが正しく入力されているか確認
- APIキーに十分なクレジットがあるか確認
- [OpenAI Platform](https://platform.openai.com/)で使用状況を確認

**Q: モデルが選択できない**
- 接続テストが成功しているか確認
- インターネット接続を確認
- OpenAI APIの状況を確認

**Q: チャットが応答しない**
- APIキーが正しく設定されているか確認
- 選択したモデルが利用可能か確認
- レート制限に達していないか確認

### サポート

問題が解決しない場合は、以下の情報と共にIssueを作成してください：
- ブラウザ・バージョン
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

<<<<<<< HEAD
## 👥 開発チーム

**OpenAI Chat Team**

---
=======
>>>>>>> 494a06f7be0c605b9b15ac170c22068d870f1602

⭐ このプロジェクトが役に立った場合は、ぜひスターを付けてください！
