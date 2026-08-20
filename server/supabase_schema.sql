-- ==============================================================================
-- PERSONA — AI Personality Intelligence Platform (PostgreSQL / Supabase Schema)
-- Production-Ready DDL with Tables, Constraints, RLS, Indexes, & Triggers
-- ==============================================================================

-- 1. ENUMS
CREATE TYPE user_role_enum AS ENUM ('user', 'premium', 'moderator', 'admin', 'super_admin');
CREATE TYPE question_category_enum AS ENUM (
  'cognitive', 'emotional', 'social', 'behavioral', 
  'motivation', 'lifestyle', 'relationships', 'intimacy', 'career'
);
CREATE TYPE notification_type_enum AS ENUM (
  'analysis_ready', 'retest_reminder', 'recommendation', 'badge_unlocked', 'system'
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
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

-- 11. INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_analysis_user_created ON analysis_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_progress_timeline ON user_progress(user_id, recorded_date);

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to read and update only their own profile
CREATE POLICY "Users can access own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own analysis" ON analysis_results
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reports" ON ai_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- PERSONA production additions: email/Auth identity and data previously kept in JSON.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_code VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_data JSONB;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL;
ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS ai_report JSONB;

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

CREATE TABLE IF NOT EXISTS goals (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

CREATE TABLE IF NOT EXISTS goal_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id VARCHAR(100) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goal_checkins_user ON goal_checkins(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS growth_challenges (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_growth_challenges_user ON growth_challenges(user_id, created_at DESC);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own chat history" ON chat_history;
CREATE POLICY "Users can access own chat history" ON chat_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can access own goals" ON goals;
CREATE POLICY "Users can access own goals" ON goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can access own goal checkins" ON goal_checkins;
CREATE POLICY "Users can access own goal checkins" ON goal_checkins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can access own challenges" ON growth_challenges;
CREATE POLICY "Users can access own challenges" ON growth_challenges FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can access own progress" ON user_progress;
CREATE POLICY "Users can access own progress" ON user_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can access own referrals" ON referrals;
CREATE POLICY "Users can access own referrals" ON referrals FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id) WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL;
