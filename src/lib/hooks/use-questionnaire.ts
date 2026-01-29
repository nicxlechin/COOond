'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { businessPlanQuestionnaire } from '@/lib/questionnaires/business-plan';
import { gtmPlanQuestionnaire } from '@/lib/questionnaires/gtm-plan';
import type { Questionnaire, QuestionnaireResponses } from '@/lib/questionnaires/types';
import type { Plan } from '@/types/database';

const questionnaires: Record<string, Questionnaire> = {
  business_plan: businessPlanQuestionnaire,
  gtm_plan: gtmPlanQuestionnaire,
};

export function useQuestionnaire(planId: string, planType: 'business_plan' | 'gtm_plan') {
  const [answers, setAnswers] = useState<QuestionnaireResponses>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const questionnaire = questionnaires[planType];

  // Load existing answers
  useEffect(() => {
    const loadAnswers = async () => {
      setIsLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('plans')
        .select('questionnaire_responses')
        .eq('id', planId)
        .single() as { data: Pick<Plan, 'questionnaire_responses'> | null; error: { message: string } | null };

      if (error) {
        setError(error.message);
      } else if (data?.questionnaire_responses) {
        setAnswers(data.questionnaire_responses as QuestionnaireResponses);
      }
      setIsLoading(false);
    };

    if (planId) {
      loadAnswers();
    }
  }, [planId]);

  // Update a single answer
  const updateAnswer = useCallback((questionId: string, value: string | string[] | number | boolean | null) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  // Import multiple answers at once (e.g., from another plan)
  const importAnswers = useCallback((newAnswers: Partial<QuestionnaireResponses>) => {
    setAnswers((prev) => {
      const merged: QuestionnaireResponses = { ...prev };
      for (const [key, value] of Object.entries(newAnswers)) {
        if (value !== undefined) {
          merged[key] = value;
        }
      }
      return merged;
    });
  }, []);

  // Save progress to database
  const saveProgress = useCallback(async () => {
    setIsSaving(true);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('plans') as any)
      .update({
        questionnaire_responses: answers,
        status: 'questionnaire_in_progress',
      })
      .eq('id', planId);

    if (error) {
      setError(error.message);
    }
    setIsSaving(false);
  }, [answers, planId]);

  // Auto-save on answer change (debounced)
  useEffect(() => {
    if (Object.keys(answers).length === 0 || isLoading) return;

    const timeout = setTimeout(() => {
      saveProgress();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [answers, isLoading, saveProgress]);

  // Validate current step
  const validateStep = useCallback(
    (stepIndex: number) => {
      const step = questionnaire.steps[stepIndex];
      if (!step) return false;

      return step.questions.every((question) => {
        // Check conditional display
        if (question.conditionalDisplay) {
          const conditionValue = answers[question.conditionalDisplay.questionId];
          const shouldShow = Array.isArray(question.conditionalDisplay.value)
            ? question.conditionalDisplay.value.includes(conditionValue as string)
            : conditionValue === question.conditionalDisplay.value;

          if (!shouldShow) return true; // Skip validation if not shown
        }

        if (!question.required) return true;

        const value = answers[question.id];
        if (value === undefined || value === null || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;

        // Additional validation
        if (question.validation) {
          if (typeof value === 'string') {
            if (question.validation.minLength && value.length < question.validation.minLength) {
              return false;
            }
            if (question.validation.maxLength && value.length > question.validation.maxLength) {
              return false;
            }
          }
        }

        return true;
      });
    },
    [answers, questionnaire.steps]
  );

  return {
    questionnaire,
    answers,
    updateAnswer,
    importAnswers,
    saveProgress,
    validateStep,
    isSaving,
    isLoading,
    error,
  };
}
