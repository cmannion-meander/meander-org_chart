-- Stage 7: add pending approval role for self-signup users.

begin;

DO $$
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pending_approval';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

commit;
