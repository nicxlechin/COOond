import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface GenerationResult {
  content: Record<string, string>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: options?.maxTokens ?? 8000,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in response');
  }

  return textContent.text;
}

export async function streamWithClaude(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  let fullText = '';

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: options?.maxTokens ?? 8000,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      fullText += event.delta.text;
      onChunk(event.delta.text);
    }
  }

  return fullText;
}

export function parseJSONResponse<T>(text: string): T {
  // Try to extract JSON from the response
  // Sometimes Claude wraps JSON in markdown code blocks
  let jsonStr = text;

  // Remove markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Try to find JSON object/array in the text
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);

  if (objectMatch) {
    jsonStr = objectMatch[0];
  } else if (arrayMatch) {
    jsonStr = arrayMatch[0];
  }

  return JSON.parse(jsonStr.trim()) as T;
}
