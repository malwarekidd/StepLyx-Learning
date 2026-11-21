DROP FUNCTION IF EXISTS public.get_topic_leaderboard(text, text, integer);

CREATE FUNCTION public.get_topic_leaderboard(_viewer uuid, _curriculum_key text, _lesson_id text, _limit integer DEFAULT 50)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, best_score integer, total integer, accuracy numeric, attempts integer)
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT lp.user_id, p.display_name, p.avatar_url, lp.best_score, lp.total,
    CASE WHEN lp.answered_total > 0 THEN round(lp.correct_total::numeric * 100 / lp.answered_total, 1) ELSE 0 END,
    lp.attempts
  FROM public.lesson_progress lp JOIN public.profiles p ON p.id = lp.user_id
  WHERE lp.curriculum_key = _curriculum_key AND lp.lesson_id = _lesson_id
    AND (_curriculum_key = 'sample' OR lp.user_id = _viewer)
  ORDER BY lp.best_score DESC, 6 DESC, lp.attempts ASC
  LIMIT LEAST(GREATEST(_limit, 1), 100);
$function$;

REVOKE EXECUTE ON FUNCTION public.get_topic_leaderboard(uuid, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_topic_leaderboard(uuid, text, text, integer) TO service_role;