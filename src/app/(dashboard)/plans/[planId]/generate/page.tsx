'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ planId: string }>;
}

const GENERATION_STEPS = [
  { id: 'analyzing', label: 'Analyzing your responses', description: 'Understanding your business context...' },
  { id: 'researching', label: 'Researching your market', description: 'Gathering industry insights...' },
  { id: 'drafting', label: 'Drafting your plan', description: 'Creating comprehensive sections...' },
  { id: 'refining', label: 'Refining recommendations', description: 'Fine-tuning strategies...' },
  { id: 'finalizing', label: 'Finalizing your plan', description: 'Putting finishing touches...' },
];

export default function GeneratePlanPage({ params }: PageProps) {
  const { planId } = use(params);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePlan = async () => {
      // Simulate step progression
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < GENERATION_STEPS.length - 1) {
            setCompletedSteps((steps) => [...steps, GENERATION_STEPS[prev].id]);
            return prev + 1;
          }
          return prev;
        });
      }, 2000);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        });

        clearInterval(stepInterval);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to generate plan');
        }

        // Mark all steps complete
        setCompletedSteps(GENERATION_STEPS.map((s) => s.id));

        // Navigate to plan view after short delay
        setTimeout(() => {
          router.push(`/plans/${planId}`);
        }, 1000);
      } catch (err) {
        clearInterval(stepInterval);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    generatePlan();
  }, [planId, router]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Generation Failed</h1>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline"
        >
          Go back and try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Creating Your Plan</h1>
        <p className="text-gray-600 mt-2">
          This usually takes 1-2 minutes. Feel free to grab a coffee!
        </p>
      </div>

      <div className="space-y-4 text-left">
        {GENERATION_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = index === currentStep && !isCompleted;

          return (
            <div
              key={step.id}
              className={`
                flex items-start gap-4 p-4 rounded-lg transition-colors
                ${isCurrent ? 'bg-primary/5 border border-primary/20' : ''}
                ${isCompleted ? 'opacity-60' : ''}
              `}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div>
                <p className={`font-medium ${isCurrent ? 'text-primary' : 'text-gray-900'}`}>
                  {step.label}
                </p>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
