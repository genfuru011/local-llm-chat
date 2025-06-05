import { NextRequest, NextResponse } from 'next/server'

interface OllamaModelInfo {
  name: string
  description?: string
  size?: string
  tags?: string[]
  official?: boolean
  updated_at?: string
  digest?: string
}

// Ollamaライブラリから利用可能なモデル一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || 'http://localhost:11434'
    const search = searchParams.get('search') || ''
    const sort_by = searchParams.get('sort_by') || 'pulls'
    const order = searchParams.get('order') || 'desc'
    
    // ローカルにインストール済みのモデル一覧を取得
    const localModelsResponse = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    let localModels: any[] = []
    if (localModelsResponse.ok) {
      const data = await localModelsResponse.json()
      localModels = data.models || []
    }

    // Ollama公式ライブラリからモデル一覧を取得（複数の方法を試行）
    let onlineModels: OllamaModelInfo[] = []
    let dataSource = 'fallback'
    
    try {
      // 方法1: サードパーティAPI (ollama-models-api.up.railway.app) を使用
      try {
        const url = `https://ollama-models-api.up.railway.app/models?limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}&sort_by=${encodeURIComponent(sort_by)}&order=${encodeURIComponent(order)}`
        const ollamaDbResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Local-LLM-Chat/1.0',
            'Accept': 'application/json'
          }
        })
        if (ollamaDbResponse.ok) {
          const ollamaDbData = await ollamaDbResponse.json()
          if (ollamaDbData.models && ollamaDbData.models.length > 0) {
            onlineModels = ollamaDbData.models.map((model: any) => ({
              name: model.model_name || model.name || model.slug,
              description: model.description || model.title || `${model.model_name || model.name} model`,
              size: model.size || formatBytes(model.sizeBytes) || 'Unknown',
              tags: model.labels || model.tags || ['official'],
              official: (model.model_type === 'official') || true,
              updated_at: model.last_updated || model.updatedAt || model.modified_at,
              downloads: model.downloads,
              pulls: model.pulls
            }))
            dataSource = 'ollamadb'
            console.log(`Fetched ${onlineModels.length} models from OllamaDB`)
          }
        }
      } catch (ollamaDbError) {
        console.log('Failed to fetch from OllamaDB:', ollamaDbError)
      }

      // 方法2: Ollama公式ライブラリページのスクレイピング（簡易版）
      if (onlineModels.length === 0) {
        try {
          const libraryResponse = await fetch('https://ollama.com/library', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          })
          
          if (libraryResponse.ok) {
            const htmlContent = await libraryResponse.text()
            onlineModels = parseOllamaLibraryHtml(htmlContent)
            if (onlineModels.length > 0) {
              dataSource = 'ollama-library-scraping'
              console.log(`Scraped ${onlineModels.length} models from Ollama Library`)
            }
          }
        } catch (scrapingError) {
          console.log('Failed to scrape Ollama Library:', scrapingError)
        }
      }

      // 方法3: GitHub Issue #7751のコメント例を参考にした軽量スクレイピング
      if (onlineModels.length === 0) {
        try {
          // curl -s https://ollama.com/library | grep -oP 'href="/library/\\K[^"]+'の代替実装
          const libraryResponse = await fetch('https://ollama.com/library', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          })
          
          if (libraryResponse.ok) {
            const htmlContent = await libraryResponse.text()
            const modelSlugs = extractModelSlugsFromHtml(htmlContent)
            
            // 上位20モデルの詳細情報を取得
            const modelPromises = modelSlugs.slice(0, 20).map(async (slug: string) => {
              try {
                const modelResponse = await fetch(`https://ollama.com/library/${slug}`, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
                })
                if (modelResponse.ok) {
                  const modelHtml = await modelResponse.text()
                  return parseModelPageHtml(slug, modelHtml)
                }
              } catch (error) {
                console.log(`Failed to fetch details for ${slug}`)
              }
              return null
            })
            
            const modelDetails = await Promise.all(modelPromises)
            onlineModels = modelDetails.filter(model => model !== null) as OllamaModelInfo[]
            if (onlineModels.length > 0) {
              dataSource = 'ollama-library-detailed'
              console.log(`Fetched ${onlineModels.length} models via detailed scraping`)
            }
          }
        } catch (detailedError) {
          console.log('Failed detailed scraping:', detailedError)
        }
      }
    } catch (error) {
      console.log('All online model fetching methods failed, using fallback')
    }

    // オンラインから取得できない場合のフォールバックモデル
    if (onlineModels.length === 0) {
      onlineModels = getFallbackModels()
    }

    // ローカルモデルのステータスを追加
    const modelsWithStatus = onlineModels.map((model: OllamaModelInfo) => ({
      ...model,
      installed: localModels.some((local: any) => 
        local.name === model.name || 
        local.name.includes(model.name) || 
        model.name.includes(local.name.split(':')[0])
      ),
      modified: localModels.find((local: any) => 
        local.name === model.name || 
        local.name.includes(model.name) || 
        model.name.includes(local.name.split(':')[0])
      )?.modified_at || null
    }))

    return NextResponse.json({
      success: true,
      models: modelsWithStatus,
      localModels: localModels,
      source: dataSource
    })

  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json({
      success: false,
      error: 'モデル一覧の取得に失敗しました'
    }, { status: 500 })
  }
}

// バイトサイズを人間が読みやすい形式に変換
function formatBytes(bytes: number): string {
  if (!bytes) return 'Unknown'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Ollama LibraryページのHTMLから基本的なモデル情報を抽出
function parseOllamaLibraryHtml(html: string): OllamaModelInfo[] {
  const models: OllamaModelInfo[] = []
  
  // 基本的なパターンマッチングでモデルリンクを抽出
  const modelLinkPattern = /href="\/library\/([^"]+)"/g
  const modelMatches = Array.from(html.matchAll(modelLinkPattern))
  
  // タイトルや説明を抽出するパターン
  const titlePattern = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g
  const descriptionPattern = /<p[^>]*>([^<]{20,})<\/p>/g
  
  const seenModels = new Set<string>()
  
  for (const match of modelMatches) {
    const modelName = match[1]
    if (!seenModels.has(modelName) && modelName && !modelName.includes('/')) {
      seenModels.add(modelName)
      
      models.push({
        name: modelName,
        description: `Official ${modelName} model from Ollama Library`,
        size: 'Unknown',
        tags: ['official', 'library'],
        official: true
      })
    }
  }
  
  return models.slice(0, 30) // 上位30モデル
}

// HTMLからモデルスラッグを抽出（GitHub Issue #7751の例を参考）
function extractModelSlugsFromHtml(html: string): string[] {
  // href="/library/[model-name]" パターンを抽出
  const pattern = /href="\/library\/([^"\/]+)"/g
  const slugs: string[] = []
  const seenSlugs = new Set<string>()
  
  let match
  while ((match = pattern.exec(html)) !== null) {
    const slug = match[1]
    if (!seenSlugs.has(slug) && slug && !slug.includes('/') && slug.length > 1) {
      seenSlugs.add(slug)
      slugs.push(slug)
    }
  }
  
  return slugs
}

// 個別モデルページのHTMLから詳細情報を抽出
function parseModelPageHtml(slug: string, html: string): OllamaModelInfo | null {
  try {
    // タイトル抽出
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const title = titleMatch ? titleMatch[1].trim() : slug
    
    // 説明抽出
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/)
    const description = descMatch ? descMatch[1] : `${title} model from Ollama`
    
    // タグ抽出（簡易版）
    const tagMatches = html.match(/data-tag="([^"]+)"/g) || []
    const tags = tagMatches.map(tag => tag.replace('data-tag="', '').replace('"', ''))
    
    // サイズ情報があれば抽出（パターンは推測）
    const sizeMatch = html.match(/(\d+\.?\d*\s*[KMGT]?B)/i)
    const size = sizeMatch ? sizeMatch[1] : 'Unknown'
    
    return {
      name: slug,
      description: description,
      size: size,
      tags: tags.length > 0 ? tags : ['official'],
      official: true
    }
  } catch (error) {
    return null
  }
}

// フォールバックモデル一覧（公式モデルリストを基に更新）
function getFallbackModels(): OllamaModelInfo[] {
  return [
    // Llama models
    {
      name: 'llama3.2',
      description: 'Meta\'s latest Llama model (3.2B parameters)',
      size: '2.0GB',
      tags: ['chat', 'general'],
      official: true
    },
    {
      name: 'llama3.2:1b',
      description: 'Llama 3.2 1B - Lightweight version',
      size: '1.3GB',
      tags: ['chat', 'lightweight'],
      official: true
    },
    {
      name: 'llama3.1',
      description: 'Meta Llama 3.1 (8B parameters)',
      size: '4.7GB',
      tags: ['chat', 'general'],
      official: true
    },
    {
      name: 'llama3.1:70b',
      description: 'Meta Llama 3.1 70B - High performance',
      size: '40GB',
      tags: ['chat', 'high-performance'],
      official: true
    },
    {
      name: 'llama3.3',
      description: 'Meta Llama 3.3 - Latest version',
      size: '4.9GB',
      tags: ['chat', 'latest'],
      official: true
    },
    
    // Code models
    {
      name: 'codellama',
      description: 'Code generation model based on Llama',
      size: '3.8GB',
      tags: ['code', 'programming'],
      official: true
    },
    {
      name: 'codegemma',
      description: 'Google\'s code-focused Gemma model',
      size: '5.0GB',
      tags: ['code', 'programming'],
      official: true
    },
    
    // Google models
    {
      name: 'gemma2',
      description: 'Google\'s Gemma 2 model',
      size: '5.4GB',
      tags: ['chat', 'general'],
      official: true
    },
    {
      name: 'gemma2:2b',
      description: 'Gemma 2 2B - Efficient version',
      size: '1.6GB',
      tags: ['chat', 'lightweight'],
      official: true
    },
    {
      name: 'gemma2:27b',
      description: 'Gemma 2 27B - High capacity version',
      size: '16GB',
      tags: ['chat', 'high-performance'],
      official: true
    },
    
    // Other popular models
    {
      name: 'mistral',
      description: 'Mistral 7B model',
      size: '4.1GB',
      tags: ['chat', 'general'],
      official: true
    },
    {
      name: 'mixtral',
      description: 'Mistral\'s Mixtral 8x7B MoE model',
      size: '26GB',
      tags: ['chat', 'mixture-of-experts'],
      official: true
    },
    {
      name: 'phi3',
      description: 'Microsoft Phi-3 model',
      size: '2.3GB',
      tags: ['chat', 'efficient'],
      official: true
    },
    {
      name: 'phi3.5',
      description: 'Microsoft Phi-3.5 model',
      size: '2.2GB',
      tags: ['chat', 'efficient', 'latest'],
      official: true
    },
    {
      name: 'qwen2',
      description: 'Alibaba Qwen2 model',
      size: '4.4GB',
      tags: ['chat', 'multilingual'],
      official: true
    },
    {
      name: 'qwen2.5',
      description: 'Alibaba Qwen2.5 - Latest version',
      size: '4.4GB',
      tags: ['chat', 'multilingual', 'latest'],
      official: true
    },
    
    // Specialized models
    {
      name: 'deepseek-coder',
      description: 'DeepSeek Coder - Advanced coding model',
      size: '6.4GB',
      tags: ['code', 'programming'],
      official: true
    },
    {
      name: 'dolphin-mixtral',
      description: 'Dolphin 2.7 Mixtral 8x7B',
      size: '26GB',
      tags: ['chat', 'uncensored'],
      official: true
    },
    {
      name: 'neural-chat',
      description: 'Intel Neural Chat 7B',
      size: '4.1GB',
      tags: ['chat', 'general'],
      official: true
    },
    {
      name: 'starling-lm',
      description: 'Starling LM 7B Alpha',
      size: '4.1GB',
      tags: ['chat', 'general'],
      official: true
    },
    {
      name: 'orca-mini',
      description: 'Orca Mini 3B/7B/13B/70B',
      size: '1.9GB',
      tags: ['chat', 'reasoning'],
      official: true
    },
    {
      name: 'vicuna',
      description: 'Vicuna 7B/13B/33B',
      size: '3.8GB',
      tags: ['chat', 'general'],
      official: true
    },
    {
      name: 'wizardcoder',
      description: 'WizardCoder - Code generation specialist',
      size: '4.1GB',
      tags: ['code', 'programming'],
      official: true
    },
    {
      name: 'llava',
      description: 'LLaVA - Large Language and Vision Assistant',
      size: '4.5GB',
      tags: ['multimodal', 'vision'],
      official: true
    }
  ]
}
