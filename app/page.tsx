"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, MessageSquare, Bot, User, Wifi } from "lucide-react"

export default function LocalLLMChat() {
  const [customEndpoint, setCustomEndpoint] = useState("http://localhost:11434/v1")
  const [modelName, setModelName] = useState("llama3.2")
  const [showSettings, setShowSettings] = useState(false)

  // 接続テストの状態
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')

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
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4 mr-2" />
            設定
          </Button>
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

