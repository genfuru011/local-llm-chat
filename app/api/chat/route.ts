import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, endpoint, modelName } = await req.json()

    console.log("Request data:", { messages, endpoint, modelName })

    // Ollama設定
    const ollamaBaseURL = endpoint ? `${endpoint}` : "http://localhost:11434/v1"
    const modelId = modelName || "llama3.2"

    console.log("Ollama baseURL:", ollamaBaseURL, "Model:", modelId)

    // systemメッセージを追加
    const systemMessage = {
      role: "system",
      content: "あなたは親切で知識豊富なAIアシスタントです。日本語で自然に会話してください。"
    }
    const allMessages = [systemMessage, ...messages]

    // Ollama用のOpenAIプロバイダーを作成
    const llmProvider = createOpenAI({
      baseURL: ollamaBaseURL,
      apiKey: "dummy", // Ollamaは実際のAPIキーは不要だが、何か値が必要
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
      throw streamError
    }    } catch (error) {
    console.error("Chat API Error:", error)
    return new Response(
      JSON.stringify({
        error: "Ollamaとの接続に失敗しました。設定を確認してください。",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
