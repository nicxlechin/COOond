import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithClaude, parseJSONResponse } from '@/lib/ai/claude-client';

const JOURNAL_ANALYSIS_PROMPT = `You are a helpful business coach analyzing a founder's journal entry.

Your job is to extract structured information from their free-form writing and suggest actionable milestones.

Given their journal entry, extract:
1. Wins: Things that went well or accomplishments
2. Challenges: Problems or obstacles they faced
3. Suggested priorities: What they should focus on next week
4. Suggested milestones: Specific, measurable actions they could track

Be specific and actionable. Don't just restate what they wrote - synthesize and suggest next steps.

Return a JSON object:
{
  "extractedWins": ["win1", "win2"],
  "extractedChallenges": ["challenge1", "challenge2"],
  "suggestedPriorities": ["priority1", "priority2", "priority3"],
  "suggestedMilestones": [
    { "title": "Action item title", "description": "Brief description of what to do" }
  ]
}

Only include items that are clearly present or implied in the text. Milestones should be forward-looking action items.`;

interface JournalAnalysis {
  extractedWins: string[];
  extractedChallenges: string[];
  suggestedPriorities: string[];
  suggestedMilestones: Array<{ title: string; description: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const { journalContent } = await request.json();

    if (!journalContent || typeof journalContent !== 'string') {
      return NextResponse.json(
        { error: 'Journal content is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPrompt = `Here is the founder's journal entry:

${journalContent}

Analyze this and extract wins, challenges, priorities, and suggest milestones.`;

    const rawResponse = await generateWithClaude(
      JOURNAL_ANALYSIS_PROMPT,
      userPrompt,
      { maxTokens: 1500, temperature: 0.5, jsonMode: true }
    );

    const analysis = parseJSONResponse<JournalAnalysis>(rawResponse);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Journal analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze journal' },
      { status: 500 }
    );
  }
}
