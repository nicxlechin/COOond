'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CheckIn, Milestone, Plan } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, X, CheckCircle, Sparkles, Target, Lightbulb, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ checkInId: string }>;
}

type MilestoneWithPlan = Milestone & { plans: Pick<Plan, 'title' | 'plan_type'> | null };

const MOOD_OPTIONS = [
  { value: 1, label: 'Struggling', emoji: '😫' },
  { value: 2, label: 'Concerned', emoji: '😟' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '😊' },
  { value: 5, label: 'Great', emoji: '🚀' },
];

export default function CheckInPage({ params }: PageProps) {
  const { checkInId } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [aiInsights, setAiInsights] = useState<{
    encouragement: string;
    suggestions: string[];
    potential_risks: string[];
    celebration_worthy: boolean;
    suggested_milestones?: Array<{ title: string; description: string }>;
  } | null>(null);

  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [activeMilestones, setActiveMilestones] = useState<MilestoneWithPlan[]>([]);
  const [completedMilestoneIds, setCompletedMilestoneIds] = useState<string[]>([]);

  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [wins, setWins] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState<string[]>(['']);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>(['', '', '']);
  const [notes, setNotes] = useState('');
  const [journalDump, setJournalDump] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Load check-in
      const { data: checkInData } = await supabase
        .from('check_ins')
        .select('*')
        .eq('id', checkInId)
        .single() as { data: CheckIn | null };

      if (checkInData) {
        setCheckIn(checkInData);
        if (checkInData.status === 'completed') {
          setIsComplete(true);
          setMoodScore(checkInData.mood_score);
          setWins(checkInData.wins || []);
          setChallenges(checkInData.challenges || []);
          setBlockers(checkInData.blockers || []);
          setPriorities(checkInData.next_week_priorities || []);
          setNotes(checkInData.notes || '');
          setAiInsights(checkInData.ai_insights as typeof aiInsights);
        }
      }

      // Load user's active milestones
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: milestonesData } = await supabase
          .from('milestones')
          .select('*, plans(title, plan_type)')
          .eq('user_id', user.id)
          .in('status', ['not_started', 'in_progress'])
          .order('target_date', { ascending: true })
          .limit(10) as { data: MilestoneWithPlan[] | null };

        if (milestonesData) {
          setActiveMilestones(milestonesData);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [checkInId]);

  const toggleMilestoneComplete = (milestoneId: string) => {
    setCompletedMilestoneIds((prev) =>
      prev.includes(milestoneId)
        ? prev.filter((id) => id !== milestoneId)
        : [...prev, milestoneId]
    );
  };

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

  const generateSuggestionsFromJournal = async () => {
    if (!journalDump.trim()) {
      toast.error('Please write something in the journal first');
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const response = await fetch('/api/check-ins/analyze-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journalContent: journalDump }),
      });

      if (!response.ok) throw new Error('Failed to analyze journal');

      const data = await response.json();

      // Pre-fill some fields from the analysis
      if (data.extractedWins && data.extractedWins.length > 0) {
        setWins([...wins.filter((w) => w.trim()), ...data.extractedWins]);
      }
      if (data.extractedChallenges && data.extractedChallenges.length > 0) {
        setChallenges([...challenges.filter((c) => c.trim()), ...data.extractedChallenges]);
      }
      if (data.suggestedPriorities && data.suggestedPriorities.length > 0) {
        setPriorities(data.suggestedPriorities.slice(0, 3));
      }
      if (data.suggestedMilestones) {
        setAiInsights((prev) => ({
          ...prev,
          encouragement: prev?.encouragement || '',
          suggestions: prev?.suggestions || [],
          potential_risks: prev?.potential_risks || [],
          celebration_worthy: prev?.celebration_worthy || false,
          suggested_milestones: data.suggestedMilestones,
        }));
      }

      toast.success('Analysis complete! Review the extracted items below.');
    } catch (error) {
      toast.error('Failed to analyze journal');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const createMilestoneFromSuggestion = async (title: string, description: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Get a default plan (most recent)
    const { data: plans } = await supabase
      .from('plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'finalized')
      .order('finalized_at', { ascending: false })
      .limit(1) as { data: { id: string }[] | null };

    const planId = plans?.[0]?.id;

    if (!planId) {
      toast.error('Please finalize a plan first to create milestones');
      return;
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14); // 2 weeks from now

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('milestones') as any).insert({
      plan_id: planId,
      user_id: user.id,
      title,
      description,
      target_date: targetDate.toISOString(),
      category: 'other',
      priority: 2,
      status: 'not_started',
    });

    if (error) {
      toast.error('Failed to create milestone');
    } else {
      toast.success('Milestone created!');
      // Remove from suggestions
      setAiInsights((prev) => ({
        ...prev!,
        suggested_milestones: prev?.suggested_milestones?.filter((m) => m.title !== title),
      }));
    }
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
      const supabase = createClient();

      // Mark milestones as completed
      if (completedMilestoneIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('milestones') as any)
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .in('id', completedMilestoneIds);
      }

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
          completedMilestones: completedMilestoneIds.length,
        }),
      });

      let insights = null;
      if (insightsResponse.ok) {
        const data = await insightsResponse.json();
        insights = data.insights;
      }

      // Save check-in
      const allNotes = [notes, journalDump].filter((n) => n.trim()).join('\n\n---\n\n');
      const updateData = {
        mood_score: moodScore,
        wins: filteredWins,
        challenges: filteredChallenges,
        blockers: filteredBlockers,
        next_week_priorities: filteredPriorities,
        notes: allNotes || null,
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
          {completedMilestoneIds.length > 0 && (
            <p className="text-green-600 mt-2">
              You completed {completedMilestoneIds.length} milestone{completedMilestoneIds.length > 1 ? 's' : ''} this week!
            </p>
          )}
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

              {aiInsights.potential_risks && aiInsights.potential_risks.length > 0 && (
                <div>
                  <p className="font-medium text-gray-900 mb-2">Watch out for:</p>
                  <ul className="list-disc list-inside space-y-1 text-orange-600">
                    {aiInsights.potential_risks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.celebration_worthy && (
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <span className="text-2xl">🎉</span>
                  <p className="font-medium text-yellow-800 mt-2">
                    This week deserves celebration!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => router.push('/accountability/milestones')}>
            View Milestones
          </Button>
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
        {/* Journal Dump (optional, first for quick entry) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Quick Journal Dump (Optional)
            </CardTitle>
            <CardDescription>
              Write freely about your week. We'll help extract wins, challenges, and suggest action items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={journalDump}
              onChange={(e) => setJournalDump(e.target.value)}
              placeholder="Just write whatever comes to mind... What happened this week? What's on your mind? What are you thinking about for next week?"
              rows={6}
            />
            {journalDump.trim() && (
              <Button
                variant="outline"
                onClick={generateSuggestionsFromJournal}
                disabled={isGeneratingSuggestions}
              >
                {isGeneratingSuggestions ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze & Extract
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Suggested Milestones from Journal */}
        {aiInsights?.suggested_milestones && aiInsights.suggested_milestones.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5" />
                Suggested Action Items
              </CardTitle>
              <CardDescription>
                Based on your journal, here are some milestones you might want to track
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.suggested_milestones.map((milestone, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{milestone.title}</p>
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => createMilestoneFromSuggestion(milestone.title, milestone.description)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Milestone Progress */}
        {activeMilestones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Milestone Progress
              </CardTitle>
              <CardDescription>
                Did you complete any milestones this week? Check them off!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                    completedMilestoneIds.includes(milestone.id)
                      ? 'bg-green-50 border-green-200'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    checked={completedMilestoneIds.includes(milestone.id)}
                    onCheckedChange={() => toggleMilestoneComplete(milestone.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium text-gray-900',
                      completedMilestoneIds.includes(milestone.id) && 'line-through opacity-60'
                    )}>
                      {milestone.title}
                    </p>
                    {milestone.plans && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {milestone.plans.title || (milestone.plans.plan_type === 'business_plan' ? 'Business Plan' : 'GTM Plan')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
