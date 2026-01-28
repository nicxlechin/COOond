import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { QuestionnaireShell } from '@/components/questionnaire/questionnaire-shell';
import { gtmPlanQuestionnaire } from '@/lib/questionnaires/gtm-plan';

interface PageProps {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ planId?: string }>;
}

export default async function GTMPlanStepPage({ params, searchParams }: PageProps) {
  const { step } = await params;
  const { planId } = await searchParams;
  const stepNumber = parseInt(step, 10);
  const totalSteps = gtmPlanQuestionnaire.steps.length;

  // Validate step number
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > totalSteps) {
    redirect('/gtm-plan/new/1');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let currentPlanId = planId;

  // If no planId, create a new plan
  if (!currentPlanId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newPlan, error } = await (supabase.from('plans') as any)
      .insert({
        user_id: user.id,
        plan_type: 'gtm_plan',
        status: 'questionnaire_in_progress',
        title: 'New Go-to-Market Plan',
      })
      .select('id')
      .single();

    if (error || !newPlan) {
      console.error('Failed to create plan:', error);
      redirect('/dashboard');
    }

    currentPlanId = newPlan.id;

    // Create questionnaire progress record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('questionnaire_progress') as any).insert({
      plan_id: currentPlanId,
      current_step: 1,
      total_steps: totalSteps,
    });

    // Redirect to include planId in URL
    redirect(`/gtm-plan/new/${step}?planId=${currentPlanId}`);
  }

  // Update questionnaire progress
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('questionnaire_progress') as any)
    .upsert({
      plan_id: currentPlanId,
      current_step: stepNumber,
      total_steps: totalSteps,
    }, { onConflict: 'plan_id' });

  return (
    <QuestionnaireShell
      planId={currentPlanId}
      planType="gtm_plan"
      currentStep={stepNumber}
    />
  );
}
