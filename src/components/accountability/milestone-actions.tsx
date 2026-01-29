'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  CheckCircle,
  Play,
  Pause,
  XCircle,
  Calendar,
  Loader2,
  Clock,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MilestoneActionsProps {
  milestoneId: string;
  currentStatus: string;
  targetDate?: string | null;
}

// Get the start of next quarter
function getNextQuarterStart(): Date {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Quarters start at months 0 (Jan), 3 (Apr), 6 (Jul), 9 (Oct)
  let nextQuarterMonth: number;
  let nextQuarterYear = currentYear;

  if (currentMonth < 3) {
    nextQuarterMonth = 3; // April
  } else if (currentMonth < 6) {
    nextQuarterMonth = 6; // July
  } else if (currentMonth < 9) {
    nextQuarterMonth = 9; // October
  } else {
    nextQuarterMonth = 0; // January next year
    nextQuarterYear = currentYear + 1;
  }

  return new Date(nextQuarterYear, nextQuarterMonth, 1);
}

export function MilestoneActions({
  milestoneId,
  currentStatus,
  targetDate,
}: MilestoneActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState(
    targetDate ? format(new Date(targetDate), 'yyyy-MM-dd') : ''
  );

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
          : `Status updated to ${newStatus.replace('_', ' ')}`
      );
      router.refresh();
    }
    setIsUpdating(false);
  };

  const deferToNextQuarter = async () => {
    setIsUpdating(true);
    const supabase = createClient();
    const nextQuarter = getNextQuarterStart();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('milestones') as any)
      .update({
        target_date: nextQuarter.toISOString(),
        status: 'not_started',
      })
      .eq('id', milestoneId);

    if (error) {
      toast.error('Failed to defer milestone');
    } else {
      toast.success(`Deferred to ${format(nextQuarter, 'MMMM yyyy')}`);
      router.refresh();
    }
    setIsUpdating(false);
  };

  const updateTargetDate = async () => {
    if (!newDate) return;

    setIsUpdating(true);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('milestones') as any)
      .update({ target_date: new Date(newDate).toISOString() })
      .eq('id', milestoneId);

    if (error) {
      toast.error('Failed to update date');
    } else {
      toast.success('Target date updated');
      setDateDialogOpen(false);
      router.refresh();
    }
    setIsUpdating(false);
  };

  const deleteMilestone = async () => {
    setIsUpdating(true);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('milestones') as any)
      .delete()
      .eq('id', milestoneId);

    if (error) {
      toast.error('Failed to delete milestone');
    } else {
      toast.success('Milestone deleted');
      setDeleteDialogOpen(false);
      router.refresh();
    }
    setIsUpdating(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MoreHorizontal className="w-4 h-4" />
            )}
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDateDialogOpen(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Change Due Date
          </DropdownMenuItem>
          {currentStatus !== 'completed' && (
            <DropdownMenuItem onClick={deferToNextQuarter}>
              <Clock className="w-4 h-4 mr-2" />
              Defer to Next Quarter
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Milestone
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date Dialog */}
      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Due Date</DialogTitle>
            <DialogDescription>
              Adjust the target date for this milestone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="target-date">New Target Date</Label>
            <Input
              id="target-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateTargetDate} disabled={!newDate || isUpdating}>
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The milestone will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMilestone}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
