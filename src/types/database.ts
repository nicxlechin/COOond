export type PlanType = 'business_plan' | 'gtm_plan' | 'operations_manual' | 'pnl_tracker';

export type PlanStatus =
  | 'draft'
  | 'questionnaire_in_progress'
  | 'generating'
  | 'review'
  | 'refining'
  | 'finalized';

export type MilestoneCategory =
  | 'revenue'
  | 'product'
  | 'marketing'
  | 'operations'
  | 'hiring'
  | 'other';

export type MilestoneStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'deferred';

export type CheckInStatus = 'scheduled' | 'pending' | 'completed' | 'skipped';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  industry: string | null;
  business_stage: string | null;
  timezone: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
  };
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: PlanStatus;
  title: string | null;
  questionnaire_responses: Record<string, unknown>;
  questionnaire_completed_at: string | null;
  generated_content: Record<string, string> | null;
  generation_version: number;
  finalized_content: Record<string, string> | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireProgress {
  id: string;
  plan_id: string;
  current_step: number;
  total_steps: number;
  step_data: Record<string, unknown>;
  last_active_at: string;
}

export interface Refinement {
  id: string;
  plan_id: string;
  section_key: string | null;
  user_feedback: string;
  previous_content: string | null;
  refined_content: string | null;
  status: 'pending' | 'processing' | 'completed';
  created_at: string;
  completed_at: string | null;
}

export interface Milestone {
  id: string;
  plan_id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  category: MilestoneCategory;
  priority: 1 | 2 | 3;
  status: MilestoneStatus;
  completion_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  plan_id: string | null;
  scheduled_for: string;
  completed_at: string | null;
  wins: string[];
  challenges: string[];
  blockers: string[];
  next_week_priorities: string[];
  mood_score: 1 | 2 | 3 | 4 | 5 | null;
  notes: string | null;
  ai_insights: {
    encouragement: string;
    suggestions: string[];
    potential_risks: string[];
    celebration_worthy: boolean;
  } | null;
  status: CheckInStatus;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  milestone_id: string | null;
  check_in_id: string | null;
  reminder_type: 'milestone_due' | 'milestone_overdue' | 'check_in_due' | 'plan_incomplete' | 'custom';
  message: string;
  scheduled_for: string;
  sent_at: string | null;
  channel: 'email' | 'push' | 'in_app';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  created_at: string;
}

// Database row types for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      plans: {
        Row: Plan;
        Insert: Omit<Plan, 'id' | 'created_at' | 'updated_at' | 'generation_version'> & { generation_version?: number };
        Update: Partial<Omit<Plan, 'id' | 'created_at'>>;
      };
      questionnaire_progress: {
        Row: QuestionnaireProgress;
        Insert: Omit<QuestionnaireProgress, 'id' | 'last_active_at'>;
        Update: Partial<Omit<QuestionnaireProgress, 'id'>>;
      };
      refinements: {
        Row: Refinement;
        Insert: Omit<Refinement, 'id' | 'created_at'>;
        Update: Partial<Omit<Refinement, 'id' | 'created_at'>>;
      };
      milestones: {
        Row: Milestone;
        Insert: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Milestone, 'id' | 'created_at'>>;
      };
      check_ins: {
        Row: CheckIn;
        Insert: Omit<CheckIn, 'id' | 'created_at'>;
        Update: Partial<Omit<CheckIn, 'id' | 'created_at'>>;
      };
      reminders: {
        Row: Reminder;
        Insert: Omit<Reminder, 'id' | 'created_at'>;
        Update: Partial<Omit<Reminder, 'id' | 'created_at'>>;
      };
    };
  };
}
