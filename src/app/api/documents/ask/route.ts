import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // 1. Define common "stop words" to ignore in a search
    const stopWords = new Set(['what', 'is', 'a', 'an', 'the', 'in', 'of', 'for', 'how', 'to', 'and', 'with']);
    
    // 2. Create an array of important keywords from the user's question
    const keywords = question
      .toLowerCase()
      .split(/\s+/) // Split into words
      .filter(word => word.length > 2 && !stopWords.has(word)); // Ignore small words and stop words

    if (keywords.length === 0) {
        return NextResponse.json({ error: "Please ask a more specific question." }, { status: 400 });
    }

    // 3. Build a Prisma query that searches for chunks containing ANY of the important keywords
    const chunks = await db.documentChunk.findMany({
        where: {
            documentId: documentId,
            OR: keywords.map(keyword => ({
                content: {
                    contains: keyword,
                    mode: 'insensitive',
                }
            }))
        },
        take: 5, // Take the top 5 matching chunks
    });

    if (chunks.length === 0) {
       return NextResponse.json({ error: "I could not find any relevant information in the document to answer your question." }, { status: 404 });
    }

    const context = chunks.map(chunk => chunk.content).join('\n\n---\n\n');

    const systemPrompt = `You are an expert Q&A assistant. A user will provide you with context from a document and a question.
    Answer the user's question based *only* on the provided context.
    If the answer is not available in the context, clearly state that you could not find the answer in the provided document.
    Do not use any outside knowledge.`;
    
    const result = await streamText({
      model: openrouter('mistralai/mistral-7b-instruct:free'),
      system: systemPrompt,
      prompt: `CONTEXT:\n${context}\n\nQUESTION:\n${question}`
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error in /api/documents/ask:', error);
    return NextResponse.json({ error: 'An error occurred while generating the answer.' }, { status: 500 });
  }
}