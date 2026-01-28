export type QuestionType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'currency'
  | 'scale'
  | 'yes-no';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface QuestionValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
}

export interface ConditionalDisplay {
  questionId: string;
  value: string | string[];
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  validation?: QuestionValidation;
  options?: QuestionOption[];
  conditionalDisplay?: ConditionalDisplay;
  aiContext?: string;
}

export interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
  questions: Question[];
  estimatedMinutes?: number;
}

export interface Questionnaire {
  id: string;
  title: string;
  description: string;
  steps: QuestionnaireStep[];
}

export type QuestionnaireResponses = Record<string, string | string[] | number | boolean | null>;
