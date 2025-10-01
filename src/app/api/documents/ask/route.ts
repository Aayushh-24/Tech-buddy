import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'edge';

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
    const chunks = await db.documentChunk.findMany({
      where: { 
        documentId: documentId,
        content: { contains: question.split(' ')[0], mode: 'insensitive' }
      },
      take: 5,
    });
    if (chunks.length === 0) {
       return NextResponse.json({ error: "I could not find any relevant information..." }, { status: 404 });
    }
    const context = chunks.map(chunk => chunk.content).join('\n\n---\n\n');
    const systemPrompt = `You are an expert Q&A assistant... (rest of your prompt)`;
    const result = await streamText({
      model: openrouter('mistralai/mistral-7b-instruct:free'),
      system: systemPrompt,
      prompt: `CONTEXT:\n${context}\n\nQUESTION:\n${question}`
    });
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in /api/documents/ask:', error);
    return NextResponse.json({ error: 'An error occurred...' }, { status: 500 });
  }
}