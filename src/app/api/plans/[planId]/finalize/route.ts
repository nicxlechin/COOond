import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithClaude, parseJSONResponse } from '@/lib/ai/claude-client';
import { MILESTONE_EXTRACTION_PROMPT } from '@/lib/ai/prompts/refinement';
import type { MilestoneCategory, Plan } from '@/types/database';

interface ExtractedMilestone {
  title: string;
  description: string;
  target_date: string;
  category: MilestoneCategory;
  priority: 1 | 2 | 3;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    const supabase = await createClient();

    // Verify user owns this plan
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single() as { data: Plan | null; error: unknown };

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan.finalized_at) {
      return NextResponse.json({ error: 'Plan already finalized' }, { status: 400 });
    }

    const content = plan.generated_content as Record<string, string>;
    if (!content) {
      return NextResponse.json({ error: 'No content to finalize' }, { status: 400 });
    }

    // Extract milestones from the plan
    const milestonesSection = content.milestones_and_metrics || content.launch_timeline || '';
    const actionItems = content.immediate_action_items || content.quick_wins || '';

    const extractionPrompt = `
Extract milestones from this business plan:

## Milestones Section:
${milestonesSection}

## Action Items:
${actionItems}

Return a JSON array of 8-12 milestones with: title, description, target_date (ISO string, estimate relative to today), category (revenue|product|marketing|operations|hiring|other), priority (1=high, 2=medium, 3=low).
`;

    let milestones: ExtractedMilestone[] = [];

    try {
      const rawResponse = await generateWithClaude(
        MILESTONE_EXTRACTION_PROMPT,
        extractionPrompt,
        { maxTokens: 2000, temperature: 0.3 }
      );
      milestones = parseJSONResponse<ExtractedMilestone[]>(rawResponse);
    } catch (err) {
      console.error('Failed to extract milestones:', err);
      // Continue without milestones
    }

    // Update plan to finalized
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('plans') as any)
      .update({
        finalized_content: content,
        finalized_at: new Date().toISOString(),
        status: 'finalized',
      })
      .eq('id', planId);

    if (updateError) {
      throw updateError;
    }

    // Insert milestones
    if (milestones.length > 0) {
      const milestonesToInsert = milestones.map((m) => ({
        plan_id: planId,
        user_id: user.id,
        title: m.title,
        description: m.description,
        target_date: m.target_date,
        category: m.category,
        priority: m.priority,
        status: 'not_started' as const,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('milestones') as any).insert(milestonesToInsert);
    }

    // Schedule first check-in for next week
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    nextSunday.setHours(10, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('check_ins') as any).insert({
      user_id: user.id,
      plan_id: planId,
      scheduled_for: nextSunday.toISOString(),
      status: 'scheduled',
    });

    return NextResponse.json({
      success: true,
      milestonesCreated: milestones.length,
    });
  } catch (error) {
    console.error('Finalization error:', error);
    return NextResponse.json(
      { error: 'Failed to finalize plan' },
      { status: 500 }
    );
  }
}
