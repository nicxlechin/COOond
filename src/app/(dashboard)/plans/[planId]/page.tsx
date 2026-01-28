import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlanViewer } from '@/components/plans/plan-viewer';
import { BUSINESS_PLAN_SECTIONS } from '@/lib/ai/prompts/business-plan';
import { GTM_PLAN_SECTIONS } from '@/lib/ai/prompts/gtm-plan';
import type { Plan } from '@/types/database';

interface PageProps {
  params: Promise<{ planId: string }>;
}

export default async function PlanViewPage({ params }: PageProps) {
  const { planId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: plan, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single() as { data: Plan | null; error: unknown };

  if (error || !plan) {
    notFound();
  }

  // If plan is still in questionnaire, redirect back
  if (plan.status === 'questionnaire_in_progress' || plan.status === 'draft') {
    const basePath = plan.plan_type === 'business_plan' ? '/business-plan' : '/gtm-plan';
    redirect(`${basePath}/new/1?planId=${planId}`);
  }

  // If plan is generating, redirect to generation page
  if (plan.status === 'generating') {
    redirect(`/plans/${planId}/generate`);
  }

  const sections = plan.plan_type === 'business_plan'
    ? BUSINESS_PLAN_SECTIONS
    : GTM_PLAN_SECTIONS;

  const content = (plan.finalized_content || plan.generated_content) as Record<string, string> | null;

  return (
    <PlanViewer
      planId={plan.id}
      planType={plan.plan_type}
      title={plan.title || `${plan.plan_type === 'business_plan' ? 'Business' : 'GTM'} Plan`}
      sections={sections}
      content={content || {}}
      status={plan.status}
      isFinalized={!!plan.finalized_at}
    />
  );
}
