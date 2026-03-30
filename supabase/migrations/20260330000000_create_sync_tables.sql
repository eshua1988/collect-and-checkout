-- =============================================
-- Cloud storage tables for cross-device sync
-- =============================================

-- Forms
CREATE TABLE IF NOT EXISTS public.user_forms (
  id          text        PRIMARY KEY,
  user_id     text        NOT NULL,
  data        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  bigint      NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at  bigint      NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- Form submissions
CREATE TABLE IF NOT EXISTS public.user_form_submissions (
  id          text        PRIMARY KEY,
  user_id     text        NOT NULL,
  form_id     text        NOT NULL,
  data        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  submitted_at bigint     NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- Websites
CREATE TABLE IF NOT EXISTS public.user_websites (
  id          text        PRIMARY KEY,
  user_id     text        NOT NULL,
  data        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  bigint      NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at  bigint      NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- Documents
CREATE TABLE IF NOT EXISTS public.user_docs (
  id          text        PRIMARY KEY,
  user_id     text        NOT NULL,
  data        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  bigint      NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at  bigint      NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- Projects (grouping entity)
CREATE TABLE IF NOT EXISTS public.user_projects (
  id          text        PRIMARY KEY,
  user_id     text        NOT NULL,
  data        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  bigint      NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at  bigint      NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- User bots (mirror of local bots for sync — the existing public.bots table is used by telegram-bot-handler)
CREATE TABLE IF NOT EXISTS public.user_bots (
  id          text        PRIMARY KEY,
  user_id     text        NOT NULL,
  data        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  bigint      NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at  bigint      NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_forms_user      ON public.user_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_user ON public.user_form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_form ON public.user_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_user_websites_user    ON public.user_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_docs_user        ON public.user_docs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user    ON public.user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bots_user        ON public.user_bots(user_id);

-- RLS
ALTER TABLE public.user_forms              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_form_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_websites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_docs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bots              ENABLE ROW LEVEL SECURITY;

-- Policies: users see only their own data
CREATE POLICY own_forms       ON public.user_forms              FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY own_submissions ON public.user_form_submissions   FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY own_websites    ON public.user_websites           FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY own_docs        ON public.user_docs               FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY own_projects    ON public.user_projects           FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY own_bots        ON public.user_bots               FOR ALL USING (auth.uid()::text = user_id);

-- Allow anonymous/public access for form submissions (public forms)
CREATE POLICY public_submit ON public.user_form_submissions FOR INSERT WITH CHECK (true);
