import { NextRequest, NextResponse } from 'next/server'
import { ServerApiService } from '@/lib/server-api-service'

export async function GET(request: NextRequest) {
  try {
    // Get API key status from server service
    const status = ServerApiService.getApiKeyStatus()
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting API status:', error)
    
    return NextResponse.json({ 
      hasKey: false,
      isValid: false,
      source: 'Error'
    })
  }
}