export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const apiKey = url.searchParams.get('apiKey') || process.env.OPENAI_API_KEY

    if (!apiKey) {
      return Response.json(
        {
          success: false,
          error: "OpenAI APIキーが設定されていません。",
        },
        { status: 400 },
      )
    }

    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // チャット対応モデル（ファインチューニングモデル含む）のフィルタリング
    const chatModels = data.data.filter((model: any) => 
      model.id.includes('gpt') || 
      model.id.includes('o1') ||
      model.id.includes('text-davinci') ||
      model.id.includes('claude') ||
      model.id.includes('nano') ||
      model.id.includes('mini') ||
      model.id.startsWith('ft:') // ファインチューニングモデル
    ).map((model: any) => ({
      id: model.id,
      name: model.id,
      description: model.id.startsWith('ft:') ? 
        `ファインチューニングモデル: ${model.id.split(':')[1] || model.id}` : 
        `OpenAI ${model.id}`,
      created: model.created,
      owned_by: model.owned_by,
      is_fine_tuned: model.id.startsWith('ft:'),
    }))

    return Response.json({
      success: true,
      models: chatModels,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "モデル取得エラー",
      },
      { status: 500 },
    )
  }
}
