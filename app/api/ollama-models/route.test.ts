import { GET } from './route'

// モック用
const mockRequest = (url: string) => ({ url } as any)

describe('GET /api/ollama-models', () => {
  it('should return a JSON response with models', async () => {
    const req = mockRequest('http://localhost:3000/api/ollama-models?endpoint=http://localhost:11434')
    const res = await GET(req)
    const json = await res.json()
    expect(json).toHaveProperty('success')
    expect(json).toHaveProperty('models')
    expect(Array.isArray(json.models)).toBe(true)
  })

  it('should handle error gracefully', async () => {
    const req = mockRequest('http://localhost:3000/api/ollama-models?endpoint=http://invalid-endpoint')
    const res = await GET(req)
    const json = await res.json()
    expect(json).toHaveProperty('success')
    // success: false or true depending on fallback, but must have models or error
    expect(json.models || json.error).toBeDefined()
  })
})
