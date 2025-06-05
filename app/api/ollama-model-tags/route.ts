import { NextRequest, NextResponse } from 'next/server'

interface ModelTag {
  name: string
  tag: string
  size?: string
  description?: string
  digest?: string
  modified_at?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelName = searchParams.get('model')
    const endpoint = searchParams.get('endpoint') || 'http://localhost:11434'
    
    if (!modelName) {
      return NextResponse.json({
        success: false,
        error: 'モデル名が指定されていません'
      }, { status: 400 })
    }

    // Ollama Libraryから特定モデルのタグ情報を取得
    let modelTags: ModelTag[] = []
    
    try {
      // 1. Ollama Library APIから詳細タグ情報を取得
      const libraryUrl = `https://ollama.com/library/${modelName}/tags`
      const libraryResponse = await fetch(libraryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })

      if (libraryResponse.ok) {
        const htmlContent = await libraryResponse.text()
        modelTags = parseModelTagsFromHtml(modelName, htmlContent)
        console.log(`Found ${modelTags.length} tags for ${modelName}`)
      }
    } catch (error) {
      console.log('Failed to fetch from Ollama Library:', error)
    }

    // 2. フォールバック: 一般的なタグを生成
    if (modelTags.length === 0) {
      modelTags = generateCommonTags(modelName)
    }

    // 3. ローカルインストール状況を確認
    let localModels: any[] = []
    try {
      const localResponse = await fetch(`${endpoint}/api/tags`)
      if (localResponse.ok) {
        const localData = await localResponse.json()
        localModels = localData.models || []
      }
    } catch (error) {
      console.log('Failed to fetch local models:', error)
    }

    // ローカルインストール状況を付与
    const tagsWithStatus = modelTags.map(tag => ({
      ...tag,
      installed: localModels.some(local => 
        local.name === tag.name || 
        local.name === `${modelName}:${tag.tag}` ||
        local.name.startsWith(`${modelName}:${tag.tag}`)
      ),
      localInfo: localModels.find(local => 
        local.name === tag.name || 
        local.name === `${modelName}:${tag.tag}` ||
        local.name.startsWith(`${modelName}:${tag.tag}`)
      )
    }))

    return NextResponse.json({
      success: true,
      model: modelName,
      tags: tagsWithStatus
    })

  } catch (error) {
    console.error('Error fetching model tags:', error)
    return NextResponse.json({
      success: false,
      error: 'モデルタグの取得に失敗しました'
    }, { status: 500 })
  }
}

// HTMLからモデルタグを解析
function parseModelTagsFromHtml(modelName: string, html: string): ModelTag[] {
  const tags: ModelTag[] = []
  
  // タグセクションを探す（例: "gemma3:1b", "gemma3:3b", etc.）
  const tagPatterns = [
    // タグの一般的なパターン
    new RegExp(`${modelName}:([\\w\\d\\.\\-]+)`, 'gi'),
    // サイズ情報付きパターン  
    /(\d+\.?\d*[bB]|\d+[KMGT]?B)/gi,
    // その他のタグパターン
    /(latest|instruct|chat|code|text)/gi
  ]

  const foundTags = new Set<string>()

  // HTMLからタグを抽出
  for (const pattern of tagPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && !foundTags.has(match[1])) {
        foundTags.add(match[1])
        
        const fullName = `${modelName}:${match[1]}`
        tags.push({
          name: fullName,
          tag: match[1],
          description: `${modelName} model - ${match[1]} variant`
        })
      }
    }
  }

  // サイズ情報も抽出してマッチング
  const sizePattern = /(\d+\.?\d*[bB]|\d+[KMGT]?B)/gi
  const sizeMatches = html.matchAll(sizePattern)
  const sizes: string[] = []
  for (const match of sizeMatches) {
    sizes.push(match[1])
  }

  // サイズとタグをマッチング（推測）
  tags.forEach((tag, index) => {
    if (sizes[index]) {
      tag.size = sizes[index]
    }
  })

  return tags
}

// 一般的なタグを生成（フォールバック）
function generateCommonTags(modelName: string): ModelTag[] {
  const commonTags: ModelTag[] = []
  
  // モデル名に応じて一般的なタグを生成
  const tagVariants = {
    'gemma3': ['1b', '3b', '8b', 'latest'],
    'gemma2': ['2b', '9b', '27b', 'latest'],
    'llama3': ['8b', '70b', 'latest'],
    'llama3.1': ['8b', '70b', '405b', 'latest'],
    'llama3.2': ['1b', '3b', '11b', '90b', 'latest'],
    'qwen2.5': ['0.5b', '1.5b', '3b', '7b', '14b', '32b', '72b', 'latest'],
    'qwen3': ['1.5b', '3b', '7b', '14b', '32b', 'latest'],
    'phi3': ['mini', 'small', 'medium', 'latest'],
    'codellama': ['7b', '13b', '34b', 'latest'],
    'mistral': ['7b', 'latest'],
    'mixtral': ['8x7b', '8x22b', 'latest']
  }

  const variants = tagVariants[modelName as keyof typeof tagVariants] || ['latest']
  
  variants.forEach(variant => {
    commonTags.push({
      name: `${modelName}:${variant}`,
      tag: variant,
      description: `${modelName} model - ${variant} ${variant.includes('b') ? 'parameter' : ''} variant`
    })
  })

  return commonTags
}
