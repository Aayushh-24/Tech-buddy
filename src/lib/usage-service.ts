import { db } from '@/lib/db'

export interface UsageLimits {
  documentsUploaded: number
  questionsAsked: number
  tokensUsed: number
}

export interface UsageStats {
  documentsUploaded: number
  questionsAsked: number
  tokensUsed: number
  lastActiveAt?: Date
  subscriptionType: string
  subscriptionEnds?: Date
}

export class UsageService {
  /**
   * Get usage limits for a user based on subscription type
   */
  static getUsageLimits(subscriptionType: string): UsageLimits {
    const limits = {
      free: {
        documentsUploaded: 5,
        questionsAsked: 50,
        tokensUsed: 10000
      },
      premium: {
        documentsUploaded: 100,
        questionsAsked: 1000,
        tokensUsed: 100000
      }
    }

    return limits[subscriptionType as keyof typeof limits] || limits.free
  }

  /**
   * Get user's current usage statistics
   */
  static async getUserUsage(userId: string): Promise<UsageStats> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          documentsUploaded: true,
          questionsAsked: true,
          tokensUsed: true,
          lastActiveAt: true,
          subscriptionType: true,
          subscriptionEnds: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      return {
        documentsUploaded: user.documentsUploaded,
        questionsAsked: user.questionsAsked,
        tokensUsed: user.tokensUsed,
        lastActiveAt: user.lastActiveAt,
        subscriptionType: user.subscriptionType,
        subscriptionEnds: user.subscriptionEnds
      }
    } catch (error) {
      console.error('Error fetching user usage:', error)
      throw error
    }
  }

  /**
   * Check if user has reached their usage limits
   */
  static async checkUsageLimit(userId: string, action: 'document_upload' | 'question_asked' | 'tokens_used', quantity: number = 1): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          documentsUploaded: true,
          questionsAsked: true,
          tokensUsed: true,
          subscriptionType: true,
          subscriptionEnds: true
        }
      })

      if (!user) {
        return { allowed: false, reason: 'User not found' }
      }

      // Check if subscription has expired
      if (user.subscriptionEnds && user.subscriptionEnds < new Date()) {
        return { allowed: false, reason: 'Subscription has expired' }
      }

      const limits = this.getUsageLimits(user.subscriptionType)

      switch (action) {
        case 'document_upload':
          if (user.documentsUploaded + quantity > limits.documentsUploaded) {
            return { 
              allowed: false, 
              reason: `Document upload limit reached (${user.documentsUploaded}/${limits.documentsUploaded})` 
            }
          }
          break
        case 'question_asked':
          if (user.questionsAsked + quantity > limits.questionsAsked) {
            return { 
              allowed: false, 
              reason: `Question limit reached (${user.questionsAsked}/${limits.questionsAsked})` 
            }
          }
          break
        case 'tokens_used':
          if (user.tokensUsed + quantity > limits.tokensUsed) {
            return { 
              allowed: false, 
              reason: `Token limit reached (${user.tokensUsed}/${limits.tokensUsed})` 
            }
          }
          break
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking usage limit:', error)
      return { allowed: false, reason: 'Failed to check usage limit' }
    }
  }

  /**
   * Record usage and update user statistics
   */
  static async recordUsage(userId: string, action: 'document_upload' | 'question_asked' | 'tokens_used', quantity: number = 1, metadata?: any): Promise<void> {
    try {
      // Update user usage counters
      const updateData: any = {
        lastActiveAt: new Date()
      }

      switch (action) {
        case 'document_upload':
          updateData.documentsUploaded = {
            increment: quantity
          }
          break
        case 'question_asked':
          updateData.questionsAsked = {
            increment: quantity
          }
          break
        case 'tokens_used':
          updateData.tokensUsed = {
            increment: quantity
          }
          break
      }

      await db.user.update({
        where: { id: userId },
        data: updateData
      })

      // Log usage
      await db.usageLog.create({
        data: {
          userId,
          action,
          quantity,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      })
    } catch (error) {
      console.error('Error recording usage:', error)
      throw error
    }
  }

  /**
   * Get usage history for a user
   */
  static async getUsageHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const logs = await db.usageLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null
      }))
    } catch (error) {
      console.error('Error fetching usage history:', error)
      throw error
    }
  }

  /**
   * Reset usage counters (for admin use or subscription renewal)
   */
  static async resetUsage(userId: string): Promise<void> {
    try {
      await db.user.update({
        where: { id: userId },
        data: {
          documentsUploaded: 0,
          questionsAsked: 0,
          tokensUsed: 0,
          lastActiveAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error resetting usage:', error)
      throw error
    }
  }

  /**
   * Upgrade user to premium subscription
   */
  static async upgradeToPremium(userId: string, durationDays: number = 30): Promise<void> {
    try {
      const subscriptionEnds = new Date()
      subscriptionEnds.setDate(subscriptionEnds.getDate() + durationDays)

      await db.user.update({
        where: { id: userId },
        data: {
          subscriptionType: 'premium',
          subscriptionEnds
        }
      })
    } catch (error) {
      console.error('Error upgrading user to premium:', error)
      throw error
    }
  }
}