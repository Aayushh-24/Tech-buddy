import { NextRequest, NextResponse } from 'next/server'
import { ServerApiService } from '@/lib/server-api-service'

interface AssistantRequest {
  message: string
  context?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AssistantRequest = await request.json()
    const { message, context } = body

    if (!message) {
      return NextResponse.json({ 
        error: 'Message is required' 
      }, { status: 400 })
    }

    // Check if API key is configured
    if (!ServerApiService.isApiKeyAvailable()) {
      return NextResponse.json({ 
        error: 'API key not configured. Please add your OpenRouter API key in environment variables.' 
      }, { status: 401 })
    }

    // Initialize server API service
    const apiService = ServerApiService.getInstance()

    // Initialize the service (this will test the connection)
    try {
      await apiService.initialize()
    } catch (error) {
      return NextResponse.json({ 
        error: 'API key validation failed. Please check your API key configuration.' 
      }, { status: 401 })
    }

    // Build the system prompt for the technical assistant
    const systemPrompt = `You are TechBuddy, an AI technical assistant specializing in software development and technical documentation. Your expertise includes:

1. **Code Analysis & Review**: 
   - Provide constructive feedback on code quality
   - Suggest optimizations and best practices
   - Identify potential bugs and security issues
   - Recommend design patterns and architectural improvements

2. **Technical Documentation**:
   - Generate clear, comprehensive documentation
   - Create API references, tutorials, and guides
   - Explain complex technical concepts simply
   - Structure documentation for different audiences

3. **Debugging & Troubleshooting**:
   - Help diagnose and fix code issues
   - Provide step-by-step debugging guidance
   - Suggest testing strategies
   - Explain error messages and solutions

4. **Development Best Practices**:
   - Recommend appropriate technologies and frameworks
   - Suggest project structure and organization
   - Advise on scalability and performance
   - Share industry standards and patterns

5. **GitHub & Repository Management**:
   - Analyze repository structure and code quality
   - Suggest improvements to README and documentation
   - Recommend contribution guidelines
   - Help with project management

**Guidelines**:
- Be helpful, patient, and thorough
- Provide clear, actionable advice
- Include code examples when relevant
- Explain concepts at an appropriate level
- When possible, provide multiple approaches or solutions
- Acknowledge limitations and suggest alternatives
- Be encouraging and supportive

**Response Style**:
- Use markdown formatting for readability
- Structure responses with clear headings and bullet points
- Include code snippets in proper markdown code blocks
- Keep responses focused and relevant to the question
- Ask clarifying questions when needed`

    // Add context if provided
    let contextualPrompt = message
    if (context) {
      contextualPrompt = `\nContext: ${context}\n\nQuestion: ${message}`
    }

    // Generate the response using server API service
    const response = await apiService.createChatCompletion([
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: contextualPrompt
      }
    ], {
      maxTokens: 2000,
      temperature: 0.7
    })

    if (!response) {
      return NextResponse.json({ 
        error: 'Failed to generate response' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      response
    })

  } catch (error) {
    console.error('Error in assistant API:', error)
    
    // Handle specific API key errors
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      return NextResponse.json({ 
        error: 'API key error. Please check your API key in Settings.' 
      }, { status: 401 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to process request' 
    }, { status: 500 })
  }
}