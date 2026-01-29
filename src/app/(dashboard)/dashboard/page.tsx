import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanJourney } from '@/components/plans/plan-journey';
import {
  FileText,
  Rocket,
  Target,
  CheckSquare,
  ArrowRight,
  Plus,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { Plan, Milestone, CheckIn, Profile } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single() as { data: Pick<Profile, 'full_name'> | null };

  // Get recent plans
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(3) as { data: Plan[] | null };

  // Get most recent business plan and GTM plan for journey tracking
  const { data: businessPlans } = await supabase
    .from('plans')
    .select('id, title, status')
    .eq('user_id', user.id)
    .eq('plan_type', 'business_plan')
    .order('updated_at', { ascending: false })
    .limit(1) as { data: Pick<Plan, 'id' | 'title' | 'status'>[] | null };

  const { data: gtmPlans } = await supabase
    .from('plans')
    .select('id, title, status')
    .eq('user_id', user.id)
    .eq('plan_type', 'gtm_plan')
    .order('updated_at', { ascending: false })
    .limit(1) as { data: Pick<Plan, 'id' | 'title' | 'status'>[] | null };

  const businessPlanStatus = businessPlans?.[0] ? {
    type: 'business_plan' as const,
    status: businessPlans[0].status === 'finalized' ? 'finalized' as const :
            businessPlans[0].status === 'draft' || businessPlans[0].status === 'questionnaire_in_progress' ? 'in_progress' as const : 'not_started' as const,
    planId: businessPlans[0].id,
    title: businessPlans[0].title,
  } : null;

  const gtmPlanStatus = gtmPlans?.[0] ? {
    type: 'gtm_plan' as const,
    status: gtmPlans[0].status === 'finalized' ? 'finalized' as const :
            gtmPlans[0].status === 'draft' || gtmPlans[0].status === 'questionnaire_in_progress' ? 'in_progress' as const : 'not_started' as const,
    planId: gtmPlans[0].id,
    title: gtmPlans[0].title,
  } : null;

  // Get upcoming milestones
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['not_started', 'in_progress'])
    .order('target_date', { ascending: true })
    .limit(5) as { data: Milestone[] | null };

  // Get next check-in
  const { data: nextCheckIn } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .single() as { data: CheckIn | null };

  const userName = profile?.full_name?.split(' ')[0] || 'there';
  const hasPlans = plans && plans.length > 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-600 mt-1">
          {hasPlans
            ? "Here's what's happening with your business"
            : "Let's get started on your business journey"}
        </p>
      </div>

      {/* Plan Journey */}
      <PlanJourney
        businessPlan={businessPlanStatus}
        gtmPlan={gtmPlanStatus}
        className="mb-8"
      />

      {!hasPlans ? (
        /* First-time user view */
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Business Plan</CardTitle>
              <CardDescription>
                Create a comprehensive business plan with market analysis, financial
                projections, and actionable milestones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Takes about 25 minutes</p>
              <Button asChild className="w-full">
                <Link href="/business-plan/new/1">
                  Start Business Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Go-to-Market Plan</CardTitle>
              <CardDescription>
                Create a launch strategy with positioning, channel recommendations,
                and a detailed timeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Takes about 20 minutes</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/gtm-plan/new/1">
                  Start GTM Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Returning user view */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Plans and Check-in */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Check-in */}
            {nextCheckIn && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <CheckSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Next Check-in</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(nextCheckIn.scheduled_for), 'EEEE, MMM d')}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/accountability/check-ins/${nextCheckIn.id}`}>
                      Complete Check-in
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Plans */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Plans</CardTitle>
                  <CardDescription>Continue where you left off</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/plans">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans?.map((plan) => (
                    <Link
                      key={plan.id}
                      href={
                        plan.status === 'questionnaire_in_progress' || plan.status === 'draft'
                          ? `/${plan.plan_type === 'business_plan' ? 'business-plan' : 'gtm-plan'}/new/1?planId=${plan.id}`
                          : `/plans/${plan.id}`
                      }
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                          {plan.plan_type === 'business_plan' ? (
                            <FileText className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Rocket className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {plan.title || (plan.plan_type === 'business_plan' ? 'Business Plan' : 'GTM Plan')}
                          </p>
                          <p className="text-sm text-gray-500">
                            Updated {formatDistanceToNow(new Date(plan.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={plan.status === 'finalized' ? 'default' : 'secondary'}
                      >
                        {plan.status === 'finalized'
                          ? 'Finalized'
                          : plan.status === 'review'
                          ? 'Ready for Review'
                          : 'In Progress'}
                      </Badge>
                    </Link>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/business-plan/new/1">
                      <Plus className="w-4 h-4 mr-2" />
                      Business Plan
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/gtm-plan/new/1">
                      <Plus className="w-4 h-4 mr-2" />
                      GTM Plan
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Milestones */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Milestones
                  </CardTitle>
                  <CardDescription>Upcoming deadlines</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/accountability/milestones">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {milestones && milestones.length > 0 ? (
                  <div className="space-y-3">
                    {milestones.map((milestone) => {
                      const dueDate = milestone.target_date
                        ? new Date(milestone.target_date)
                        : null;
                      const isOverdue = dueDate && dueDate < new Date();

                      return (
                        <div
                          key={milestone.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              isOverdue
                                ? 'bg-red-500'
                                : milestone.status === 'in_progress'
                                ? 'bg-yellow-500'
                                : 'bg-gray-300'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {milestone.title}
                            </p>
                            {dueDate && (
                              <p
                                className={`text-xs ${
                                  isOverdue ? 'text-red-600' : 'text-gray-500'
                                }`}
                              >
                                {isOverdue
                                  ? `Overdue by ${formatDistanceToNow(dueDate)}`
                                  : `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No milestones yet. Finalize a plan to create milestones.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
