import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversations = await db.conversation.findMany({
      where: { 
        documentId: params.id,
        userId: 'default-user' // TODO: Get from authentication
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Flatten all messages from all conversations
    const messages = conversations.flatMap(conversation => 
      conversation.messages.map(message => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt
      }))
    )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch messages' 
    }, { status: 500 })
  }
}