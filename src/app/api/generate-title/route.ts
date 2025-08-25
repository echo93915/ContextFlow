import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedLLM } from '@/lib/llm-unified';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Generate title using unified LLM interface
    const llm = getUnifiedLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      preferredProvider: 'auto'
    });
    
    const systemMessage = "You are a helpful assistant that generates concise, descriptive titles for web URLs. Generate a title that captures the main topic or purpose of the webpage.";
    const userMessage = `Generate a concise, descriptive title for this URL: ${url}
    
Please respond with only the title text, no quotes or additional formatting.`;
    
    const result = await llm.generateChatCompletion(systemMessage, userMessage);
    const title = result.response.trim();

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}
