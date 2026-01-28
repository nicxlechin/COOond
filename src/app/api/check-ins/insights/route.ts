import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithClaude, parseJSONResponse } from '@/lib/ai/claude-client';
import { CHECK_IN_INSIGHTS_PROMPT } from '@/lib/ai/prompts/refinement';

export async function POST(request: NextRequest) {
  try {
    const { wins, challenges, blockers, priorities, moodScore } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prompt = `
## This Week's Check-in

**Mood Score:** ${moodScore}/5

**Wins:**
${wins.map((w: string) => `- ${w}`).join('\n')}

**Challenges:**
${challenges.map((c: string) => `- ${c}`).join('\n')}

**Blockers:**
${blockers.length > 0 ? blockers.map((b: string) => `- ${b}`).join('\n') : 'None'}

**Next Week's Priorities:**
${priorities.map((p: string) => `- ${p}`).join('\n')}

Provide encouraging insights and actionable suggestions.
`;

    const rawResponse = await generateWithClaude(
      CHECK_IN_INSIGHTS_PROMPT,
      prompt,
      { maxTokens: 500, temperature: 0.7 }
    );

    const insights = parseJSONResponse(rawResponse);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Failed to generate insights:', error);
    // Return a default response if AI fails
    return NextResponse.json({
      insights: {
        encouragement: 'Great job completing your check-in! Consistent reflection is key to growth.',
        suggestions: ['Keep tracking your progress', 'Celebrate small wins'],
        potential_risks: [],
        celebration_worthy: false,
      },
    });
  }
}
