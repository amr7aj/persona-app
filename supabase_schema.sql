-- =========================================================
-- PERSONA AI - COMPLETE SUPABASE POSTGRESQL SCHEMA (2026)
-- Run this script in your Supabase SQL Editor
-- =========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE,
    username VARCHAR(100),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    language VARCHAR(10) DEFAULT 'ar',
    role VARCHAR(30) DEFAULT 'user' CHECK (role IN ('user', 'premium', 'admin', 'super_admin')),
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    current_streak INT DEFAULT 1,
    last_active_date DATE DEFAULT CURRENT_DATE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    referral_code VARCHAR(50) UNIQUE,
    referred_by VARCHAR(50),
    custom_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PSYCHOLOGICAL ANALYSIS REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.analysis_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    archetype_id VARCHAR(50) NOT NULL,
    overall_score INT NOT NULL,
    domain_scores JSONB NOT NULL,
    scores JSONB NOT NULL,
    ai_report JSONB NOT NULL,
    archetype_data JSONB,
    answers_snapshot JSONB,
    completion_time_seconds INT DEFAULT 180,
    version VARCHAR(20) DEFAULT '2026.1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PERSONAL GOALS TABLE
CREATE TABLE IF NOT EXISTS public.personal_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    dimension_key VARCHAR(50) NOT NULL,
    dimension_name_ar VARCHAR(100) NOT NULL,
    dimension_name_en VARCHAR(100) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'psychological',
    frequency VARCHAR(30) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'biweekly')),
    target_count INT DEFAULT 1,
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    total_completions INT DEFAULT 0,
    last_check_in_date DATE,
    ai_prompt JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. GOAL CHECK-IN LOGS TABLE
CREATE TABLE IF NOT EXISTS public.goal_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES public.personal_goals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('completed', 'progressed', 'struggled')),
    reflection_note TEXT,
    ai_feedback TEXT,
    xp_awarded INT DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 24-HOUR GROWTH CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS public.growth_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    dimension_key VARCHAR(50) NOT NULL,
    dimension_name_ar VARCHAR(100) NOT NULL,
    dimension_name_en VARCHAR(100) NOT NULL,
    dimension_score INT NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    action_steps_ar JSONB NOT NULL,
    action_steps_en JSONB NOT NULL,
    scientific_rationale_ar TEXT,
    scientific_rationale_en TEXT,
    duration_hours INT DEFAULT 24,
    xp_reward INT DEFAULT 60,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    user_reflection TEXT,
    ai_completion_feedback TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(255),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'joined' CHECK (status IN ('joined', 'analyzed', 'rewarded')),
    xp_rewarded INT DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. SYSTEM AUDIT & ERROR LOGS TABLE
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) DEFAULT 'info',
    action VARCHAR(100) NOT NULL,
    user_id UUID,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON public.analysis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_goals_user_id ON public.personal_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_challenges_user_id ON public.growth_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_checkins_goal_id ON public.goal_checkins(goal_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- SAMPLE RLS POLICIES (Users read/write their own records, admins manage all)
CREATE POLICY "Users can access their own profile" 
ON public.users FOR ALL 
USING (true);

CREATE POLICY "Users can access their own reports" 
ON public.analysis_reports FOR ALL 
USING (true);

CREATE POLICY "Users can access their own goals" 
ON public.personal_goals FOR ALL 
USING (true);

CREATE POLICY "Users can access their own notifications" 
ON public.notifications FOR ALL 
USING (true);
