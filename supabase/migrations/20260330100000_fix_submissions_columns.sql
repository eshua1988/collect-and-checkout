-- Add missing created_at / updated_at columns to user_form_submissions
ALTER TABLE public.user_form_submissions
  ADD COLUMN IF NOT EXISTS created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint;

ALTER TABLE public.user_form_submissions
  ADD COLUMN IF NOT EXISTS updated_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint;
