'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StepIndicator } from './step-indicator';
import { QuestionRenderer } from './question-renderer';
import { ImportFromPlan } from './import-from-plan';
import { useQuestionnaire } from '@/lib/hooks/use-questionnaire';
import { createClient } from '@/lib/supabase/client';
import { mapBusinessPlanToGTM, getImportableFields } from '@/lib/questionnaires/import-mapper';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import type { PlanType, Plan } from '@/types/database';
import type { QuestionnaireResponses } from '@/lib/questionnaires/types';

interface QuestionnaireShellProps {
  planId: string;
  planType: PlanType;
  currentStep: number;
}

export function QuestionnaireShell({
  planId,
  planType,
  currentStep,
}: QuestionnaireShellProps) {
  const router = useRouter();
  const {
    questionnaire,
    answers,
    updateAnswer,
    importAnswers,
    saveProgress,
    validateStep,
    isSaving,
    isLoading,
  } = useQuestionnaire(planId, planType as 'business_plan' | 'gtm_plan');

  // State for import from business plan feature
  const [businessPlanData, setBusinessPlanData] = useState<{
    title: string;
    responses: QuestionnaireResponses;
  } | null>(null);
  const [showImportBanner, setShowImportBanner] = useState(false);
  const [importDismissed, setImportDismissed] = useState(false);

  // Check for existing business plan if this is a GTM plan
  useEffect(() => {
    const checkForBusinessPlan = async () => {
      if (planType !== 'gtm_plan' || currentStep !== 1 || importDismissed) return;

      const supabase = createClient();
      const { data: businessPlans } = await supabase
        .from('plans')
        .select('id, title, questionnaire_responses')
        .eq('plan_type', 'business_plan')
        .eq('status', 'finalized')
        .order('finalized_at', { ascending: false })
        .limit(1) as { data: Pick<Plan, 'id' | 'title' | 'questionnaire_responses'>[] | null };

      if (businessPlans && businessPlans.length > 0) {
        const bp = businessPlans[0];
        const responses = bp.questionnaire_responses as QuestionnaireResponses;
        if (responses && Object.keys(responses).length > 0) {
          setBusinessPlanData({
            title: bp.title || 'Business Plan',
            responses,
          });
          // Only show if we haven't already imported (check if answers are empty)
          if (Object.keys(answers).length === 0) {
            setShowImportBanner(true);
          }
        }
      }
    };

    if (!isLoading) {
      checkForBusinessPlan();
    }
  }, [planType, currentStep, isLoading, importDismissed, answers]);

  const handleImport = async () => {
    if (!businessPlanData) return;
    const mappedData = mapBusinessPlanToGTM(businessPlanData.responses);
    importAnswers(mappedData);
    setShowImportBanner(false);
    await saveProgress();
  };

  const handleDismissImport = () => {
    setShowImportBanner(false);
    setImportDismissed(true);
  };

  const step = questionnaire.steps[currentStep - 1];
  const progress = (currentStep / questionnaire.steps.length) * 100;
  const isValid = validateStep(currentStep - 1);
  const isLastStep = currentStep === questionnaire.steps.length;

  const basePath = planType === 'business_plan' ? '/business-plan' : '/gtm-plan';

  const handleNext = async () => {
    await saveProgress();

    if (isLastStep) {
      // Navigate to generation page
      router.push(`/plans/${planId}/generate`);
    } else {
      router.push(`${basePath}/new/${currentStep + 1}?planId=${planId}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      router.push(`${basePath}/new/${currentStep - 1}?planId=${planId}`);
    } else {
      router.push('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Import from Business Plan Banner */}
      {showImportBanner && businessPlanData && (
        <ImportFromPlan
          businessPlanTitle={businessPlanData.title}
          importableFields={getImportableFields(businessPlanData.responses)}
          onImport={handleImport}
          onDismiss={handleDismissImport}
        />
      )}

      {/* Progress bar */}
      <Progress value={progress} className="mb-8 h-2" />

      {/* Step indicator */}
      <StepIndicator
        steps={questionnaire.steps}
        currentStep={currentStep}
        className="mb-12"
      />

      {/* Step content */}
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{step.title}</h1>
          <p className="text-gray-600 mt-2">{step.description}</p>
          {step.estimatedMinutes && (
            <p className="text-sm text-gray-500 mt-1">
              About {step.estimatedMinutes} minutes
            </p>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {step.questions.map((question) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              value={answers[question.id]}
              onChange={(value) => updateAnswer(question.id, value)}
              allAnswers={answers}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-gray-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isValid || isSaving}
          className="min-w-[140px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isLastStep ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Plan
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Auto-save indicator */}
      {isSaving && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Saving your progress...
        </p>
      )}
    </div>
  );
}
