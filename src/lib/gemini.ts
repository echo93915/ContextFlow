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

export async function generateUrlTitle(url: string): Promise<string> {
  try {
    const prompt = `Given this URL: "${url}", generate a concise title of 3 words or less that describes what this URL likely contains. Only return the title words, nothing else.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const title = response.text().trim();
    
    // Ensure the title is 3 words or less
    const words = title.split(' ').slice(0, 3);
    return words.join(' ');
  } catch (error) {
    console.error('Error generating URL title:', error);
    // Fallback to extracting domain name
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      return domain.split('.')[0] || 'Web Document';
    } catch {
      return 'Web Document';
    }
  }
}
