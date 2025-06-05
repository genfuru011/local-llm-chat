"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useId } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, MessageSquare, Bot, User, Wifi, Download, Trash2, RefreshCw, Search } from "lucide-react"

interface OllamaModel {
  name: string
  description: string
  size: string
  tags: string[]
  official: boolean
  installed: boolean
  modified?: string | null
  updated_at?: string
  downloads?: number
  pulls?: number
}

import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"

export default function LocalLLMChat() {
  const [filterOfficial, setFilterOfficial] = useState(false)
  const [filterInstalled, setFilterInstalled] = useState(false)
  const [customEndpoint, setCustomEndpoint] = useState("http://localhost:11434/v1")
  const [modelName, setModelName] = useState("llama3.2")
  const [showSettings, setShowSettings] = useState(false)
  const [showModelBrowser, setShowModelBrowser] = useState(false)

  // 接続テストの状態
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')

  // モデル管理の状態
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelFilter, setModelFilter] = useState('')
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set())
  const [modelDataSource, setModelDataSource] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('pulls')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [pullProgress, setPullProgress] = useState<{[key: string]: {completed: number, total: number, status: string}}>({})

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const savedEndpoint = localStorage.getItem('ollama-endpoint')
    const savedModel = localStorage.getItem('ollama-model')
    
    if (savedEndpoint) setCustomEndpoint(savedEndpoint)
    if (savedModel) setModelName(savedModel)
  }, [])

  // 設定変更時にローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('ollama-endpoint', customEndpoint)
  }, [customEndpoint])

  useEffect(() => {
    localStorage.setItem('ollama-model', modelName)
  }, [modelName])

  // ステータスメッセージを表示し、自動的に消す
  const showStatusMessage = (type: 'success' | 'error', message: string) => {
    setStatusMessage({ type, message })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  // バイトサイズを人間が読みやすい形式に変換
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Ollama接続テスト
  const testOllamaConnection = async () => {
    setConnectionStatus('testing')
    try {
      const testEndpoint = customEndpoint.replace('/v1', '/api/tags')
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: testEndpoint })
      })
      const data = await response.json()
      
      if (data.success) {
        setConnectionStatus('success')
        setConnectionMessage(data.message)
      } else {
        setConnectionStatus('error')
        setConnectionMessage(data.error)
      }
    } catch (error) {
      setConnectionStatus('error')
      setConnectionMessage('接続テストに失敗しました')
    }
  }

  // 利用可能なモデル一覧を取得
  const fetchAvailableModels = async (search: string = "") => {
    setLoadingModels(true)
    try {
      const endpoint = customEndpoint.replace('/v1', '')
      const url = `/api/ollama-models?endpoint=${encodeURIComponent(endpoint)}${search ? `&search=${encodeURIComponent(search)}` : ''}&sort_by=${sortBy}&order=${sortOrder}`
      console.log('Fetching models from:', url)
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        console.log(`Fetched ${data.models.length} models from ${data.source}`)
        setAvailableModels(data.models)
        setModelDataSource(data.source)
      } else {
        console.error('Failed to fetch models:', data.error)
        showStatusMessage('error', `モデル取得に失敗: ${data.error}`)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
      showStatusMessage('error', 'モデル一覧の取得中にエラーが発生しました')
    } finally {
      setLoadingModels(false)
    }
  }

  // モデルのダウンロード（ストリーミング版）
  const downloadModelWithProgress = async (modelName: string) => {
    setDownloadingModels(prev => new Set([...prev, modelName]))
    setPullProgress(prev => ({ ...prev, [modelName]: { completed: 0, total: 0, status: 'starting' } }))
    
    try {
      const response = await fetch('/api/ollama-pull-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: customEndpoint,
          modelName
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                showStatusMessage('error', `ダウンロードエラー: ${data.error}`)
                break
              }
              
              if (data.status === 'success') {
                showStatusMessage('success', `モデル「${modelName}」のダウンロードが完了しました`)
                // モデル一覧を即座に更新
                console.log('Download completed, refreshing model list...')
                setTimeout(async () => {
                  await fetchAvailableModels(modelFilter)
                }, 1000)
                break
              }
              
              if (data.total && data.completed !== undefined) {
                setPullProgress(prev => ({
                  ...prev,
                  [modelName]: {
                    completed: data.completed,
                    total: data.total,
                    status: data.status || 'downloading'
                  }
                }))
              }
            } catch (e) {
              console.log('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } catch (error) {
      showStatusMessage('error', `ダウンロード中にエラーが発生しました: ${error}`)
      console.error('Error downloading model with progress:', error)
    } finally {
      setDownloadingModels(prev => {
        const newSet = new Set(prev)
        newSet.delete(modelName)
        return newSet
      })
      setPullProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[modelName]
        return newProgress
      })
    }
  }

  // モデルのダウンロード（従来版）
  const downloadModel = async (modelName: string) => {
    setDownloadingModels(prev => new Set([...prev, modelName]))
    try {
      const response = await fetch('/api/ollama-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: customEndpoint,
          modelName,
          action: 'pull'
        })
      })
      const data = await response.json()
      
      if (data.success) {
        showStatusMessage('success', `モデル「${modelName}」のダウンロードが完了しました`)
        // モデル一覧を即座に更新
        await fetchAvailableModels(modelFilter)
      } else {
        showStatusMessage('error', `ダウンロードに失敗しました: ${data.error}`)
        console.error('Failed to download model:', data.error)
      }
    } catch (error) {
      showStatusMessage('error', 'ダウンロード中にエラーが発生しました')
      console.error('Error downloading model:', error)
    } finally {
      setDownloadingModels(prev => {
        const newSet = new Set(prev)
        newSet.delete(modelName)
        return newSet
      })
    }
  }

  // モデルの削除
  const deleteModel = async (modelName: string) => {
    try {
      const response = await fetch('/api/ollama-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: customEndpoint,
          modelName,
          action: 'delete'
        })
      })
      const data = await response.json()
      
      if (data.success) {
        showStatusMessage('success', `モデル「${modelName}」が削除されました`)
        fetchAvailableModels()
      } else {
        showStatusMessage('error', `削除に失敗しました: ${data.error}`)
        console.error('Failed to delete model:', data.error)
      }
    } catch (error) {
      showStatusMessage('error', '削除中にエラーが発生しました')
      console.error('Error deleting model:', error)
    }
  }

  // フィルタリングされたモデル一覧
  const filteredModels = availableModels.filter(model =>
    (!filterOfficial || model.official) &&
    (!filterInstalled || model.installed) &&
    (
      model.name.toLowerCase().includes(modelFilter.toLowerCase()) ||
      model.description.toLowerCase().includes(modelFilter.toLowerCase()) ||
      model.tags.some(tag => tag.toLowerCase().includes(modelFilter.toLowerCase()))
    )
  )

  // データソースのバッジ表示用ヘルパー関数
  const getDataSourceVariant = (source: string) => {
    switch (source) {
      case 'ollamadb': return 'default'
      case 'ollama-library-scraping': return 'default'
      case 'ollama-library-detailed': return 'default'
      case 'fallback': return 'secondary'
      default: return 'outline'
    }
  }

  const getDataSourceLabel = (source: string) => {
    switch (source) {
      case 'ollamadb': return '🌐 OllamaDB API'
      case 'ollama-library-scraping': return '🔍 公式ライブラリ（簡易）'
      case 'ollama-library-detailed': return '🔍 公式ライブラリ（詳細）'
      case 'fallback': return '📦 フォールバック'
      default: return '❓ 不明'
    }
  }

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: {
      endpoint: customEndpoint,
      modelName: modelName,
    },
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Local LLM Chat</h1>
              <p className="text-slate-600">Ollamaとの対話</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showModelBrowser ? "default" : "outline"}
              size="sm" 
              onClick={() => {
                setShowModelBrowser(!showModelBrowser)
                if (!showModelBrowser) {
                  fetchAvailableModels()
                }
              }}
              className={showModelBrowser ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <Download className="w-4 h-4 mr-2" />
              モデル管理
            </Button>
            <Button 
              variant={showSettings ? "default" : "outline"}
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              className={showSettings ? "bg-gray-600 hover:bg-gray-700" : ""}
            >
              <Settings className="w-4 h-4 mr-2" />
              設定
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Ollama設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Ollamaエンドポイント</label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={testOllamaConnection}
                      disabled={connectionStatus === 'testing'}
                    >
                      <Wifi className={`w-4 h-4 ${
                        connectionStatus === 'testing' ? 'animate-pulse' : 
                        connectionStatus === 'success' ? 'text-green-600' : 
                        connectionStatus === 'error' ? 'text-red-600' : ''
                      }`} />
                    </Button>
                  </div>
                  <Input
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                  />
                  {connectionMessage && (
                    <p className={`text-xs mt-1 ${
                      connectionStatus === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {connectionMessage}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">モデル名</label>
                  <Input 
                    value={modelName} 
                    onChange={(e) => setModelName(e.target.value)} 
                    placeholder="llama3.2"
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    使用するOllamaモデルの名前を入力してください
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Ollama - {modelName}
                </Badge>
                <Badge variant="outline">{customEndpoint}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Model Browser Panel */}
        {showModelBrowser && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Ollamaモデル管理</CardTitle>
                  {modelDataSource && (
                    <Badge variant={getDataSourceVariant(modelDataSource)} className="text-xs">
                      {getDataSourceLabel(modelDataSource)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-500 hidden md:block">
                    💡 ダウンロードには時間がかかる場合があります
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => fetchAvailableModels(modelFilter)}
                    disabled={loadingModels}
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingModels ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Message */}
              {statusMessage && (
                <div className={`p-3 rounded-lg ${
                  statusMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {statusMessage.type === 'success' ? '✅' : '❌'}
                    <span className="text-sm font-medium">{statusMessage.message}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusMessage(null)}
                      className="ml-auto h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}
              {/* Search Filter */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="モデル名、説明、タグで検索..."
                    value={modelFilter}
                    onChange={async (e) => {
                      setModelFilter(e.target.value)
                      // リアルタイム検索を少し遅延させて、APIリクエストを減らす
                      if (searchTimeout) {
                        clearTimeout(searchTimeout)
                      }
                      const timeout = setTimeout(async () => {
                        await fetchAvailableModels(e.target.value)
                      }, 500)
                      setSearchTimeout(timeout)
                    }}
                    className="pl-10"
                  />
                  {modelFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        setModelFilter('')
                        if (searchTimeout) {
                          clearTimeout(searchTimeout)
                        }
                        await fetchAvailableModels('')
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      ×
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={async (v) => { setSortBy(v); await fetchAvailableModels(modelFilter) }}>
                    <SelectTrigger className="w-32">
                      📊 ソート
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pulls">📈 人気順</SelectItem>
                      <SelectItem value="name">🔤 名前順</SelectItem>
                      <SelectItem value="last_updated">🕒 更新日順</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={async (v) => { setSortOrder(v as 'asc' | 'desc'); await fetchAvailableModels(modelFilter) }}>
                    <SelectTrigger className="w-20">
                      順序
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">↓ 降順</SelectItem>
                      <SelectItem value="asc">↑ 昇順</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 検索結果の統計表示 */}
              {!loadingModels && (
                <div className="text-sm text-slate-500 px-1">
                  {modelFilter ? (
                    <>
                      検索結果: <strong>{filteredModels.length}</strong>件 
                      {availableModels.length > 0 && (
                        <span className="ml-2">
                          (全{availableModels.length}件中)
                        </span>
                      )}
                    </>
                  ) : (
                    <span>全 <strong>{availableModels.length}</strong> 件のモデル</span>
                  )}
                </div>
              )}

              {/* Model List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loadingModels ? (
                  <div className="text-center py-8 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    モデル一覧を読み込み中...
                  </div>
                ) : filteredModels.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    {modelFilter ? '検索条件に一致するモデルが見つかりません' : 'モデルが見つかりません'}
                    {modelFilter && (
                      <p className="text-xs mt-2">
                        キーワード「{modelFilter}」を含むモデルを検索中...
                      </p>
                    )}
                  </div>
                ) : (
                  filteredModels.map((model) => (
                    <div
                      key={model.name}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{model.name}</h3>
                          {model.installed && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              ✅ インストール済み
                            </Badge>
                          )}
                          {model.official && (
                            <Badge variant="outline" className="text-xs">
                              🏛️ 公式
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{model.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            📦 {model.size}
                          </Badge>
                          {model.pulls && (
                            <Badge variant="secondary" className="text-xs">
                              📥 {model.pulls.toLocaleString()}回ダウンロード
                            </Badge>
                          )}
                          {model.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {model.installed ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setModelName(model.name)
                                setShowModelBrowser(false)
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              ✨ 使用
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`モデル「${model.name}」を削除しますか？`)) {
                                  deleteModel(model.name)
                                }
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {pullProgress[model.name] ? (
                              <div className="min-w-[200px]">
                                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                  <span>{pullProgress[model.name].status}</span>
                                  <span>
                                    {Math.round((pullProgress[model.name].completed / pullProgress[model.name].total) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ 
                                      width: `${(pullProgress[model.name].completed / pullProgress[model.name].total) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {formatBytes(pullProgress[model.name].completed)} / {formatBytes(pullProgress[model.name].total)}
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadModelWithProgress(model.name)}
                                disabled={downloadingModels.has(model.name)}
                                className="min-w-[120px]"
                              >
                                {downloadingModels.has(model.name) ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ダウンロード中...
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-2" />
                                    ダウンロード
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                チャット
                <Badge variant="outline" className="ml-2 text-xs">
                  {modelName}
                </Badge>
              </CardTitle>
              <Badge variant={isLoading ? "destructive" : "secondary"}>
                {isLoading ? "応答中..." : "待機中"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">
                <p>エラーが発生しました: {error.message}</p>
              </div>
            )}

            {messages.length === 0 && !error && (
              <div className="text-center text-slate-500 mt-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>Ollamaとの対話を開始してください</p>
                <p className="text-sm mt-2">設定でOllamaサーバーの接続情報を確認してください</p>
                <p className="text-xs mt-1 text-blue-600">
                  モデル名: {modelName}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-slate-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="メッセージを入力してください..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                送信
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

