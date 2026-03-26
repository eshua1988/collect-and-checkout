-- Bots configuration table
CREATE TABLE IF NOT EXISTS public.bots (
  id         text        PRIMARY KEY,
  user_id    text,
  name       text        NOT NULL DEFAULT '',
  token      text        NOT NULL,
  nodes      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  edges      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bot conversation sessions (one row per bot+chat pair)
CREATE TABLE IF NOT EXISTS public.bot_sessions (
  bot_id          text    NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  chat_id         bigint  NOT NULL,
  current_node_id text,
  variables       jsonb   NOT NULL DEFAULT '{}'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bot_id, chat_id)
);

-- Row Level Security
ALTER TABLE public.bots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;

-- Users can manage only their own bots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bots' AND policyname = 'users_own_bots'
  ) THEN
    CREATE POLICY users_own_bots ON public.bots
      FOR ALL USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- bot_sessions: accessible only via service role (Edge Functions bypass RLS)
-- No public policy needed — service role key always bypasses RLS
