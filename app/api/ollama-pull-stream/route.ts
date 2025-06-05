import { NextRequest, NextResponse } from 'next/server'

// テスト用の簡単なGETエンドポイントを追加
export async function GET() {
  return NextResponse.json({ 
    message: 'ollama-pull-stream API is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  console.log('=== PULL STREAM API CALLED ===')
  try {
    const body = await request.json()
    const { endpoint, modelName } = body
    
    console.log('Pull stream request:', { endpoint, modelName, body })
    
    if (!modelName) {
      console.log('Error: No model name provided')
      return NextResponse.json({
        success: false,
        error: 'モデル名が指定されていません'
      }, { status: 400 })
    }

    const ollamaEndpoint = endpoint?.replace('/v1', '') || 'http://localhost:11434'
    console.log('Using Ollama endpoint:', ollamaEndpoint)
    
    // Server-Sent Events用のストリーミングレスポンスを作成
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log(`Starting pull for model: ${modelName}`)
          const response = await fetch(`${ollamaEndpoint}/api/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modelName })
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`Ollama pull failed:`, response.status, response.statusText, errorText)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              error: `Failed to start pull: ${response.statusText} - ${errorText}`
            })}\n\n`))
            controller.close()
            return
          }

          const reader = response.body?.getReader()
          if (!reader) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              error: 'No response body'
            })}\n\n`))
            controller.close()
            return
          }

          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const progressData = JSON.parse(line)
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`))
                } catch (e) {
                  // JSON parseに失敗した行は無視
                }
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'success',
            message: 'Download completed'
          })}\n\n`))
          
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            error: `Download failed: ${error}`
          })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error in pull stream:', error)
    return NextResponse.json({
      success: false,
      error: 'ストリーミングプルに失敗しました'
    }, { status: 500 })
  }
}
