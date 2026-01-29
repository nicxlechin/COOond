'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

interface Plan {
  id: string;
  title: string | null;
  plan_type: string;
}

interface MilestoneFiltersProps {
  plans: Plan[];
  currentPlanId?: string;
}

export function MilestoneFilters({ plans, currentPlanId }: MilestoneFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePlanChange = (planId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (planId === 'all') {
      params.delete('plan');
    } else {
      params.set('plan', planId);
    }
    router.push(`/accountability/milestones?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/accountability/milestones');
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Filter className="w-4 h-4" />
        <span>Filter by:</span>
      </div>
      <Select value={currentPlanId || 'all'} onValueChange={handlePlanChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Plans" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Plans</SelectItem>
          {plans.map((plan) => (
            <SelectItem key={plan.id} value={plan.id}>
              {plan.title ||
                (plan.plan_type === 'business_plan' ? 'Business Plan' : 'GTM Plan')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentPlanId && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
