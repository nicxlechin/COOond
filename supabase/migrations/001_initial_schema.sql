-- COO on Demand Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE plan_type AS ENUM ('business_plan', 'gtm_plan', 'operations_manual', 'pnl_tracker');
CREATE TYPE plan_status AS ENUM ('draft', 'questionnaire_in_progress', 'generating', 'review', 'refining', 'finalized');
CREATE TYPE milestone_category AS ENUM ('revenue', 'product', 'marketing', 'operations', 'hiring', 'other');
CREATE TYPE milestone_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked', 'deferred');
CREATE TYPE check_in_status AS ENUM ('scheduled', 'pending', 'completed', 'skipped');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  industry TEXT,
  business_stage TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type plan_type NOT NULL,
  status plan_status DEFAULT 'draft',
  title TEXT,
  questionnaire_responses JSONB DEFAULT '{}',
  questionnaire_completed_at TIMESTAMPTZ,
  generated_content JSONB,
  generation_version INTEGER DEFAULT 0,
  finalized_content JSONB,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questionnaire progress tracking
CREATE TABLE public.questionnaire_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  step_data JSONB DEFAULT '{}',
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id)
);

-- Refinement requests
CREATE TABLE public.refinements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  section_key TEXT,
  user_feedback TEXT NOT NULL,
  previous_content TEXT,
  refined_content TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Milestones
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  category milestone_category DEFAULT 'other',
  priority INTEGER DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  status milestone_status DEFAULT 'not_started',
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-ins
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  wins TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',
  blockers TEXT[] DEFAULT '{}',
  next_week_priorities TEXT[] DEFAULT '{}',
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  notes TEXT,
  ai_insights JSONB,
  status check_in_status DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES public.check_ins(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'email',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_plans_user_id ON public.plans(user_id);
CREATE INDEX idx_plans_status ON public.plans(status);
CREATE INDEX idx_plans_type ON public.plans(plan_type);
CREATE INDEX idx_milestones_user_id ON public.milestones(user_id);
CREATE INDEX idx_milestones_plan_id ON public.milestones(plan_id);
CREATE INDEX idx_milestones_target_date ON public.milestones(target_date);
CREATE INDEX idx_milestones_status ON public.milestones(status);
CREATE INDEX idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX idx_check_ins_scheduled ON public.check_ins(scheduled_for);
CREATE INDEX idx_check_ins_status ON public.check_ins(status);
CREATE INDEX idx_reminders_scheduled ON public.reminders(scheduled_for, status);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refinements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for plans
CREATE POLICY "Users can view own plans" ON public.plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for questionnaire_progress
CREATE POLICY "Users can view own progress" ON public.questionnaire_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.plans WHERE plans.id = questionnaire_progress.plan_id AND plans.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own progress" ON public.questionnaire_progress
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.plans WHERE plans.id = questionnaire_progress.plan_id AND plans.user_id = auth.uid())
  );
CREATE POLICY "Users can update own progress" ON public.questionnaire_progress
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.plans WHERE plans.id = questionnaire_progress.plan_id AND plans.user_id = auth.uid())
  );

-- RLS Policies for refinements
CREATE POLICY "Users can view own refinements" ON public.refinements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.plans WHERE plans.id = refinements.plan_id AND plans.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own refinements" ON public.refinements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.plans WHERE plans.id = refinements.plan_id AND plans.user_id = auth.uid())
  );

-- RLS Policies for milestones
CREATE POLICY "Users can view own milestones" ON public.milestones
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON public.milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON public.milestones
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own milestones" ON public.milestones
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for check_ins
CREATE POLICY "Users can view own check_ins" ON public.check_ins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own check_ins" ON public.check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own check_ins" ON public.check_ins
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for reminders
CREATE POLICY "Users can view own reminders" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own reminders" ON public.reminders
  FOR ALL USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
