"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, MessageSquare, Bot, User, Wifi, Eye, EyeOff } from "lucide-react"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

interface OpenAIModel {
  id: string
  name: string
  description: string
  created: number
  owned_by: string
  is_fine_tuned?: boolean
}

export default function OpenAIChat() {
  const [apiKey, setApiKey] = useState("")
  const [modelName, setModelName] = useState("gpt-4.1-nano")
  const [showSettings, setShowSettings] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  // 接続テストの状態
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  
  // モデル管理の状態
  const [availableModels, setAvailableModels] = useState<OpenAIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai-api-key')
    const savedModel = localStorage.getItem('openai-model')
    
    if (savedApiKey) setApiKey(savedApiKey)
    if (savedModel) setModelName(savedModel)
  }, [])

  // 設定変更時にローカルストレージに保存
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openai-api-key', apiKey)
    }
  }, [apiKey])

  useEffect(() => {
    localStorage.setItem('openai-model', modelName)
  }, [modelName])

  // OpenAI API接続テスト
  const testOpenAIConnection = async () => {
    setConnectionStatus('testing')
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })
      const data = await response.json()
      
      if (data.success) {
        setConnectionStatus('success')
        setConnectionMessage(data.message)
        // 接続成功時に利用可能モデルを取得
        fetchAvailableModels()
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
  const fetchAvailableModels = async () => {
    if (!apiKey) return
    
    setLoadingModels(true)
    try {
      const response = await fetch(`/api/openai-models?apiKey=${encodeURIComponent(apiKey)}`)
      const data = await response.json()
      
      if (data.success) {
        setAvailableModels(data.models)
        console.log('取得されたモデル:', data.models.map((m: OpenAIModel) => m.id))
      } else {
        console.error('Failed to fetch models:', data.error)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoadingModels(false)
    }
  }

  // チャット機能
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: {
      modelName: modelName,
      apiKey: apiKey,
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
            <div className="p-2 bg-green-600 rounded-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">OpenAI Chat</h1>
              <p className="text-slate-600">OpenAI APIとの対話</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showSettings ? "default" : "outline"}
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              className={showSettings ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Settings className="w-4 h-4 mr-2" />
              設定
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                OpenAI API 設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button 
                    onClick={testOpenAIConnection}
                    disabled={!apiKey || connectionStatus === 'testing'}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    <Wifi className="w-4 h-4 mr-2" />
                    {connectionStatus === 'testing' ? 'テスト中...' : '接続テスト'}
                  </Button>
                </div>
                {!apiKey && (
                  <p className="text-sm text-slate-500 mt-1">
                    OpenAI APIキーを<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">こちら</a>から取得してください。
                  </p>
                )}
              </div>

              {/* Connection Status */}
              {connectionStatus !== 'idle' && (
                <div className="flex items-center gap-2">
                  <div className={
                    "w-3 h-3 rounded-full " + 
                    (connectionStatus === 'success' ? 'bg-green-500' : 
                    connectionStatus === 'error' ? 'bg-red-500' : 
                    'bg-yellow-500 animate-pulse')
                  } />
                  <span className={
                    "text-sm " + 
                    (connectionStatus === 'success' ? 'text-green-700' : 
                    connectionStatus === 'error' ? 'text-red-700' : 
                    'text-yellow-700')
                  }>
                    {connectionMessage}
                  </span>
                </div>
              )}

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  モデル選択
                </label>
                <div className="flex gap-2">
                  <Select value={modelName} onValueChange={setModelName}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="モデルを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.length > 0 ? (
                        availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.is_fine_tuned ? '🎯 ' : ''}{model.name} 
                            {model.is_fine_tuned ? ' (ファインチューニング)' : ` - ${model.owned_by}`}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="gpt-4.1-nano">GPT-4.1 Nano ⚠️ (実験的)</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini (推奨)</SelectItem>
                          <SelectItem value="o1-preview">o1-preview</SelectItem>
                          <SelectItem value="o1-mini">o1-mini</SelectItem>
                          <SelectItem value="gpt-4o-2024-11-20">GPT-4o (2024-11-20)</SelectItem>
                          <SelectItem value="gpt-4o-2024-08-06">GPT-4o (2024-08-06)</SelectItem>
                          <SelectItem value="gpt-4o-2024-05-13">GPT-4o (2024-05-13)</SelectItem>
                          <SelectItem value="gpt-4-turbo-2024-04-09">GPT-4 Turbo (2024-04-09)</SelectItem>
                          <SelectItem value="ft:" disabled>🎯 ファインチューニングモデル (下記で入力)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={fetchAvailableModels}
                    disabled={!apiKey || loadingModels}
                    variant="outline"
                    size="sm"
                  >
                    {loadingModels ? '取得中...' : '更新'}
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  使用するOpenAIモデルを選択してください。
                </p>
                {modelName === 'gpt-4.1-nano' && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⚠️ GPT-4.1 nanoは実験的なモデル名です。OpenAI APIで利用できない場合があります。
                  </div>
                )}
                {modelName.startsWith('ft:') && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    🎯 <strong>ファインチューニングモデルを使用中</strong><br/>
                    このモデルは特定のタスクやデータセットに最適化されています。<br/>
                    期待通りの結果が得られない場合は、ベースモデルと比較してみてください。
                  </div>
                )}
              </div>

              {/* Custom Model Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  カスタム/ファインチューニングモデル
                </label>
                <div className="flex gap-2">
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="ft:gpt-3.5-turbo:your-org:custom-suffix:id または gpt-4.1-nano"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      if (modelName.trim()) {
                        // カスタムモデル名が設定されていることを確認
                        console.log('Custom model set:', modelName)
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    設定
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  🎯 ファインチューニングモデル: <code>ft:</code>で始まるモデルID<br/>
                  🔬 実験的モデル: <code>gpt-4.1-nano</code>などの新しいモデル<br/>
                  📅 特定バージョン: <code>gpt-4o-2024-12-01</code>などの日付付きモデル
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-600" />
                {modelName.startsWith('ft:') ? '🎯 ' : ''}チャット - {modelName}
                {modelName.startsWith('ft:') && (
                  <Badge variant="secondary" className="text-xs">
                    ファインチューニング
                  </Badge>
                )}
              </span>
              <div className="flex gap-2">
                {apiKey && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    API Key設定済み
                  </Badge>
                )}
                {modelName.startsWith('ft:') && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    カスタムモデル
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="h-full">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>OpenAI APIとの会話を開始してください</p>
                    {!apiKey && (
                      <p className="text-sm mt-2">
                        まず設定でAPIキーを入力してください
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        "flex gap-3 " + 
                        (message.role === "user" ? "justify-end" : "justify-start")
                      }
                    >
                      <div className={
                        "flex gap-3 max-w-[80%] " + 
                        (message.role === "user" ? "flex-row-reverse" : "flex-row")
                      }>
                        <div className={
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 " + 
                          (message.role === "user" 
                            ? "bg-blue-100 text-blue-600" 
                            : "bg-green-100 text-green-600")
                        }>
                          {message.role === "user" ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        <div className={
                          "p-3 rounded-lg " + 
                          (message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-slate-200")
                        }>
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="border-t bg-slate-50">
            <form onSubmit={handleSubmit} className="flex gap-2 w-full">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder={apiKey ? "メッセージを入力..." : "まずAPIキーを設定してください"}
                disabled={isLoading || !apiKey}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim() || !apiKey}
                className="bg-green-600 hover:bg-green-700"
              >
                送信
              </Button>
            </form>
          </CardFooter>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mt-4 border-red-200">
            <CardContent className="pt-6">
              <div className="text-red-600 text-sm">
                <strong>エラー:</strong> {error.message}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
