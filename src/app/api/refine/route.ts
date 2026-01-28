import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithClaude } from '@/lib/ai/claude-client';
import {
  REFINEMENT_SYSTEM_PROMPT,
  buildRefinementPrompt,
} from '@/lib/ai/prompts/refinement';
import type { Plan } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { planId, sectionKey, sectionTitle, currentContent, feedback } = await request.json();

    if (!planId || !sectionKey || !currentContent || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    // Create refinement record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: refinement, error: refinementError } = await (supabase.from('refinements') as any)
      .insert({
        plan_id: planId,
        section_key: sectionKey,
        user_feedback: feedback,
        previous_content: currentContent,
        status: 'processing',
      })
      .select('id')
      .single();

    if (refinementError) {
      throw refinementError;
    }

    // Update plan status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('plans') as any)
      .update({ status: 'refining' })
      .eq('id', planId);

    // Generate refined content
    const prompt = buildRefinementPrompt(
      sectionTitle || sectionKey,
      currentContent,
      feedback
    );

    const refinedContent = await generateWithClaude(
      REFINEMENT_SYSTEM_PROMPT,
      prompt,
      { maxTokens: 2000, temperature: 0.6 }
    );

    // Update refinement record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('refinements') as any)
      .update({
        refined_content: refinedContent,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', refinement?.id);

    // Update plan with new content
    const updatedContent = {
      ...(plan.generated_content as Record<string, string>),
      [sectionKey]: refinedContent,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('plans') as any)
      .update({
        generated_content: updatedContent,
        status: 'review',
      })
      .eq('id', planId);

    return NextResponse.json({
      success: true,
      refinedContent,
    });
  } catch (error) {
    console.error('Refinement error:', error);
    return NextResponse.json(
      { error: 'Failed to refine section' },
      { status: 500 }
    );
  }
}
