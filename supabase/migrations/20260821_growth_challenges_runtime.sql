-- PERSONA growth challenges runtime schema repair
--
-- Based strictly on the columns read/written by server/db.ts.
-- payload is NOT a backend requirement and is therefore NOT created.
-- If payload exists from an older migration, it is preserved and made nullable
-- because saveChallenge() does not include it in upserts.
--
-- Safe for an existing or new growth_challenges table.
-- No data is deleted.

DO $$
BEGIN
  IF to_regclass('public.growth_challenges') IS NULL THEN
    CREATE TABLE public.growth_challenges (
      id VARCHAR(100) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  END IF;
END
$$;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS dimension_key VARCHAR(100);

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS dimension_name_ar TEXT;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS dimension_name_en TEXT;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS dimension_score INTEGER;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS title_ar TEXT;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS title_en TEXT;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS description_ar TEXT;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS action_steps_ar TEXT[];

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS action_steps_en TEXT[];

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS scientific_rationale_ar TEXT;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS scientific_rationale_en TEXT;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS duration_hours INTEGER DEFAULT 24;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 50;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active';

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS user_reflection TEXT;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS ai_completion_feedback TEXT;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.growth_challenges
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- payload is legacy-only.
-- Do not create it. If an older schema already has it,
-- make it nullable because saveChallenge() does not provide it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'growth_challenges'
      AND column_name = 'payload'
  ) THEN
    EXECUTE
      'ALTER TABLE public.growth_challenges
       ALTER COLUMN payload DROP NOT NULL';
  END IF;
END
$$;

UPDATE public.growth_challenges
SET started_at = COALESCE(started_at, created_at),
    updated_at = COALESCE(updated_at, created_at),
    duration_hours = COALESCE(duration_hours, 24),
    xp_reward = COALESCE(xp_reward, 50),
    status = COALESCE(status, 'active')
WHERE started_at IS NULL
   OR updated_at IS NULL
   OR duration_hours IS NULL
   OR xp_reward IS NULL
   OR status IS NULL;

CREATE INDEX IF NOT EXISTS idx_growth_challenges_user
  ON public.growth_challenges(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_growth_challenges_user_started
  ON public.growth_challenges(user_id, started_at DESC);