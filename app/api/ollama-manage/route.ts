import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { endpoint, modelName, action } = await request.json()
    
    if (!modelName) {
      return NextResponse.json({
        success: false,
        error: 'モデル名が指定されていません'
      }, { status: 400 })
    }

    const ollamaEndpoint = endpoint?.replace('/v1', '') || 'http://localhost:11434'
    
    if (action === 'pull') {
      // モデルのダウンロード
      const response = await fetch(`${ollamaEndpoint}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      })

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`)
      }

      return NextResponse.json({
        success: true,
        message: `モデル "${modelName}" のダウンロードを開始しました`
      })

    } else if (action === 'delete') {
      // モデルの削除
      const response = await fetch(`${ollamaEndpoint}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      })

      if (!response.ok) {
        throw new Error(`Failed to delete model: ${response.statusText}`)
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
