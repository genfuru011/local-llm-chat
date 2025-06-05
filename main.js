const { app, BrowserWindow, shell, Menu, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let nextProcess

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    icon: path.join(__dirname, 'public/next.svg'),
    titleBarStyle: 'default',
    show: false
  })

  // Next.jsサーバーを起動
  startNextServer()

  // 開発時はlocalhost、本番時はローカルファイル
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    // 開発モード: Next.jsサーバーの起動を待ってからロード
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000')
      mainWindow.webContents.openDevTools()
    }, 3000)
  } else {
    // 本番モード: ビルドされたファイルをロード
    mainWindow.loadURL('http://localhost:3000')
  }

  // ウィンドウの準備ができたら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 外部リンクはデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function startNextServer() {
  // Next.jsサーバーを起動
  nextProcess = spawn('npm', ['run', 'start'], {
    cwd: __dirname,
    stdio: 'pipe'
  })

  nextProcess.stdout.on('data', (data) => {
    console.log(`Next.js: ${data}`)
  })

  nextProcess.stderr.on('data', (data) => {
    console.error(`Next.js Error: ${data}`)
  })
}

// 自動更新設定
autoUpdater.checkForUpdatesAndNotify()

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'アップデートが利用可能',
    message: 'Local LLM Chatの新しいバージョンが利用可能です。バックグラウンドでダウンロードを開始します。',
    buttons: ['OK']
  })
})

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'アップデート準備完了',
    message: 'アップデートがダウンロードされました。アプリケーションを再起動して更新を適用しますか？',
    buttons: ['今すぐ再起動', '後で']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall()
    }
  })
})

// Electronの初期化完了時
app.whenReady().then(createWindow)

// すべてのウィンドウが閉じられた時
app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// アプリがアクティブになった時（macOS）
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// アプリ終了時にNext.jsプロセスも終了
app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
})
