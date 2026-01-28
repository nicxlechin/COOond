import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: options?.maxTokens ?? 8000,
    temperature: options?.temperature ?? 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
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
  // Try to extract JSON from the response
  const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]) as T;
  }

  // Try to parse the whole response as JSON
  try {
    return JSON.parse(response) as T;
  } catch {
    // Try to find JSON object in the response
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }
    throw new Error('Could not parse JSON from response');
  }
}
