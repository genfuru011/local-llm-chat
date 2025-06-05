#!/bin/bash

# Local LLM Chat - 簡単起動スクリプト
# 非エンジニア向けの最も簡単な起動方法

set -e

echo "🚀 Local LLM Chat を起動中..."

# 色付きメッセージ関数
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
print_info() { echo -e "\033[34mℹ️  $1\033[0m"; }

# Ollamaの確認とインストール
check_and_install_ollama() {
    if ! command -v ollama &> /dev/null; then
        print_error "Ollamaがインストールされていません"
        print_info "Ollamaを自動でインストールしますか？ (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_info "Ollamaをダウンロード中..."
            if command -v curl &> /dev/null; then
                curl -fsSL https://ollama.ai/install.sh | sh
            else
                print_warning "curlが見つかりません。手動インストールページを開きます..."
                open "https://ollama.ai/download"
                exit 1
            fi
        else
            print_error "Ollamaが必要です。https://ollama.ai/download からインストールしてください"
            exit 1
        fi
    fi
    print_success "Ollama が利用可能です"
}

# Node.jsの確認とインストール
check_and_install_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.jsがインストールされていません"
        print_info "Node.jsを自動でインストールしますか？ (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_info "Node.jsのインストールページを開きます..."
            open "https://nodejs.org/ja/download/"
            print_warning "Node.jsをインストール後、このスクリプトを再実行してください"
            exit 1
        else
            print_error "Node.jsが必要です。https://nodejs.org/ja/download/ からインストールしてください"
            exit 1
        fi
    fi
    print_success "Node.js が利用可能です ($(node --version))"
}

# Ollamaサービスの起動
start_ollama_service() {
    if ! pgrep -f "ollama serve" > /dev/null; then
        print_info "Ollama サービスを起動中..."
        ollama serve &
        sleep 3
        print_success "Ollama サービスが起動しました"
    else
        print_success "Ollama サービスは既に動作中です"
    fi
}

# AIモデルの確認とダウンロード
setup_ai_model() {
    print_info "AIモデルを確認中..."
    if ! ollama list | grep -q "llama3.2"; then
        print_warning "基本AIモデルがインストールされていません"
        print_info "Llama 3.2モデルをダウンロードしますか？ (約2GB) (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_info "AIモデルをダウンロード中... (数分かかる場合があります)"
            ollama pull llama3.2
            print_success "AIモデルのダウンロードが完了しました"
        else
            print_warning "AIモデルがないとチャット機能は使用できません"
        fi
    else
        print_success "AIモデルが利用可能です"
    fi
}

# 依存関係のインストール
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_info "必要なファイルをインストール中..."
        npm install
        print_success "依存関係のインストールが完了しました"
    else
        print_success "依存関係は既にインストール済みです"
    fi
}

# アプリケーションの起動
start_application() {
    print_info "Local LLM Chat を起動中..."
    
    # ポートの確認
    if lsof -i :3000 > /dev/null 2>&1; then
        print_warning "ポート3000は既に使用中です"
        print_info "実行中のアプリケーションを停止してから再実行してください"
        exit 1
    fi
    
    # Next.jsサーバーを起動
    npm run dev &
    SERVER_PID=$!
    
    # サーバーの起動を待機
    print_info "サーバーの起動を待機中..."
    sleep 8
    
    # ブラウザでアプリを開く
    print_success "ブラウザでLocal LLM Chatを開いています..."
    open "http://localhost:3000"
    
    print_success "🎉 Local LLM Chat が起動しました！"
    print_info "📱 ブラウザで http://localhost:3000 を開いてください"
    print_info "🛑 終了するには Ctrl+C を押してください"
    
    # アプリの終了を監視
    wait $SERVER_PID
}

# メイン実行フロー
main() {
    echo "========================="
    echo "  Local LLM Chat 起動"
    echo "========================="
    echo ""
    
    check_and_install_ollama
    check_and_install_nodejs
    start_ollama_service
    setup_ai_model
    install_dependencies
    start_application
}

# エラーハンドリング
trap 'print_error "エラーが発生しました。スクリプトを終了します。"' ERR

# Ctrl+Cでの終了処理
trap 'print_info "アプリケーションを終了しています..."; kill $SERVER_PID 2>/dev/null; exit 0' INT

main "$@"
