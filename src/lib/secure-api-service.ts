import { ApiKeyManager } from './api-key-manager'

/**
 * Secure API Service that uses stored API key
 */

export interface SecureApiConfig {
  model?: string
  temperature?: number
  maxTokens?: number
}

export class SecureApiService {
  private static instance: SecureApiService | null = null
  private zaiInstance: any = null

  private constructor() {}

  static getInstance(): SecureApiService {
    if (!SecureApiService.instance) {
      SecureApiService.instance = new SecureApiService()
    }
    return SecureApiService.instance
  }

  /**
   * Initialize ZAI with stored API key
   */
  async initialize(): Promise<boolean> {
    try {
      const apiKey = ApiKeyManager.getApiKey()
      if (!apiKey) {
        throw new Error('No API key found. Please add your API key in Settings.')
      }

      // Dynamically import ZAI to avoid client-side bundling issues
      const ZAI = await import('z-ai-web-dev-sdk')
      
      // Get the default export and create instance
      const ZAIDefault = ZAI.default || ZAI
      this.zaiInstance = await ZAIDefault.create({
        apiKey: apiKey
      })

      // Test the connection with a simple request
      await this.testConnection()
      
      ApiKeyManager.markAsValidated()
      return true
    } catch (error) {
      console.error('Failed to initialize API service:', error)
      ApiKeyManager.markAsInvalid()
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
    config: SecureApiConfig = {}
  ): Promise<string> {
    await this.ensureInitialized()

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
   * Generate image
   */
  async generateImage(
    prompt: string,
    size: string = '1024x1024'
  ): Promise<string> {
    await this.ensureInitialized()

    try {
      const response = await this.zaiInstance.images.generations.create({
        prompt,
        size
      })

      return response.data[0].base64
    } catch (error) {
      throw new Error(`Image generation failed: ${error.message}`)
    }
  }

  /**
   * Web search
   */
  async webSearch(query: string, num: number = 10): Promise<any[]> {
    await this.ensureInitialized()

    try {
      const searchResult = await this.zaiInstance.functions.invoke('web_search', {
        query,
        num
      })

      return searchResult
    } catch (error) {
      throw new Error(`Web search failed: ${error.message}`)
    }
  }

  /**
   * Ensure API service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.zaiInstance) {
      await this.initialize()
    }
  }

  /**
   * Check if API key is set and valid
   */
  static isApiKeyConfigured(): boolean {
    const status = ApiKeyManager.getApiKeyStatus()
    return status.hasKey && status.isValid
  }

  /**
   * Get API key status for UI display
   */
  static getApiKeyStatus() {
    return ApiKeyManager.getApiKeyStatus()
  }
}