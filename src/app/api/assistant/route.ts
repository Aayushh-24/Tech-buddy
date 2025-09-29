import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// IMPORTANT: Set the runtime to edge for best streaming performance
export const runtime = 'edge';

// Create an OpenAI API client that points to the OpenRouter API
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response('OpenRouter API key is not configured.', { status: 401 });
    }

    // --- START OF FIX ---
    // Make the backend compatible with the frontend's request format
    const body = await req.json();
    let messages = body.messages;

    // If the frontend sends a single 'message' string, convert it to the required array format
    if (!messages && body.message) {
      messages = [{ role: 'user', content: body.message }];
    }

    // If there are still no messages, return an error
    if (!messages || messages.length === 0) {
      return new Response('Messages are required in the request body.', { status: 400 });
    }
    // --- END OF FIX ---

    const result = await streamText({
      model: openrouter('mistralai/mistral-7b-instruct:free'),
      messages, // Use the (potentially converted) messages array
      system: `You are TechBuddy, an expert AI technical assistant specializing in software development. Be helpful, provide clear code examples using markdown, and explain complex concepts simply.`,
    });

    // Respond with the stream using the corrected function name
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error in assistant API:', error);
    return new Response('An error occurred while processing your request.', { status: 500 });
  }
}