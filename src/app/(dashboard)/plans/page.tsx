import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeletePlanButton } from '@/components/plans/delete-plan-button';
import {
  FileText,
  Rocket,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Plan } from '@/types/database';

export default async function PlansPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false }) as { data: Plan[] | null };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finalized':
        return <Badge>Finalized</Badge>;
      case 'review':
        return <Badge variant="secondary">Ready for Review</Badge>;
      case 'generating':
        return <Badge variant="outline">Generating...</Badge>;
      default:
        return <Badge variant="outline">In Progress</Badge>;
    }
  };

  const getPlanLink = (plan: NonNullable<typeof plans>[0]) => {
    if (plan.status === 'questionnaire_in_progress' || plan.status === 'draft') {
      const basePath = plan.plan_type === 'business_plan' ? '/business-plan' : '/gtm-plan';
      return `${basePath}/new/1?planId=${plan.id}`;
    }
    return `/plans/${plan.id}`;
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Plans</h1>
          <p className="text-gray-600 mt-1">
            View and manage all your business plans
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/gtm-plan/new/1">
              <Plus className="w-4 h-4 mr-2" />
              GTM Plan
            </Link>
          </Button>
          <Button asChild>
            <Link href="/business-plan/new/1">
              <Plus className="w-4 h-4 mr-2" />
              Business Plan
            </Link>
          </Button>
        </div>
      </div>

      {plans && plans.length > 0 ? (
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6">
                  <Link
                    href={getPlanLink(plan)}
                    className="flex items-center gap-4 flex-1"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100">
                      {plan.plan_type === 'business_plan' ? (
                        <FileText className="w-6 h-6 text-gray-600" />
                      ) : (
                        <Rocket className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">
                          {plan.title ||
                            (plan.plan_type === 'business_plan'
                              ? 'Business Plan'
                              : 'Go-to-Market Plan')}
                        </h3>
                        {getStatusBadge(plan.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {plan.plan_type === 'business_plan'
                          ? 'Business Plan'
                          : 'Go-to-Market Plan'}
                        {' | '}
                        Updated{' '}
                        {formatDistanceToNow(new Date(plan.updated_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <DeletePlanButton
                      planId={plan.id}
                      planTitle={plan.title || (plan.plan_type === 'business_plan' ? 'Business Plan' : 'Go-to-Market Plan')}
                    />
                    <Link href={getPlanLink(plan)}>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No plans yet
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Create your first business plan or go-to-market strategy to get
              started on your entrepreneurial journey.
            </p>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/gtm-plan/new/1">Start GTM Plan</Link>
              </Button>
              <Button asChild>
                <Link href="/business-plan/new/1">Start Business Plan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
