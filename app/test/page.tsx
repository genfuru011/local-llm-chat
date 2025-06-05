"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface TestResult {
  name: string
  endpoint: string
  status: "pending" | "success" | "error"
  message?: string
}

export default function ConnectionTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Ollama", endpoint: "http://localhost:11434/api/tags", status: "pending" },
    { name: "LM Studio", endpoint: "http://localhost:1234/v1/models", status: "pending" },
  ])

  const runTest = async (index: number) => {
    const newTests = [...tests]
    newTests[index].status = "pending"
    setTests(newTests)

    try {
      const response = await fetch(`/api/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: tests[index].endpoint }),
      })

      const result = await response.json()

      newTests[index].status = response.ok ? "success" : "error"
      newTests[index].message = result.message || result.error
      setTests(newTests)
    } catch (error) {
      newTests[index].status = "error"
      newTests[index].message = "接続に失敗しました"
      setTests(newTests)
    }
  }

  const runAllTests = () => {
    tests.forEach((_, index) => runTest(index))
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>ローカルLLM接続テスト</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runAllTests} className="w-full">
              全てのサーバーをテスト
            </Button>

            {tests.map((test, index) => (
              <div key={test.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{test.name}</h3>
                  <p className="text-sm text-slate-600">{test.endpoint}</p>
                  {test.message && <p className="text-xs mt-1 text-slate-500">{test.message}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {test.status === "pending" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {test.status === "success" && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {test.status === "error" && <XCircle className="w-4 h-4 text-red-600" />}
                  <Badge
                    variant={
                      test.status === "success" ? "default" : test.status === "error" ? "destructive" : "secondary"
                    }
                  >
                    {test.status === "success" ? "接続OK" : test.status === "error" ? "エラー" : "待機中"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => runTest(index)}>
                    テスト
                  </Button>
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">セットアップ手順</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>
                  1. Ollamaをインストール: <code>curl -fsSL https://ollama.com/install.sh | sh</code>
                </li>
                <li>
                  2. Ollamaサーバー起動: <code>ollama serve</code>
                </li>
                <li>
                  3. モデルダウンロード: <code>ollama pull llama3.2:1b</code>
                </li>
                <li>4. 上記のテストボタンで接続確認</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
