import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Calendar, ArrowRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { CheckIn } from '@/types/database';

export default async function CheckInsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_for', { ascending: false }) as { data: CheckIn[] | null };

  const pendingCheckIn = checkIns?.find((c) => c.status === 'scheduled' || c.status === 'pending');
  const completedCheckIns = checkIns?.filter((c) => c.status === 'completed');

  // Calculate streak
  let streak = 0;
  if (completedCheckIns) {
    for (const checkIn of completedCheckIns) {
      if (checkIn.status === 'completed') {
        streak++;
      } else {
        break;
      }
    }
  }

  const getMoodEmoji = (score: number | null) => {
    const emojis: Record<number, string> = {
      1: '\ud83d\ude2b',
      2: '\ud83d\ude1f',
      3: '\ud83d\ude10',
      4: '\ud83d\ude0a',
      5: '\ud83d\ude80',
    };
    return score ? emojis[score] : '\u2014';
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6" />
            Check-ins
          </h1>
          <p className="text-gray-600 mt-1">Weekly reflections on your progress</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-gray-900">
              {completedCheckIns?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-orange-600">
              {streak} {streak === 1 ? 'week' : 'weeks'}
            </p>
            <p className="text-sm text-gray-500">Current Streak</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 col-span-2">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-gray-900">
              {completedCheckIns && completedCheckIns.length > 0
                ? getMoodEmoji(
                    Math.round(
                      completedCheckIns.reduce((sum, c) => sum + (c.mood_score || 3), 0) /
                        completedCheckIns.length
                    )
                  )
                : '\u2014'}
            </p>
            <p className="text-sm text-gray-500">Average Mood</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Check-in */}
      {pendingCheckIn && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Time for your check-in!</h3>
                <p className="text-sm text-gray-600">
                  Scheduled for {format(new Date(pendingCheckIn.scheduled_for), 'EEEE, MMMM d')}
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/accountability/check-ins/${pendingCheckIn.id}`}>
                Complete Check-in
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Past Check-ins */}
      <Card>
        <CardHeader>
          <CardTitle>Past Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {completedCheckIns && completedCheckIns.length > 0 ? (
            <div className="space-y-4">
              {completedCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getMoodEmoji(checkIn.mood_score)}</div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Week of {format(new Date(checkIn.scheduled_for), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {checkIn.wins?.length || 0} wins, {checkIn.challenges?.length || 0}{' '}
                        challenges
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {formatDistanceToNow(new Date(checkIn.completed_at!), {
                        addSuffix: true,
                      })}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No completed check-ins yet. Complete your first check-in to start tracking
              progress.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
