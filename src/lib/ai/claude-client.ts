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

function sanitizeJSON(str: string): string {
  // Remove control characters that break JSON parsing
  return str
    .replace(/[\x00-\x1F\x7F]/g, (char) => {
      // Keep newlines and tabs as escaped versions
      if (char === '\n') return '\\n';
      if (char === '\r') return '\\r';
      if (char === '\t') return '\\t';
      return '';
    })
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

export function parseJSONResponse<T>(response: string): T {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  let jsonStr = jsonMatch ? jsonMatch[1] : response;

  // Try to find JSON object in the response
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  // Clean up the JSON string
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Try sanitizing and parsing again
    try {
      // Replace actual newlines inside strings with escaped versions
      const sanitized = jsonStr
        .replace(/:\s*"([^"]*)"/g, (match, content) => {
          const escaped = content
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          return `: "${escaped}"`;
        });
      return JSON.parse(sanitized) as T;
    } catch {
      // Last resort: try to build a valid JSON from key-value pairs
      try {
        const fixedJson = jsonStr
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
          .replace(/:\s*'([^']*)'/g, ': "$1"')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        return JSON.parse(fixedJson) as T;
      } catch (finalError) {
        console.error('Failed to parse JSON:', jsonStr.substring(0, 500));
        throw new Error('Could not parse JSON from response');
      }
    }
  }
}
