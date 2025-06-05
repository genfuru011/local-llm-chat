import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('=== Ollama Local Models API Called ===')
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || 'http://localhost:11434'
    
    console.log('Fetching local models from:', endpoint)
    
    const ollamaEndpoint = endpoint.replace('/v1', '')
    
    // ローカルのインストール済みモデルを取得
    const response = await fetch(`${ollamaEndpoint}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      console.error('Failed to fetch local models:', response.status, response.statusText)
      throw new Error(`Failed to fetch local models: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`Found ${data.models?.length || 0} local models`)

    // モデル情報を整理
    const localModels = (data.models || []).map((model: any) => ({
      name: model.name,
      model: model.model,
      size: model.size,
      modified_at: model.modified_at,
      digest: model.digest,
      details: model.details,
      // 人間が読みやすいサイズ形式に変換
      sizeFormatted: formatBytes(model.size),
      // 最終更新日時をフォーマット
      modifiedFormatted: new Date(model.modified_at).toLocaleString('ja-JP')
    }))

    // サイズでソート（大きい順）
    localModels.sort((a: any, b: any) => b.size - a.size)

    return NextResponse.json({
      success: true,
      models: localModels,
      count: localModels.length
    })

  } catch (error) {
    console.error('Error fetching local models:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'ローカルモデルの取得に失敗しました',
      models: []
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  console.log('=== Ollama Local Model Delete API Called ===')
  try {
    const requestBody = await request.json()
    const { endpoint, modelName, modelNames, reason } = requestBody
    
    console.log('Delete request:', { endpoint, modelName, modelNames, reason })
    
    // 単一削除と一括削除の処理を分ける
    const modelsToDelete = modelNames || (modelName ? [modelName] : [])
    
    if (!modelsToDelete || modelsToDelete.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'モデル名が指定されていません'
      }, { status: 400 })
    }

    const ollamaEndpoint = endpoint?.replace('/v1', '') || 'http://localhost:11434'
    console.log('Using Ollama endpoint:', ollamaEndpoint)
    
    const results = []
    const errors = []
    
    // 各モデルを順次削除
    for (const model of modelsToDelete) {
      try {
        console.log(`Deleting model: ${model}${reason ? ` (理由: ${reason})` : ''}`)
        
        const response = await fetch(`${ollamaEndpoint}/api/delete`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: model })
        })

        console.log(`Delete response for ${model}:`, response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Delete failed for ${model}:`, errorText)
          errors.push(`${model}: ${response.statusText} - ${errorText}`)
        } else {
          results.push(model)
          console.log(`Successfully deleted: ${model}`)
        }
      } catch (error) {
        console.error(`Error deleting ${model}:`, error)
        errors.push(`${model}: ${(error as Error).message}`)
      }
    }
    
    // 結果をまとめて返す
    if (errors.length === 0) {
      const message = modelsToDelete.length === 1 
        ? `モデル "${modelsToDelete[0]}" を削除しました`
        : `${results.length}個のモデルを削除しました: ${results.join(', ')}`
      
      return NextResponse.json({
        success: true,
        message,
        deleted: results,
        total: modelsToDelete.length
      })
    } else if (results.length === 0) {
      // 全て失敗
      return NextResponse.json({
        success: false,
        error: `削除に失敗しました: ${errors.join('; ')}`,
        errors
      }, { status: 500 })
    } else {
      // 一部成功、一部失敗
      return NextResponse.json({
        success: true,
        message: `${results.length}個のモデルを削除しました（${errors.length}個は失敗）`,
        deleted: results,
        errors,
        total: modelsToDelete.length
      })
    }

  } catch (error) {
    console.error('Error in delete operation:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'モデルの削除に失敗しました'
    }, { status: 500 })
  }
}

// バイトサイズを人間が読みやすい形式に変換
function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
