import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { MilestoneActions } from '@/components/accountability/milestone-actions';
import type { Milestone } from '@/types/database';

type MilestoneWithPlan = Milestone & { plans: { title: string; plan_type: string } | null };

export default async function MilestonesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: milestones } = await supabase
    .from('milestones')
    .select('*, plans(title, plan_type)')
    .eq('user_id', user.id)
    .order('target_date', { ascending: true }) as { data: MilestoneWithPlan[] | null };

  const activeMilestones = milestones?.filter(
    (m) => m.status !== 'completed' && m.status !== 'deferred'
  );
  const completedMilestones = milestones?.filter((m) => m.status === 'completed');

  const getStatusColor = (status: string, targetDate: string | null) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'blocked') return 'bg-red-500';
    if (status === 'in_progress') return 'bg-yellow-500';
    if (targetDate && isPast(new Date(targetDate))) return 'bg-red-500';
    return 'bg-gray-300';
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      revenue: 'bg-green-100 text-green-800',
      product: 'bg-blue-100 text-blue-800',
      marketing: 'bg-purple-100 text-purple-800',
      operations: 'bg-gray-100 text-gray-800',
      hiring: 'bg-orange-100 text-orange-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6" />
            Milestones
          </h1>
          <p className="text-gray-600 mt-1">Track your business milestones and goals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-gray-900">
              {activeMilestones?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-600">
              {completedMilestones?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-red-600">
              {activeMilestones?.filter(
                (m) => m.target_date && isPast(new Date(m.target_date))
              ).length || 0}
            </p>
            <p className="text-sm text-gray-500">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-gray-900">
              {milestones?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Milestones */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Active Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {activeMilestones && activeMilestones.length > 0 ? (
            <div className="space-y-4">
              {activeMilestones.map((milestone) => {
                const isOverdue =
                  milestone.target_date && isPast(new Date(milestone.target_date));

                return (
                  <div
                    key={milestone.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 ${getStatusColor(
                        milestone.status,
                        milestone.target_date
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {milestone.title}
                          </h3>
                          {milestone.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {milestone.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <Badge
                              variant="secondary"
                              className={getCategoryBadge(milestone.category)}
                            >
                              {milestone.category}
                            </Badge>
                            {milestone.target_date && (
                              <span
                                className={`text-sm flex items-center gap-1 ${
                                  isOverdue ? 'text-red-600' : 'text-gray-500'
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                {isOverdue
                                  ? `Overdue by ${formatDistanceToNow(
                                      new Date(milestone.target_date)
                                    )}`
                                  : `Due ${format(
                                      new Date(milestone.target_date),
                                      'MMM d, yyyy'
                                    )}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <MilestoneActions
                          milestoneId={milestone.id}
                          currentStatus={milestone.status}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No active milestones. Finalize a plan to create milestones.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Completed Milestones */}
      {completedMilestones && completedMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-green-50"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-through opacity-60">
                      {milestone.title}
                    </p>
                    {milestone.completed_at && (
                      <p className="text-sm text-gray-500">
                        Completed{' '}
                        {formatDistanceToNow(new Date(milestone.completed_at), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
