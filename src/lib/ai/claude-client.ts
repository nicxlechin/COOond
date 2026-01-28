import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

export async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: options?.maxTokens ?? 8000,
    temperature: options?.temperature ?? 0.7,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt + '\n\nYou MUST respond with valid JSON only. No markdown, no code blocks, just pure JSON.' },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in response');
  }

  return content;
}

export function parseJSONResponse<T>(response: string): T {
  // With JSON mode, the response should be clean JSON
  try {
    return JSON.parse(response) as T;
  } catch (e) {
    // Fallback: try to extract JSON
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as T;
      } catch {
        // Try cleaning control characters
        const cleaned = objectMatch[0]
          .replace(/[\x00-\x1F\x7F]/g, ' ')
          .replace(/\s+/g, ' ');
        return JSON.parse(cleaned) as T;
      }
    }
    console.error('Failed to parse JSON:', response.substring(0, 500));
    throw new Error('Could not parse JSON from response');
  }
}
