// Shared Gemini client — replaces Anthropic API for all AI generation routes.
// Free tier: 1,500 req/day, 1M tokens/min (gemini-2.0-flash).
// Get a free API key at: https://aistudio.google.com/apikey
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY ?? '';

export const genAI = new GoogleGenerativeAI(apiKey);

/** General text generation — returns plain string */
export async function geminiText(prompt: string, maxTokens = 800): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/** JSON generation — forces application/json MIME type, returns parsed object */
export async function geminiJSON<T = unknown>(prompt: string, maxTokens = 2048): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
  });
  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  return JSON.parse(raw) as T;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY;
}
