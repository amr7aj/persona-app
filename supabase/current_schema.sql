-- Canonical PERSONA schema.
-- This file mirrors ../supabase_schema.sql for tooling that expects a current_schema.sql path.

-- ==============================================================================
-- PERSONA — AI Personality Intelligence Platform (PostgreSQL / Supabase Schema)
-- Production-Ready DDL with Tables, Constraints, RLS, Indexes, & Compatibility Fields
-- ==============================================================================

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('user', 'premium', 'moderator', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE question_category_enum AS ENUM (
    'cognitive', 'emotional', 'social', 'behavioral',
    'motivation', 'lifestyle', 'relationships', 'intimacy', 'career'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM (
    'analysis_ready', 'retest_reminder', 'recommendation', 'badge_unlocked', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  username VARCHAR(100),
  photo_url TEXT,
  language VARCHAR(10) DEFAULT 'ar',
  role user_role_enum DEFAULT 'user',
  xp INTEGER DEFAULT 50,
  level INTEGER DEFAULT 1,
  badges TEXT[] DEFAULT ARRAY['explorer'],
  referral_code VARCHAR(30) UNIQUE NOT NULL,
  referred_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_count INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibility columns used by the current server data layer.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_code VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_settings JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_date DATE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL;

UPDATE users
SET avatar_url = COALESCE(avatar_url, photo_url),
    referred_by = COALESCE(referred_by, referred_by_id::text),
    updated_at = COALESCE(updated_at, last_login, created_at)
WHERE avatar_url IS NULL
   OR referred_by IS NULL
   OR updated_at IS NULL;

-- 3. USER PROFILES (Extended Onboarding Context)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age_bracket VARCHAR(20),
  gender VARCHAR(20),
  marital_status VARCHAR(30),
  career_field VARCHAR(100),
  lifestyle_type VARCHAR(50),
  goals TEXT[],
  sleep_hours VARCHAR(20),
  stress_level VARCHAR(30),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERSONALITY TYPES / ARCHETYPES
CREATE TABLE IF NOT EXISTS personality_types (
  id VARCHAR(50) PRIMARY KEY,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  tagline_ar TEXT NOT NULL,
  tagline_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  avatar_icon VARCHAR(50) NOT NULL,
  primary_color VARCHAR(20) NOT NULL,
  secondary_color VARCHAR(20) NOT NULL,
  strengths_ar TEXT[] NOT NULL,
  strengths_en TEXT[] NOT NULL,
  blind_spots_ar TEXT[] NOT NULL,
  blind_spots_en TEXT[] NOT NULL,
  relationships_ar TEXT,
  relationships_en TEXT,
  work_style_ar TEXT,
  work_style_en TEXT,
  stress_response_ar TEXT,
  stress_response_en TEXT,
  growth_advice_ar TEXT,
  growth_advice_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. QUESTIONS & OPTIONS
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(50) PRIMARY KEY,
  category question_category_enum NOT NULL,
  dimension VARCHAR(100) NOT NULL,
  dimension_ar VARCHAR(100) NOT NULL,
  dimension_en VARCHAR(100) NOT NULL,
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL,
  importance NUMERIC(3, 2) DEFAULT 1.0,
  reverse_score BOOLEAN DEFAULT FALSE,
  is_sensitive BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
  id VARCHAR(50) PRIMARY KEY,
  question_id VARCHAR(50) REFERENCES questions(id) ON DELETE CASCADE,
  label_ar TEXT NOT NULL,
  label_en TEXT NOT NULL,
  score_value INTEGER NOT NULL CHECK (score_value BETWEEN 1 AND 5),
  sort_order INTEGER DEFAULT 1
);

-- 6. ANALYSIS RESULTS & REPORTS
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  version VARCHAR(20) DEFAULT '2026.1',
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  archetype_id VARCHAR(50) REFERENCES personality_types(id),
  domain_scores JSONB NOT NULL,
  dimensional_scores JSONB NOT NULL,
  is_unlocked_premium BOOLEAN DEFAULT FALSE,
  completion_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS ai_report JSONB;

-- Compatibility report table retained because db.ts uses this table name.
CREATE TABLE IF NOT EXISTS analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version VARCHAR(20) DEFAULT '2026.1',
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  archetype_id VARCHAR(50) REFERENCES personality_types(id),
  domain_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_report JSONB,
  archetype_data JSONB,
  answers_snapshot JSONB,
  completion_time_seconds INTEGER DEFAULT 0,
  is_unlocked_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_result_id UUID UNIQUE REFERENCES analysis_results(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  executive_summary_ar TEXT NOT NULL,
  executive_summary_en TEXT NOT NULL,
  core_personality_ar TEXT NOT NULL,
  core_personality_en TEXT NOT NULL,
  strengths_ar TEXT[] NOT NULL,
  strengths_en TEXT[] NOT NULL,
  blind_spots_ar TEXT[] NOT NULL,
  blind_spots_en TEXT[] NOT NULL,
  emotional_pattern_ar TEXT,
  emotional_pattern_en TEXT,
  relationship_pattern_ar TEXT,
  relationship_pattern_en TEXT,
  work_pattern_ar TEXT,
  work_pattern_en TEXT,
  stress_pattern_ar TEXT,
  stress_pattern_en TEXT,
  lifestyle_pattern_ar TEXT,
  lifestyle_pattern_en TEXT,
  intimacy_pattern_ar TEXT,
  intimacy_pattern_en TEXT,
  growth_opportunities_ar TEXT[],
  growth_opportunities_en TEXT[],
  personalized_advice_ar TEXT[],
  personalized_advice_en TEXT[],
  final_profile_quote_ar TEXT,
  final_profile_quote_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. USER PROGRESS & GROWTH TIMELINE
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL,
  discipline_score INTEGER,
  emotional_awareness_score INTEGER,
  confidence_score INTEGER,
  communication_score INTEGER,
  stress_management_score INTEGER,
  overall_composite_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REFERRALS & GAMIFICATION
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  reward_xp INTEGER DEFAULT 100,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibility columns used by db.ts.
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_id UUID;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS xp_rewarded INTEGER;

UPDATE referrals
SET referred_id = COALESCE(referred_id, referred_user_id),
    xp_rewarded = COALESCE(xp_rewarded, reward_xp)
WHERE referred_id IS NULL OR xp_rewarded IS NULL;

CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type notification_type_enum DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- 10. AUDIT LOGS & AI TELEMETRY
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  details TEXT,
  status VARCHAR(20) DEFAULT 'success'
);

CREATE TABLE IF NOT EXISTS ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  model_name VARCHAR(50) NOT NULL,
  input_token_count INTEGER,
  output_token_count INTEGER,
  latency_ms INTEGER,
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level VARCHAR(20) DEFAULT 'info',
  action VARCHAR(100) NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CHAT HISTORY
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user','model')),
  text TEXT NOT NULL,
  suggested_questions TEXT[] DEFAULT ARRAY[]::TEXT[],
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_time ON chat_history(user_id, timestamp DESC);

-- 12. GOALS
CREATE TABLE IF NOT EXISTS goals (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- Compatibility table retained because db.ts uses this table name.
CREATE TABLE IF NOT EXISTS personal_goals (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dimension_key VARCHAR(100),
  dimension_name_ar VARCHAR(200),
  dimension_name_en VARCHAR(200),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'mindset',
  frequency VARCHAR(50) NOT NULL DEFAULT 'daily',
  target_count INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_streak INTEGER NOT NULL DEFAULT 0,
  total_completions INTEGER NOT NULL DEFAULT 0,
  last_check_in_date DATE,
  ai_prompt TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_personal_goals_user ON personal_goals(user_id);

-- 13. GOAL CHECK-INS
CREATE TABLE IF NOT EXISTS goal_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id VARCHAR(100) NOT NULL REFERENCES personal_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload JSONB,
  check_in_date DATE,
  status VARCHAR(30),
  reflection_note TEXT,
  ai_feedback TEXT,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goal_checkins_user ON goal_checkins(user_id, created_at DESC);

-- 14. GROWTH CHALLENGES
CREATE TABLE IF NOT EXISTS growth_challenges (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload JSONB,
  dimension_key VARCHAR(100),
  dimension_name_ar TEXT,
  dimension_name_en TEXT,
  dimension_score INTEGER,
  title_ar TEXT,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  action_steps_ar TEXT[],
  action_steps_en TEXT[],
  scientific_rationale_ar TEXT,
  scientific_rationale_en TEXT,
  duration_hours INTEGER DEFAULT 24,
  xp_reward INTEGER DEFAULT 50,
  status VARCHAR(30) DEFAULT 'active',
  user_reflection TEXT,
  ai_completion_feedback TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_growth_challenges_user ON growth_challenges(user_id, created_at DESC);

-- 15. INDEXES
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_analysis_user_created ON analysis_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_created ON analysis_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_timeline ON user_progress(user_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user_created ON xp_logs(user_id, created_at DESC);

-- 16. ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Remove legacy broad policies before creating least-privilege policies.
DROP POLICY IF EXISTS "Users can access own data" ON users;
DROP POLICY IF EXISTS "Users can view own analysis" ON analysis_results;
DROP POLICY IF EXISTS "Users can view own reports" ON ai_reports;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can access own chat history" ON chat_history;
DROP POLICY IF EXISTS "Users can access own goals" ON goals;
DROP POLICY IF EXISTS "Users can access own goal checkins" ON goal_checkins;
DROP POLICY IF EXISTS "Users can access own challenges" ON growth_challenges;
DROP POLICY IF EXISTS "Users can access own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can access own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can access own analysis reports" ON analysis_reports;
DROP POLICY IF EXISTS "Users can access own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can access own xp logs" ON xp_logs;
DROP POLICY IF EXISTS "Users can access own ai requests" ON ai_requests;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own analysis" ON analysis_results
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own analysis reports" ON analysis_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own reports" ON ai_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own progress" ON user_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id OR auth.uid() = referred_id);

CREATE POLICY "Users can read own chat history" ON chat_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own goals" ON goals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own personal goals" ON personal_goals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own goal checkins" ON goal_checkins
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own challenges" ON growth_challenges
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own xp logs" ON xp_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own ai requests" ON ai_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- audit_logs intentionally has no client policy: audit data is server-only.
-- All application writes use the Supabase service-role key, which bypasses RLS.
