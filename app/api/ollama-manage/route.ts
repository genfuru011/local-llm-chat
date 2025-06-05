import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== Ollama Manage API Called ===')
  try {
    const requestBody = await request.json()
    const { endpoint, modelName, action } = requestBody
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    console.log('Parsed values:', { endpoint, modelName, action })
    
    if (!modelName) {
      console.log('ERROR: No model name provided')
      return NextResponse.json({
        success: false,
        error: 'モデル名が指定されていません'
      }, { status: 400 })
    }

    const ollamaEndpoint = endpoint?.replace('/v1', '') || 'http://localhost:11434'
    console.log('Using Ollama endpoint:', ollamaEndpoint)
    
    if (action === 'pull') {
      // モデルのダウンロード
      console.log(`Starting pull for model: ${modelName}`)
      
      const response = await fetch(`${ollamaEndpoint}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: false })
      })

      console.log('Pull response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Pull failed:', errorText)
        throw new Error(`Failed to pull model: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Pull result:', result)

      return NextResponse.json({
        success: true,
        message: `モデル "${modelName}" のダウンロードが完了しました`
      })

    } else if (action === 'delete') {
      // モデルの削除
      console.log(`Starting delete for model: ${modelName}`)
      
      const response = await fetch(`${ollamaEndpoint}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      })

      console.log('Delete response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete failed:', errorText)
        throw new Error(`Failed to delete model: ${response.statusText} - ${errorText}`)
      }

      return NextResponse.json({
        success: true,
        message: `モデル "${modelName}" を削除しました`
      })

    } else {
      return NextResponse.json({
        success: false,
        error: '無効なアクションです'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error managing model:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'モデル操作に失敗しました'
    }, { status: 500 })
  }
}
