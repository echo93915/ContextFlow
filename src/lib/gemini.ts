import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get model name from environment variables
const chatModel = process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash';

export const model = genAI.getGenerativeModel({ model: chatModel });

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function generateResponse(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response from Gemini API');
  }
}
