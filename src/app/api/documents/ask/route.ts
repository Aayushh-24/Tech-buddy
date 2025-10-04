import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// The 'runtime' export has been removed.

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

    const stopWords = new Set(['what', 'is', 'a', 'an', 'the', 'in', 'of', 'for', 'how', 'to', 'and', 'with']);
    const keywords = question.toLowerCase().split(/\s+/).filter((word: string) => word.length > 2 && !stopWords.has(word));

    if (keywords.length === 0) {
        return NextResponse.json({ error: "Please ask a more specific question." }, { status: 400 });
    }

    const chunks = await db.documentChunk.findMany({
        where: {
            documentId: documentId,
            OR: keywords.map((keyword: string) => ({
                content: {
                    contains: keyword,
                    mode: 'insensitive',
                }
            }))
        },
        take: 5,
    });

    if (chunks.length === 0) {
       return NextResponse.json({ error: "I could not find any relevant information in the document to answer your question." }, { status: 404 });
    }

    // --- THIS IS THE SMART FIX ---
    // Instead of complex imports, we define a simple local type for what we need.
    type Chunk = { content: string };
    const context = chunks.map((chunk: Chunk) => chunk.content).join('\n\n---\n\n');

    const systemPrompt = `You are an expert Q&A assistant... (rest of your prompt)`;
    
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