import { NextRequest, NextResponse } from 'next/server'
import { RAGPipeline } from '@/lib/rag'

export async function GET(request: NextRequest) {
  try {
    // Check for required environment variables
    const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY
    const openRouterApiKey = process.env.OPENROUTER_API_KEY

    if (!huggingFaceApiKey || !openRouterApiKey) {
      return NextResponse.json({ 
        error: 'Required API keys are not configured' 
      }, { status: 500 })
    }

    // Initialize RAG pipeline
    const ragPipeline = new RAGPipeline({
      huggingFaceApiKey,
      openRouterApiKey
    })

    // Initialize the RAG system (load existing data)
    await ragPipeline.initialize()

    // Get system statistics
    const stats = await ragPipeline.getStats()

    return NextResponse.json({ 
      stats,
      ragEnabled: true,
      message: 'RAG system is operational'
    })

  } catch (error) {
    console.error('Error getting RAG stats:', error)
    return NextResponse.json({ 
      error: 'Failed to get RAG statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}