import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// IMPORTANT: Set the runtime to edge for best streaming performance
export const runtime = 'edge';

// Create an OpenAI API client that points to the OpenRouter API
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check for the API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { question, documentId } = await req.json();

    if (!question || !documentId) {
      return NextResponse.json({ error: 'Question and documentId are required' }, { status: 400 });
    }

    // --- This is the RAG (Retrieval-Augmented Generation) part ---

    // 1. Retrieve relevant document chunks from your database
    // Note: This is a simplified search. A production app would use vector similarity search.
    const chunks = await db.documentChunk.findMany({
      where: { 
        documentId: documentId,
        // A simple text search to find chunks containing the first word of the question
        content: {
          contains: question.split(' ')[0],
          mode: 'insensitive' // Case-insensitive search
        }
      },
      take: 5, // Get the top 5 most relevant chunks
    });

    if (chunks.length === 0) {
       // Use NextResponse for a proper JSON error response
       return NextResponse.json({ error: "I could not find any relevant information in the document to answer your question." }, { status: 404 });
    }

    // Combine the content of the retrieved chunks into a single context string
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