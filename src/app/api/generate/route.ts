import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithClaude, parseJSONResponse } from '@/lib/ai/claude-client';
import {
  BUSINESS_PLAN_SYSTEM_PROMPT,
  buildBusinessPlanPrompt,
  mapResponsesToBusinessPlanContext,
} from '@/lib/ai/prompts/business-plan';
import {
  GTM_PLAN_SYSTEM_PROMPT,
  buildGTMPlanPrompt,
  mapResponsesToGTMContext,
} from '@/lib/ai/prompts/gtm-plan';
import type { QuestionnaireResponses } from '@/lib/questionnaires/types';
import type { Plan } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user owns this plan
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get plan data
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single() as { data: Plan | null; error: unknown };

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update status to generating
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('plans') as any)
      .update({ status: 'generating' })
      .eq('id', planId);

    const responses = plan.questionnaire_responses as QuestionnaireResponses;

    let systemPrompt: string;
    let userPrompt: string;

    if (plan.plan_type === 'business_plan') {
      const context = mapResponsesToBusinessPlanContext(responses);
      systemPrompt = BUSINESS_PLAN_SYSTEM_PROMPT;
      userPrompt = buildBusinessPlanPrompt(context);
    } else if (plan.plan_type === 'gtm_plan') {
      const context = mapResponsesToGTMContext(responses);
      systemPrompt = GTM_PLAN_SYSTEM_PROMPT;
      userPrompt = buildGTMPlanPrompt(context);
    } else {
      return NextResponse.json({ error: 'Unsupported plan type' }, { status: 400 });
    }

    // Generate the plan
    const rawResponse = await generateWithClaude(systemPrompt, userPrompt, {
      maxTokens: 8000,
      temperature: 0.7,
    });

    // Parse the JSON response
    const generatedContent = parseJSONResponse<Record<string, string>>(rawResponse);

    // Update plan with generated content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('plans') as any)
      .update({
        generated_content: generatedContent,
        status: 'review',
        generation_version: (plan.generation_version || 0) + 1,
        questionnaire_completed_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      planId,
      content: generatedContent,
    });
  } catch (error) {
    console.error('Generation error:', error);

    // Try to update status to reflect error
    try {
      const body = await request.clone().json();
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('plans') as any)
        .update({ status: 'questionnaire_in_progress' })
        .eq('id', body.planId);
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
