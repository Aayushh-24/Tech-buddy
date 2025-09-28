import { NextRequest, NextResponse } from 'next/server'
import { UsageService } from '@/lib/usage-service'

export async function GET(request: NextRequest) {
  try {
    // In a real app, you would get the user ID from authentication
    // For now, we'll use a demo user ID
    const userId = 'demo-user-id'

    const usageStats = await UsageService.getUserUsage(userId)
    const usageLimits = UsageService.getUsageLimits(usageStats.subscriptionType)

    // Calculate remaining usage
    const remainingUsage = {
      documentsUploaded: Math.max(0, usageLimits.documentsUploaded - usageStats.documentsUploaded),
      questionsAsked: Math.max(0, usageLimits.questionsAsked - usageStats.questionsAsked),
      tokensUsed: Math.max(0, usageLimits.tokensUsed - usageStats.tokensUsed)
    }

    // Calculate usage percentages
    const usagePercentages = {
      documentsUploaded: Math.round((usageStats.documentsUploaded / usageLimits.documentsUploaded) * 100),
      questionsAsked: Math.round((usageStats.questionsAsked / usageLimits.questionsAsked) * 100),
      tokensUsed: Math.round((usageStats.tokensUsed / usageLimits.tokensUsed) * 100)
    }

    return NextResponse.json({
      usage: usageStats,
      limits: usageLimits,
      remaining: remainingUsage,
      percentages: usagePercentages
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    )
  }
}