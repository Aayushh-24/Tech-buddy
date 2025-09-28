import { NextRequest, NextResponse } from 'next/server'
import { UsageService } from '@/lib/usage-service'

export async function GET(request: NextRequest) {
  try {
    // Get limit from query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // In a real app, you would get the user ID from authentication
    const userId = 'demo-user-id'

    const history = await UsageService.getUsageHistory(userId, limit)

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching usage history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage history' },
      { status: 500 }
    )
  }
}