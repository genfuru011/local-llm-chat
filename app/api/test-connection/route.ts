export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json()

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    return Response.json({
      success: true,
      message: `接続成功 - ${Array.isArray(data.models) ? data.models.length : Object.keys(data).length}個のモデルが利用可能`,
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
