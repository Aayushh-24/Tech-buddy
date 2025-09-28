/**
 * Client-safe API status service
 * This service only contains client-side safe code
 */

export interface ApiKeyStatus {
  hasKey: boolean
  isValid: boolean
  source: string
}

export class ApiStatusService {
  /**
   * Get API key status from server API
   */
  static async getApiKeyStatus(): Promise<ApiKeyStatus> {
    try {
      const response = await fetch('/api/settings/api-status')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error fetching API status:', error)
    }
    
    // Fallback status
    return {
      hasKey: false,
      isValid: false,
      source: 'Unknown'
    }
  }

  /**
   * Test API connection via server endpoint
   */
  static async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        return {
          success: true,
          message: 'API key is working perfectly!'
        }
      } else {
        return {
          success: false,
          message: result.error || 'API key test failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `API key test failed: ${error.message}`
      }
    }
  }
}