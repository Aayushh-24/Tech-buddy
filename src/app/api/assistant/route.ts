import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // --- NEW DIRECT API CALL LOGIC ---
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "model": "mistralai/mistral-7b-instruct:free",
        "messages": messages,
        "stream": true
      })
    });

    // Return the streaming response directly
    return new Response(response.body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in /api/assistant:', error);
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
  }
}