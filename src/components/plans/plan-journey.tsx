'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Rocket, ArrowRight, Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanStatus {
  type: 'business_plan' | 'gtm_plan';
  status: 'not_started' | 'in_progress' | 'finalized';
  planId?: string;
  title?: string;
}

interface PlanJourneyProps {
  businessPlan: PlanStatus | null;
  gtmPlan: PlanStatus | null;
  className?: string;
}

export function PlanJourney({ businessPlan, gtmPlan, className }: PlanJourneyProps) {
  const steps = [
    {
      number: 1,
      title: 'Business Plan',
      description: 'Define your business model, market, and financials',
      icon: FileText,
      status: businessPlan?.status || 'not_started',
      planId: businessPlan?.planId,
      planTitle: businessPlan?.title,
      href: businessPlan?.planId
        ? (businessPlan.status === 'finalized' ? `/plans/${businessPlan.planId}` : `/business-plan/new/1?planId=${businessPlan.planId}`)
        : '/business-plan/new/1',
      createHref: '/business-plan/new/1',
    },
    {
      number: 2,
      title: 'Go-to-Market Plan',
      description: 'Plan your launch strategy and marketing channels',
      icon: Rocket,
      status: gtmPlan?.status || 'not_started',
      planId: gtmPlan?.planId,
      planTitle: gtmPlan?.title,
      href: gtmPlan?.planId
        ? (gtmPlan.status === 'finalized' ? `/plans/${gtmPlan.planId}` : `/gtm-plan/new/1?planId=${gtmPlan.planId}`)
        : '/gtm-plan/new/1',
      createHref: '/gtm-plan/new/1',
      requiresPrevious: true,
    },
  ];

  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Your Planning Journey</h3>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'finalized';
            const isInProgress = step.status === 'in_progress';
            const isLocked = step.requiresPrevious && !businessPlan?.status;
            const previousCompleted = index === 0 || steps[index - 1].status === 'finalized';

            return (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-5 top-12 w-0.5 h-8 bg-gray-200" />
                )}

                <div
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border transition-colors',
                    isCompleted && 'bg-green-50 border-green-200',
                    isInProgress && 'bg-yellow-50 border-yellow-200',
                    isLocked && 'opacity-60'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full',
                      isCompleted && 'bg-green-500 text-white',
                      isInProgress && 'bg-yellow-500 text-white',
                      !isCompleted && !isInProgress && 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Step {step.number}</span>
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          Completed
                        </Badge>
                      )}
                      {isInProgress && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    {step.planTitle && (
                      <p className="text-sm text-gray-600">{step.planTitle}</p>
                    )}
                    {!step.planTitle && (
                      <p className="text-sm text-gray-500">{step.description}</p>
                    )}

                    <div className="mt-3">
                      {isCompleted ? (
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={step.href}>View Plan</Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={step.createHref}>Create New</Link>
                          </Button>
                        </div>
                      ) : isInProgress ? (
                        <Button asChild size="sm">
                          <Link href={step.href}>
                            Continue
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      ) : isLocked ? (
                        <p className="text-sm text-gray-500">
                          Complete Step 1 first to unlock
                        </p>
                      ) : (
                        <Button asChild size="sm" variant={previousCompleted ? 'default' : 'outline'}>
                          <Link href={step.href}>
                            Start
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
