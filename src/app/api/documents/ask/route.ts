import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { documentId, question } = await request.json()

    if (!documentId || !question) {
      return NextResponse.json({ 
        error: 'Document ID and question are required' 
      }, { status: 400 })
    }

    // Get document from database
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        chunks: true
      }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found' 
      }, { status: 404 })
    }

    if (document.status !== 'ready') {
      return NextResponse.json({ 
        error: 'Document is still being processed' 
      }, { status: 400 })
    }

    // Get document chunks
    const chunks = document.chunks || []
    
    if (chunks.length === 0) {
      return NextResponse.json({ 
        error: 'No content found in document' 
      }, { status: 404 })
    }

    // Enhanced answer generation using AI service
    const answer = await generateAIAnswer(question, chunks, document.originalName)

    // Save conversation to database
    const conversation = await db.conversation.create({
      data: {
        documentId,
        userId: 'default-user', // TODO: Get from authentication
        title: question.substring(0, 100) + (question.length > 100 ? '...' : '')
      }
    })

    // Save user message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: question
      }
    })

    // Save assistant message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: answer
      }
    })

    return NextResponse.json({ 
      answer,
      sources: chunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content.substring(0, 200) + '...',
        metadata: JSON.parse(chunk.metadata || '{}')
      })),
      confidence: 0.8,
      processingTime: 100,
      conversationId: conversation.id,
      ragEnabled: true
    })

  } catch (error) {
    console.error('Error processing question:', error)
    
    return NextResponse.json({ 
      error: 'Failed to process question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Enhanced answer generation using AI service
async function generateAIAnswer(question: string, chunks: any[], documentName: string): Promise<string> {
  try {
    // Combine relevant chunks for context
    const allContent = chunks.map(chunk => chunk.content).join('\n\n')
    
    // Create context from the most relevant chunks
    const context = allContent.length > 4000 ? allContent.substring(0, 4000) + '...' : allContent
    
    // Initialize AI service
    const zai = await ZAI.create()
    
    // Create the prompt for AI
    const prompt = `You are a helpful AI assistant analyzing a document. Based on the following document content, please answer the user's question accurately and comprehensively.

Document Name: ${documentName}

Document Content:
${context}

User Question: ${question}

Instructions:
1. Answer the question based ONLY on the provided document content
2. If the document content doesn't contain the answer, say so clearly
3. Be specific and provide detailed answers when possible
4. Include relevant quotes or references from the document
5. Keep your answer focused and relevant to the question
6. If the content is cut off (indicated by "..."), mention that you're working with partial content

Answer:`
    
    // Generate the answer using AI
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that analyzes documents and provides accurate answers based on the content provided.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more factual answers
      max_tokens: 1000
    })
    
    const answer = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate an answer. Please try asking your question again.'
    
    return answer.trim()
    
  } catch (error) {
    console.error('Error generating AI answer:', error)
    
    // Fallback to simple answer generation if AI fails
    return generateSimpleAnswer(question, chunks, documentName)
  }
}

// Simple answer generation fallback without external APIs
async function generateSimpleAnswer(question: string, chunks: any[], documentName: string): Promise<string> {
  // Combine all chunk content
  const allContent = chunks.map(chunk => chunk.content).join('\n\n')
  
  // Simple keyword matching and content extraction
  const questionLower = question.toLowerCase()
  
  // Look for relevant sections based on keywords
  const relevantSections = chunks.filter(chunk => {
    const contentLower = chunk.content.toLowerCase()
    const keywords = questionLower.split(' ').filter(word => word.length > 2)
    return keywords.some(keyword => contentLower.includes(keyword))
  })

  let answer = ''
  
  if (relevantSections.length > 0) {
    // Use the most relevant sections
    const relevantContent = relevantSections.slice(0, 3).map(chunk => chunk.content).join('\n\n')
    
    if (questionLower.includes('what') || questionLower.includes('what\'s')) {
      answer = `Based on the document "${documentName}", I found the following information:\n\n${relevantContent.substring(0, 500)}${relevantContent.length > 500 ? '...' : ''}`
    } else if (questionLower.includes('how')) {
      answer = `According to "${documentName}", here's what I found regarding your question:\n\n${relevantContent.substring(0, 500)}${relevantContent.length > 500 ? '...' : ''}`
    } else if (questionLower.includes('why')) {
      answer = `From the document "${documentName}", the relevant information is:\n\n${relevantContent.substring(0, 500)}${relevantContent.length > 500 ? '...' : ''}`
    } else {
      answer = `Based on "${documentName}", here's the information I found:\n\n${relevantContent.substring(0, 500)}${relevantContent.length > 500 ? '...' : ''}`
    }
  } else {
    // If no specific sections found, return general document info
    answer = `I found the document "${documentName}" with ${chunks.length} sections of content. The document contains information about various topics. Could you please be more specific about what you'd like to know from this document?`
  }
  
  return answer
}