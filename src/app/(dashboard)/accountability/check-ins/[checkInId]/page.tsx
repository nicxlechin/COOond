'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CheckIn } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ checkInId: string }>;
}

const MOOD_OPTIONS = [
  { value: 1, label: 'Struggling', emoji: '\ud83d\ude2b' },
  { value: 2, label: 'Concerned', emoji: '\ud83d\ude1f' },
  { value: 3, label: 'Okay', emoji: '\ud83d\ude10' },
  { value: 4, label: 'Good', emoji: '\ud83d\ude0a' },
  { value: 5, label: 'Great', emoji: '\ud83d\ude80' },
];

export default function CheckInPage({ params }: PageProps) {
  const { checkInId } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [aiInsights, setAiInsights] = useState<{
    encouragement: string;
    suggestions: string[];
    celebration_worthy: boolean;
  } | null>(null);

  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [wins, setWins] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState<string[]>(['']);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>(['', '', '']);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadCheckIn = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('check_ins')
        .select('*')
        .eq('id', checkInId)
        .single() as { data: CheckIn | null };

      if (data?.status === 'completed') {
        setIsComplete(true);
        setMoodScore(data.mood_score);
        setWins(data.wins || []);
        setChallenges(data.challenges || []);
        setBlockers(data.blockers || []);
        setPriorities(data.next_week_priorities || []);
        setNotes(data.notes || '');
        setAiInsights(data.ai_insights as typeof aiInsights);
      }
      setIsLoading(false);
    };

    loadCheckIn();
  }, [checkInId]);

  const addItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[]
  ) => {
    setter([...current, '']);
  };

  const removeItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[],
    index: number
  ) => {
    setter(current.filter((_, i) => i !== index));
  };

  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[],
    index: number,
    value: string
  ) => {
    const updated = [...current];
    updated[index] = value;
    setter(updated);
  };

  const handleSubmit = async () => {
    if (!moodScore) {
      toast.error('Please select how you are feeling');
      return;
    }

    const filteredWins = wins.filter((w) => w.trim());
    const filteredChallenges = challenges.filter((c) => c.trim());
    const filteredBlockers = blockers.filter((b) => b.trim());
    const filteredPriorities = priorities.filter((p) => p.trim());

    if (filteredWins.length === 0) {
      toast.error('Please add at least one win');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get AI insights
      const insightsResponse = await fetch('/api/check-ins/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wins: filteredWins,
          challenges: filteredChallenges,
          blockers: filteredBlockers,
          priorities: filteredPriorities,
          moodScore,
        }),
      });

      let insights = null;
      if (insightsResponse.ok) {
        const data = await insightsResponse.json();
        insights = data.insights;
      }

      // Save check-in
      const supabase = createClient();
      const updateData = {
        mood_score: moodScore,
        wins: filteredWins,
        challenges: filteredChallenges,
        blockers: filteredBlockers,
        next_week_priorities: filteredPriorities,
        notes: notes.trim() || null,
        ai_insights: insights,
        status: 'completed' as const,
        completed_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('check_ins') as any)
        .update(updateData)
        .eq('id', checkInId);

      if (error) throw error;

      setAiInsights(insights);
      setIsComplete(true);
      toast.success('Check-in complete!');
    } catch (error) {
      toast.error('Failed to save check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Check-in Complete!</h1>
        </div>

        {aiInsights && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{aiInsights.encouragement}</p>

              {aiInsights.suggestions && aiInsights.suggestions.length > 0 && (
                <div>
                  <p className="font-medium text-gray-900 mb-2">Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {aiInsights.suggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.celebration_worthy && (
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <span className="text-2xl">\ud83c\udf89</span>
                  <p className="font-medium text-yellow-800 mt-2">
                    This week deserves celebration!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Weekly Check-in</h1>
        <p className="text-gray-600 mt-2">Take a few minutes to reflect on your week</p>
      </div>

      <div className="space-y-8">
        {/* Mood */}
        <Card>
          <CardHeader>
            <CardTitle>How are you feeling about the business?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMoodScore(option.value)}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                    moodScore === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:bg-gray-50'
                  )}
                >
                  <span className="text-3xl mb-1">{option.emoji}</span>
                  <span className="text-xs text-gray-600">{option.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wins */}
        <Card>
          <CardHeader>
            <CardTitle>What went well this week?</CardTitle>
            <CardDescription>List your wins, no matter how small</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {wins.map((win, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={win}
                  onChange={(e) => updateItem(setWins, wins, index, e.target.value)}
                  placeholder="e.g., Finished the landing page"
                />
                {wins.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(setWins, wins, index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem(setWins, wins)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Win
            </Button>
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card>
          <CardHeader>
            <CardTitle>What was challenging?</CardTitle>
            <CardDescription>What obstacles did you face?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {challenges.map((challenge, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={challenge}
                  onChange={(e) =>
                    updateItem(setChallenges, challenges, index, e.target.value)
                  }
                  placeholder="e.g., Struggled with pricing decisions"
                />
                {challenges.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(setChallenges, challenges, index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem(setChallenges, challenges)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Challenge
            </Button>
          </CardContent>
        </Card>

        {/* Priorities */}
        <Card>
          <CardHeader>
            <CardTitle>Top 3 priorities for next week</CardTitle>
            <CardDescription>What will you focus on?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorities.map((priority, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="text-sm font-medium text-gray-500 w-6">
                  {index + 1}.
                </span>
                <Input
                  value={priority}
                  onChange={(e) =>
                    updateItem(setPriorities, priorities, index, e.target.value)
                  }
                  placeholder={`Priority ${index + 1}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Any other notes?</CardTitle>
            <CardDescription>Optional - anything else on your mind</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional thoughts..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Complete Check-in'
          )}
        </Button>
      </div>
    </div>
  );
}
