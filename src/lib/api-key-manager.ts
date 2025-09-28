/**
 * Secure API Key Management System
 * Stores and retrieves API keys from localStorage
 */

const API_KEY_STORAGE_KEY = 'techbuddy_openrouter_api_key'
const API_KEY_VALIDATED_KEY = 'techbuddy_api_key_validated'

export interface ApiKeyStatus {
  hasKey: boolean
  isValid: boolean
  lastValidated?: Date
}

export class ApiKeyManager {
  /**
   * Store API key securely in localStorage
   */
  static storeApiKey(apiKey: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey)
      // Reset validation status when key changes
      localStorage.removeItem(API_KEY_VALIDATED_KEY)
    }
  }

  /**
   * Retrieve API key from localStorage
   */
  static getApiKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE_KEY)
    }
    return null
  }

  /**
   * Remove API key from localStorage
   */
  static removeApiKey(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(API_KEY_STORAGE_KEY)
      localStorage.removeItem(API_KEY_VALIDATED_KEY)
    }
  }

  /**
   * Check if API key exists
   */
  static hasApiKey(): boolean {
    return this.getApiKey() !== null
  }

  /**
   * Get API key status
   */
  static getApiKeyStatus(): ApiKeyStatus {
    const hasKey = this.hasApiKey()
    const isValidated = localStorage.getItem(API_KEY_VALIDATED_KEY) === 'true'
    const lastValidatedStr = localStorage.getItem('techbuddy_last_validated')
    
    return {
      hasKey,
      isValid: hasKey && isValidated,
      lastValidated: lastValidatedStr ? new Date(lastValidatedStr) : undefined
    }
  }

  /**
   * Mark API key as validated
   */
  static markAsValidated(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_VALIDATED_KEY, 'true')
      localStorage.setItem('techbuddy_last_validated', new Date().toISOString())
    }
  }

  /**
   * Mark API key as invalid
   */
  static markAsInvalid(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_VALIDATED_KEY, 'false')
    }
  }

  /**
   * Validate API key format (basic validation)
   */
  static validateApiKeyFormat(apiKey: string): boolean {
    // OpenRouter API keys typically start with 'sk-or-v1-' followed by hex characters
    const openRouterPattern = /^sk-or-v1-[a-f0-9]+$/
    return openRouterPattern.test(apiKey.trim())
  }

  /**
   * Mask API key for display
   */
  static maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) return '********'
    const start = apiKey.substring(0, 8)
    const end = apiKey.substring(apiKey.length - 4)
    return `${start}...${end}`
  }
}