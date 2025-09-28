import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface SettingsRequest {
  name?: string
  email?: string
  openRouterApiKey?: string
  githubToken?: string
  notifications?: {
    email: boolean
    browser: boolean
    documentReady: boolean
    githubSync: boolean
  }
  preferences?: {
    theme: 'light' | 'dark' | 'auto'
    defaultTone: string
    defaultAudience: string
    autoSave: boolean
  }
}

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, get user ID from authentication
    const userId = 'default-user'

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Return user settings (mask sensitive data)
    return NextResponse.json({
      settings: {
        name: user.name,
        email: user.email,
        openRouterApiKey: user.openRouterApiKey ? '********' : '',
        githubToken: user.githubToken ? '********' : '',
        // In a real app, notifications and preferences would be stored in separate tables
        notifications: {
          email: true,
          browser: true,
          documentReady: true,
          githubSync: false
        },
        preferences: {
          theme: 'auto',
          defaultTone: 'professional',
          defaultAudience: 'developers',
          autoSave: true
        }
      }
    })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch settings' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: SettingsRequest = await request.json()
    const userId = 'default-user' // TODO: Get from authentication

    // Update user settings
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.openRouterApiKey !== undefined) updateData.openRouterApiKey = body.openRouterApiKey
    if (body.githubToken !== undefined) updateData.githubToken = body.githubToken

    const user = await db.user.update({
      where: { id: userId },
      data: updateData
    })

    // In a real implementation, you would also update notifications and preferences
    // in their respective database tables

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      user: {
        name: user.name,
        email: user.email,
        openRouterApiKey: user.openRouterApiKey ? '********' : '',
        githubToken: user.githubToken ? '********' : ''
      }
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ 
      error: 'Failed to update settings' 
    }, { status: 500 })
  }
}