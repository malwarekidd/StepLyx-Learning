CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Şagird',
  avatar_url text,
  active_curriculum_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.learner_stats (
  user_id uuid PRIMARY KEY,
  xp integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  answered_count integer NOT NULL DEFAULT 0,
  lessons_completed integer NOT NULL DEFAULT 0,
  streak_current integer NOT NULL DEFAULT 0,
  streak_best integer NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learner_stats TO authenticated;
GRANT ALL ON public.learner_stats TO service_role;
ALTER TABLE public.learner_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own stats read" ON public.learner_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.curricula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  source_file text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX curricula_owner_idx ON public.curricula(owner_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.curricula TO authenticated;
GRANT ALL ON public.curricula TO service_role;
ALTER TABLE public.curricula ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own curricula read" ON public.curricula FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Own curricula insert" ON public.curricula FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Own curricula delete" ON public.curricula FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.lesson_progress (
  user_id uuid NOT NULL,
  curriculum_key text NOT NULL,
  lesson_id text NOT NULL,
  lesson_title text NOT NULL DEFAULT '',
  best_score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  correct_total integer NOT NULL DEFAULT 0,
  answered_total integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, curriculum_key, lesson_id)
);
CREATE INDEX lesson_progress_topic_idx ON public.lesson_progress(curriculum_key, lesson_id);
GRANT SELECT ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own progress read" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_user_idx ON public.chat_messages(user_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own chat read" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own chat insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own chat delete" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_learner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(COALESCE(NEW.email, 'Şagird'), '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.learner_stats (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_learner AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_learner();

CREATE OR REPLACE FUNCTION public.get_global_leaderboard(_limit integer DEFAULT 50)
RETURNS TABLE (user_id uuid, display_name text, avatar_url text, xp integer, accuracy numeric, streak integer, lessons_completed integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id, p.display_name, p.avatar_url, s.xp,
    CASE WHEN s.answered_count > 0 THEN round(s.correct_count::numeric * 100 / s.answered_count, 1) ELSE 0 END,
    CASE WHEN s.last_active_date >= (now() AT TIME ZONE 'utc')::date - 1 THEN s.streak_current ELSE 0 END,
    s.lessons_completed
  FROM public.learner_stats s JOIN public.profiles p ON p.id = s.user_id
  ORDER BY s.xp DESC, 5 DESC
  LIMIT LEAST(GREATEST(_limit, 1), 100);
$$;

CREATE OR REPLACE FUNCTION public.get_topic_leaderboard(_curriculum_key text, _lesson_id text, _limit integer DEFAULT 50)
RETURNS TABLE (user_id uuid, display_name text, avatar_url text, best_score integer, total integer, accuracy numeric, attempts integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lp.user_id, p.display_name, p.avatar_url, lp.best_score, lp.total,
    CASE WHEN lp.answered_total > 0 THEN round(lp.correct_total::numeric * 100 / lp.answered_total, 1) ELSE 0 END,
    lp.attempts
  FROM public.lesson_progress lp JOIN public.profiles p ON p.id = lp.user_id
  WHERE lp.curriculum_key = _curriculum_key AND lp.lesson_id = _lesson_id
    AND (_curriculum_key = 'sample' OR lp.user_id = auth.uid())
  ORDER BY lp.best_score DESC, 6 DESC, lp.attempts ASC
  LIMIT LEAST(GREATEST(_limit, 1), 100);
$$;
REVOKE EXECUTE ON FUNCTION public.get_global_leaderboard(integer) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.get_topic_leaderboard(text, text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_topic_leaderboard(text, text, integer) TO authenticated;

CREATE POLICY "Own PDFs upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'curriculum-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own PDFs read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'curriculum-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own PDFs delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'curriculum-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);