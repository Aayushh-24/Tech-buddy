import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

interface GenerateRequest {
  title: string
  docType: string
  tone: string
  audience: string
  additionalContext?: string
  codeContexts?: Array<{
    language: string
    framework: string
    description: string
    codeSnippet: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { title, docType, tone, audience, additionalContext, codeContexts } = body

    if (!title || !docType || !tone || !audience) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, docType, tone, audience' 
      }, { status: 400 })
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Build the prompt based on document type and parameters
    let systemPrompt = `You are a professional technical documentation writer. Generate a ${docType.replace('-', ' ')} document with the following specifications:

Title: ${title}
Tone: ${tone}
Target Audience: ${audience}
Document Type: ${docType.replace('-', ' ')}

Requirements:
- Write in a ${tone} tone
- Target the content for ${audience}
- Use proper markdown formatting
- Include relevant sections based on the document type
- Make it comprehensive yet concise
- Use clear, well-structured language`

    if (additionalContext) {
      systemPrompt += `\n\nAdditional Context:\n${additionalContext}`
    }

    if (codeContexts && codeContexts.length > 0) {
      systemPrompt += '\n\nCode Context:\n'
      codeContexts.forEach((context, index) => {
        systemPrompt += `\nCode Example ${index + 1}:\n`
        systemPrompt += `Language: ${context.language}\n`
        systemPrompt += `Framework: ${context.framework}\n`
        systemPrompt += `Description: ${context.description}\n`
        systemPrompt += `Code:\n\`\`\`${context.language}\n${context.codeSnippet}\n\`\`\`\n`
      })
    }

    // Add document type specific instructions
    switch (docType) {
      case 'api-reference':
        systemPrompt += `\n\nFor API Reference documentation, include:
- Overview and getting started
- Authentication
- Endoints with methods, parameters, and responses
- Error handling
- Code examples
- Rate limits`
        break
      case 'tutorial':
        systemPrompt += `\n\nFor Tutorial documentation, include:
- Introduction and prerequisites
- Step-by-step instructions
- Code examples with explanations
- Troubleshooting
- Next steps`
        break
      case 'guide':
        systemPrompt += `\n\nFor User Guide documentation, include:
- Product overview
- Key features and benefits
- Getting started
- How-to guides
- Best practices
- FAQ`
        break
      case 'readme':
        systemPrompt += `\n\nFor README documentation, include:
- Project description
- Installation instructions
- Usage examples
- Contributing guidelines
- License information
- Contact information`
        break
      case 'technical-spec':
        systemPrompt += `\n\nFor Technical Specification documentation, include:
- Overview and scope
- Architecture
- Data models
- API specifications
- Security considerations
- Performance requirements`
        break
    }

    // Generate the documentation
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Generate a comprehensive ${docType.replace('-', ' ')} document titled "${title}" for ${audience} with a ${tone} tone.`
        }
      ],
      max_tokens: 3000,
      temperature: 0.3
    })

    const generatedContent = completion.choices[0]?.message?.content || ''

    if (!generatedContent) {
      return NextResponse.json({ 
        error: 'Failed to generate content' 
      }, { status: 500 })
    }

    // Save to database
    const document = await db.generatedDocument.create({
      data: {
        title,
        content: generatedContent,
        docType,
        tone,
        audience,
        codeContext: codeContexts ? JSON.stringify(codeContexts) : null,
        userId: 'default-user' // TODO: Get from authentication
      }
    })

    return NextResponse.json({ 
      content: generatedContent,
      documentId: document.id
    })

  } catch (error) {
    console.error('Error generating documentation:', error)
    return NextResponse.json({ 
      error: 'Failed to generate documentation' 
    }, { status: 500 })
  }
}