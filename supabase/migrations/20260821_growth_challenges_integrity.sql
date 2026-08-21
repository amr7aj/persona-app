-- PERSONA GROWTH CHALLENGES INTEGRITY
-- The original production migration created growth_challenges with only the
-- legacy payload columns. The application persists the normalized challenge
-- fields below, so existing installations must be brought to the same schema.

ALTER TABLE growth_challenges
  ADD COLUMN IF NOT EXISTS dimension_key VARCHAR(100),
  ADD COLUMN IF NOT EXISTS dimension_name_ar TEXT,
  ADD COLUMN IF NOT EXISTS dimension_name_en TEXT,
  ADD COLUMN IF NOT EXISTS dimension_score INTEGER,
  ADD COLUMN IF NOT EXISTS title_ar TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS action_steps_ar TEXT[],
  ADD COLUMN IF NOT EXISTS action_steps_en TEXT[],
  ADD COLUMN IF NOT EXISTS scientific_rationale_ar TEXT,
  ADD COLUMN IF NOT EXISTS scientific_rationale_en TEXT,
  ADD COLUMN IF NOT EXISTS duration_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS user_reflection TEXT,
  ADD COLUMN IF NOT EXISTS ai_completion_feedback TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE growth_challenges
SET
  started_at = COALESCE(started_at, created_at, NOW()),
  updated_at = COALESCE(updated_at, created_at, NOW()),
  status = COALESCE(status, 'active'),
  duration_hours = COALESCE(duration_hours, 24),
  xp_reward = COALESCE(xp_reward, 50)
WHERE TRUE;

ALTER TABLE growth_challenges
  ALTER COLUMN started_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_growth_challenges_user
  ON growth_challenges(user_id, created_at DESC);
