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
    // Check if the API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response('OpenRouter API key is not configured.', { status: 401 });
    }

    const { messages } = await req.json();

    const result = await streamText({
      // Use a model that is compatible with OpenRouter
      model: openrouter('mistralai/mistral-7b-instruct:free'),
      messages,
      // Define the system prompt for your AI assistant
      system: `You are TechBuddy, an expert AI technical assistant specializing in software development. Be helpful, provide clear code examples using markdown, and explain complex concepts simply.`,
    });

    // Respond with the stream using the corrected function name
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error in assistant API:', error);
    return new Response('An error occurred while processing your request.', { status: 500 });
  }
}