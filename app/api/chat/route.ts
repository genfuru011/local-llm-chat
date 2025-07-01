import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, modelName, apiKey } = await req.json()

    console.log("Request data:", { messages, modelName })

    // OpenAI設定
    const modelId = modelName || "gpt-3.5-turbo"
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI APIキーが設定されていません。",
          details: "環境変数OPENAI_API_KEYを設定するか、設定画面でAPIキーを入力してください。",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("Using OpenAI model:", modelId)

    // systemメッセージを追加
    const systemMessage = {
      role: "system",
      content: "あなたは親切で知識豊富なAIアシスタントです。日本語で自然に会話してください。"
    }
    const allMessages = [systemMessage, ...messages]

    // OpenAIプロバイダーを作成
    const llmProvider = createOpenAI({
      apiKey: openaiApiKey,
    })

    console.log("Starting streamText with model:", modelId)

    try {
      const result = await streamText({
        model: llmProvider(modelId),
        messages: allMessages,
        temperature: 0.7,
        maxTokens: 2000,
      })

      console.log("streamText completed, creating response")

      // Use the AI SDK's recommended response format
      return result.toDataStreamResponse()
    } catch (streamError) {
      console.error("streamText error:", streamError)
      
      // モデルが存在しない場合の特別なエラーハンドリング
      if (streamError instanceof Error && streamError.message.includes('model')) {
        const isFineTuned = modelId.startsWith('ft:')
        const errorMessage = isFineTuned 
          ? `ファインチューニングモデル "${modelId}" が見つかりません。`
          : `指定されたモデル "${modelId}" が見つかりません。`
        
        const suggestions = isFineTuned
          ? "ファインチューニングモデルのIDが正しいか確認してください。OpenAI Platform でモデル一覧を確認できます。"
          : "利用可能なモデルを確認するか、別のモデルを選択してください。GPT-4.1 nanoは現在OpenAI APIでは提供されていない可能性があります。"

        return new Response(
          JSON.stringify({
            error: errorMessage,
            details: suggestions,
            modelType: isFineTuned ? "fine-tuned" : "standard",
            availableModels: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini", "o1-preview", "o1-mini"]
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
      
      throw streamError
    }
  } catch (error) {
    console.error("Chat API Error:", error)
    return new Response(
      JSON.stringify({
        error: "OpenAI APIとの接続に失敗しました。設定を確認してください。",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
