'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, Play, Pause, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MilestoneActionsProps {
  milestoneId: string;
  currentStatus: string;
}

export function MilestoneActions({ milestoneId, currentStatus }: MilestoneActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    const supabase = createClient();

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('milestones') as any)
      .update(updateData)
      .eq('id', milestoneId);

    if (error) {
      toast.error('Failed to update milestone');
    } else {
      toast.success(
        newStatus === 'completed'
          ? 'Milestone completed!'
          : `Status updated to ${newStatus}`
      );
      router.refresh();
    }
    setIsUpdating(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isUpdating}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus !== 'completed' && (
          <DropdownMenuItem onClick={() => updateStatus('completed')}>
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            Mark Complete
          </DropdownMenuItem>
        )}
        {currentStatus !== 'in_progress' && currentStatus !== 'completed' && (
          <DropdownMenuItem onClick={() => updateStatus('in_progress')}>
            <Play className="w-4 h-4 mr-2 text-yellow-600" />
            Start Working
          </DropdownMenuItem>
        )}
        {currentStatus === 'in_progress' && (
          <DropdownMenuItem onClick={() => updateStatus('not_started')}>
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </DropdownMenuItem>
        )}
        {currentStatus !== 'blocked' && currentStatus !== 'completed' && (
          <DropdownMenuItem onClick={() => updateStatus('blocked')}>
            <XCircle className="w-4 h-4 mr-2 text-red-600" />
            Mark Blocked
          </DropdownMenuItem>
        )}
        {currentStatus !== 'deferred' && (
          <DropdownMenuItem onClick={() => updateStatus('deferred')}>
            Defer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
