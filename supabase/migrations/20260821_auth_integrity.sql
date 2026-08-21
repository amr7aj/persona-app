-- PERSONA AUTH INTEGRITY
-- Safe UUID reconciliation for legacy public.users rows.
-- The old implementation attempted to update child FKs before the new parent
-- existed, which violates immediate PostgreSQL foreign-key constraints.
-- This version creates the new parent row first, repoints every FK, then removes
-- the old row, all inside the same transaction/function call.

CREATE OR REPLACE FUNCTION public.rekey_persona_user(
  p_old_id UUID,
  p_new_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fk RECORD;
BEGIN
  IF p_old_id IS NULL OR p_new_id IS NULL THEN
    RAISE EXCEPTION 'Both old and new user IDs are required';
  END IF;

  IF p_old_id = p_new_id THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_old_id) THEN
    RAISE EXCEPTION 'Legacy user % does not exist', p_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_new_id) THEN
    RAISE EXCEPTION 'Target user % already exists', p_new_id;
  END IF;

  -- Copy the complete current users row with only the primary key changed.
  -- jsonb_populate_record keeps this function compatible with the existing
  -- users columns without hard-coding the entire table definition.
  INSERT INTO public.users
  SELECT jsonb_populate_record(
    NULL::public.users,
    to_jsonb(u) || jsonb_build_object('id', p_new_id)
  )
  FROM public.users AS u
  WHERE u.id = p_old_id;

  -- Repair the users self-reference in the newly copied row.
  UPDATE public.users
  SET referred_by_id = p_new_id
  WHERE id = p_new_id
    AND referred_by_id = p_old_id;

  -- The new parent now exists, so all immediate FKs can safely be repointed.
  FOR fk IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      a.attname AS column_name
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_class ref_c ON ref_c.oid = con.confrelid
    JOIN pg_namespace ref_n ON ref_n.oid = ref_c.relnamespace
    JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS ck(attnum, ord) ON TRUE
    JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS fk2(attnum, ord)
      ON fk2.ord = ck.ord
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ck.attnum
    JOIN pg_attribute ref_a
      ON ref_a.attrelid = ref_c.oid AND ref_a.attnum = fk2.attnum
    WHERE con.contype = 'f'
      AND ref_n.nspname = 'public'
      AND ref_c.relname = 'users'
      AND ref_a.attname = 'id'
      AND n.nspname = 'public'
      AND c.relname <> 'users'
  LOOP
    EXECUTE format(
      'UPDATE %I.%I SET %I = $1 WHERE %I = $2',
      fk.schema_name,
      fk.table_name,
      fk.column_name,
      fk.column_name
    ) USING p_new_id, p_old_id;
  END LOOP;

  -- audit_logs may intentionally store user IDs as text rather than an FK.
  IF to_regclass('public.audit_logs') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'audit_logs'
         AND column_name = 'user_id'
         AND data_type = 'text'
     ) THEN
    UPDATE public.audit_logs
    SET user_id = p_new_id::text
    WHERE user_id = p_old_id::text;
  END IF;

  DELETE FROM public.users WHERE id = p_old_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to remove legacy user % after re-key', p_old_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rekey_persona_user(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rekey_persona_user(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.rekey_persona_user(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rekey_persona_user(UUID, UUID) TO service_role;
