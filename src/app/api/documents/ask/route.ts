import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// The 'runtime' export has been removed to solve the size limit error.
// The function will now run as a standard Serverless Function with a 50 MB limit.

// Create an OpenAI API client that points to the OpenRouter API
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { question, documentId } = await req.json();

    if (!question || !documentId) {
      return NextResponse.json({ error: 'Question and documentId are required' }, { status: 400 });
    }

    // 1. Retrieve relevant document chunks from your database
    const chunks = await db.documentChunk.findMany({
      where: { 
        documentId: documentId,
        content: {
          contains: question.split(' ')[0],
          mode: 'insensitive'
        }
      },
      take: 5,
    });

    if (chunks.length === 0) {
       return NextResponse.json({ error: "I could not find any relevant information in the document to answer your question." }, { status: 404 });
    }

    const context = chunks.map(chunk => chunk.content).join('\n\n---\n\n');

    // 2. Augment the prompt with the retrieved context
    const systemPrompt = `You are an expert Q&A assistant. A user will provide you with context from a document and a question.
    Answer the user's question based *only* on the provided context.
    If the answer is not available in the context, clearly state that you could not find the answer in the provided document.
    Do not use any outside knowledge.`;
    
    const result = await streamText({
      model: openrouter('mistralai/mistral-7b-instruct:free'),
      system: systemPrompt,
      prompt: `CONTEXT:\n${context}\n\nQUESTION:\n${question}`
    });

    // 3. Stream the AI's response back to the client
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error in /api/documents/ask:', error);
    return NextResponse.json({ error: 'An error occurred while generating the answer.' }, { status: 500 });
  }
}