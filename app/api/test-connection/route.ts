export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json()

    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
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
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    return Response.json({
      success: true,
      message: `OpenAI API接続成功 - ${data.data?.length || 0}個のモデルが利用可能`,
      data,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "接続エラー",
      },
      { status: 500 },
    )
  }
}
