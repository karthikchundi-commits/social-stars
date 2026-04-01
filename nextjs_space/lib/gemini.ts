// Shared AI client using Groq (Llama 3.3 70B) — free tier: 14,400 req/day, 6,000 tokens/min.
// Get a free API key at: https://console.groq.com/keys
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });
const MODEL = 'llama-3.3-70b-versatile';

/** General text generation — returns plain string */
export async function geminiText(prompt: string, maxTokens = 800): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content?.trim() ?? '';
}

/** JSON generation — instructs model to return valid JSON, returns parsed object */
export async function geminiJSON<T = unknown>(prompt: string, maxTokens = 2048): Promise<T> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are a JSON API. Respond with ONLY valid JSON — no markdown, no code fences, no explanation.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });
  const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
  return JSON.parse(raw) as T;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}
