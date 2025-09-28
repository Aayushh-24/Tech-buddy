import { NextRequest, NextResponse } from 'next/server'
import { ServerApiService } from '@/lib/server-api-service'

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available in environment variables
    if (!ServerApiService.isApiKeyAvailable()) {
      return NextResponse.json({ 
        success: false,
        error: 'OpenRouter API key not configured in environment variables' 
      }, { status: 400 })
    }

    // Test the API connection
    const apiService = ServerApiService.getInstance()
    await apiService.initialize()

    return NextResponse.json({ 
      success: true,
      message: 'API key is valid and working'
    })

  } catch (error) {
    console.error('API key test error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to test API key' 
    }, { status: 500 })
  }
}