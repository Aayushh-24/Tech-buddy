import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { question, documentId } = await req.json();

    // Database and context logic remains the same
    const chunks = await db.documentChunk.findMany({
        where: { documentId: documentId, content: { contains: question.split(' ')[0], mode: 'insensitive' } },
        take: 5,
    });

    if (chunks.length === 0) {
       return NextResponse.json({ error: "Could not find relevant info." }, { status: 404 });
    }

    const context = chunks.map(chunk => chunk.content).join('\n\n---\n\n');
    const systemPrompt = `You are an expert Q&A assistant... (rest of your prompt)`;
    const userPrompt = `CONTEXT:\n${context}\n\nQUESTION:\n${question}`;

    // --- NEW DIRECT API CALL LOGIC ---
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "model": "mistralai/mistral-7b-instruct:free",
        "messages": [
          { "role": "system", "content": systemPrompt },
          { "role": "user", "content": userPrompt }
        ],
        "stream": true
      })
    });

    // Return the streaming response directly
    return new Response(response.body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in /api/documents/ask:', error);
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
  }
}