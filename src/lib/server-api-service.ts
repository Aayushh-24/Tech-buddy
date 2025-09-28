import ZAI from 'z-ai-web-dev-sdk'

/**
 * Server-side API service that uses environment variables for API keys
 */

export interface ServerApiConfig {
  model?: string
  temperature?: number
  maxTokens?: number
}

export class ServerApiService {
  private static instance: ServerApiService | null = null
  private zaiInstance: any = null

  private constructor() {}

  static getInstance(): ServerApiService {
    if (!ServerApiService.instance) {
      ServerApiService.instance = new ServerApiService()
    }
    return ServerApiService.instance
  }

  /**
   * Initialize ZAI with API key from environment variables
   */
  async initialize(): Promise<boolean> {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY

      if (!apiKey) {
        throw new Error('OpenRouter API key not found in environment variables. Please add OPENROUTER_API_KEY to your .env file.')
      }

      // Initialize ZAI with the API key
      const ZAIClass = ZAI.default || ZAI
      this.zaiInstance = await ZAIClass.create({
        apiKey: apiKey
      })

      // Test the connection with a simple request
      await this.testConnection()
      
      return true
    } catch (error) {
      console.error('Failed to initialize server API service:', error)
      throw error
    }
  }

  /**
   * Test API connection
   */
  private async testConnection(): Promise<void> {
    if (!this.zaiInstance) {
      throw new Error('API service not initialized')
    }

    try {
      // Simple test completion
      const completion = await this.zaiInstance.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 5
      })
      
      if (!completion.choices || !completion.choices[0]) {
        throw new Error('Invalid API response')
      }
    } catch (error) {
      throw new Error(`API connection test failed: ${error.message}`)
    }
  }

  /**
   * Create chat completion
   */
  async createChatCompletion(
    messages: Array<{ role: string; content: string }>,
    config: ServerApiConfig = {}
  ): Promise<string> {
    if (!this.zaiInstance) {
      throw new Error('API service not initialized')
    }

    try {
      const completion = await this.zaiInstance.chat.completions.create({
        messages,
        model: config.model || 'openai/gpt-3.5-turbo',
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000
      })

      return completion.choices[0]?.message?.content || 'No response generated'
    } catch (error) {
      throw new Error(`Chat completion failed: ${error.message}`)
    }
  }

  /**
   * Check if API key is available in environment variables
   */
  static isApiKeyAvailable(): boolean {
    return !!process.env.OPENROUTER_API_KEY
  }

  /**
   * Get the API key status for display purposes
   */
  static getApiKeyStatus(): { hasKey: boolean; isValid: boolean; source: string } {
    const hasKey = this.isApiKeyAvailable()
    
    return {
      hasKey,
      isValid: hasKey, // We'll validate when initializing
      source: hasKey ? 'Environment Variables' : 'Not Configured'
    }
  }
}