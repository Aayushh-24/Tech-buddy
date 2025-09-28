import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get or create default user
    let user = await db.user.findUnique({
      where: { id: 'default-user' }
    })
    
    if (!user) {
      user = await db.user.create({
        data: {
          id: 'default-user',
          email: 'default@example.com',
          name: 'Default User'
        }
      })
    }

    const documents = await db.document.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch documents' 
    }, { status: 500 })
  }
}