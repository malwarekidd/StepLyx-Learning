import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { allLessons, findLesson } from "@/data/curriculum";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loadCurriculum, SAMPLE_KEY } from "@/lib/curriculum-store";
import {
  bestCombo,
  canOpenLesson,
  getNodeStatuses,
  isPlausibleLocalDate,
  lessonXp,
  nextStreak,
  visibleStreak,
  type LessonResult,
} from "@/lib/game-logic";

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const getDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { localDate: string }) => z.object({ localDate }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: stats }, { data: curricula }] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_url, active_curriculum_id").eq("id", userId).maybeSingle(),
      supabase.from("learner_stats").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("curricula").select("id, title, source_file, created_at").order("created_at", { ascending: false }),
    ]);
    const active = await loadCurriculum(supabase, profile?.active_curriculum_id);
    const { data: rows, error } = await supabase
      .from("lesson_progress")
      .select("lesson_id, best_score, total, attempts, correct_total, answered_total")
      .eq("curriculum_key", active.key);
    if (error) throw new Error(error.message);

    const progress: Record<string, LessonResult & { attempts: number }> = {};
    for (const r of rows ?? []) progress[r.lesson_id] = { score: r.best_score, total: r.total, attempts: r.attempts };

    return {
      profile: { displayName: profile?.display_name ?? "Şagird", avatarUrl: profile?.avatar_url ?? null },
      stats: {
        xp: stats?.xp ?? 0,
        correct: stats?.correct_count ?? 0,
        answered: stats?.answered_count ?? 0,
        lessonsCompleted: stats?.lessons_completed ?? 0,
        streak: visibleStreak(stats?.last_active_date ?? null, data.localDate, stats?.streak_current ?? 0),
        streakBest: stats?.streak_best ?? 0,
        activeToday: stats?.last_active_date === data.localDate,
      },
      curriculumKey: active.key,
      curriculumTitle: active.title,
      curriculum: active.curriculum,
      progress,
      curricula: (curricula ?? []).map((c) => ({ id: c.id, title: c.title, sourceFile: c.source_file, createdAt: c.created_at })),
    };
  });

export const submitLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { curriculumKey: string; lessonId: string; answers: number[]; localDate: string }) =>
    z
      .object({
        curriculumKey: z.string().min(1).max(64),
        lessonId: z.string().min(1).max(80),
        answers: z.array(z.number().int().min(0).max(3)).min(1).max(20),
        localDate,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!isPlausibleLocalDate(data.localDate)) throw new Error("Tarix düzgün deyil");

    const active = await loadCurriculum(supabase, data.curriculumKey);
    if (active.key !== data.curriculumKey) throw new Error("Kurikulum tapılmadı");
    const found = findLesson(data.lessonId, active.curriculum);
    if (!found) throw new Error("Dərs tapılmadı");
    const { lesson } = found;
    if (data.answers.length !== lesson.questions.length) throw new Error("Cavabların sayı uyğun deyil");

    const { data: rows } = await supabase
      .from("lesson_progress")
      .select("lesson_id, best_score, total, attempts, correct_total, answered_total")
      .eq("curriculum_key", active.key);
    const completed: Record<string, LessonResult> = {};
    for (const r of rows ?? []) completed[r.lesson_id] = { score: r.best_score, total: r.total };
    const statuses = getNodeStatuses(allLessons(active.curriculum).map((l) => l.id), completed);
    if (!canOpenLesson(statuses[lesson.id])) throw new Error("Bu dərs hələ bağlıdır");

    const results = lesson.questions.map((q, i) => data.answers[i] === q.answer);
    const score = results.filter(Boolean).length;
    const prev = (rows ?? []).find((r) => r.lesson_id === lesson.id);
    const xpEarned = lessonXp(results, prev ? prev.best_score : null);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: progressError } = await supabaseAdmin.from("lesson_progress").upsert({
      user_id: userId,
      curriculum_key: active.key,
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      best_score: Math.max(score, prev?.best_score ?? 0),
      total: lesson.questions.length,
      attempts: (prev?.attempts ?? 0) + 1,
      correct_total: (prev?.correct_total ?? 0) + score,
      answered_total: (prev?.answered_total ?? 0) + results.length,
      completed_at: new Date().toISOString(),
    });
    if (progressError) throw new Error(progressError.message);

    const { data: stats } = await supabaseAdmin.from("learner_stats").select("*").eq("user_id", userId).maybeSingle();
    const prevStreak = visibleStreak(stats?.last_active_date ?? null, data.localDate, stats?.streak_current ?? 0);
    const streak = nextStreak(stats?.last_active_date ?? null, data.localDate, stats?.streak_current ?? 0);
    const lastActive =
      stats?.last_active_date && stats.last_active_date > data.localDate ? stats.last_active_date : data.localDate;

    const { error: statsError } = await supabaseAdmin.from("learner_stats").upsert({
      user_id: userId,
      xp: (stats?.xp ?? 0) + xpEarned,
      correct_count: (stats?.correct_count ?? 0) + score,
      answered_count: (stats?.answered_count ?? 0) + results.length,
      lessons_completed: (stats?.lessons_completed ?? 0) + (prev ? 0 : 1),
      streak_current: streak,
      streak_best: Math.max(stats?.streak_best ?? 0, streak),
      last_active_date: lastActive,
      updated_at: new Date().toISOString(),
    });
    if (statsError) throw new Error(statsError.message);

    return {
      score,
      total: results.length,
      results,
      xpEarned,
      combo: bestCombo(results),
      streak,
      streakIncreased: streak > prevStreak,
      firstCompletion: !prev,
    };
  });

export const setActiveCurriculum = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { curriculumId: string | null }) =>
    z.object({ curriculumId: z.string().uuid().nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.curriculumId) {
      const { data: row } = await supabase.from("curricula").select("id").eq("id", data.curriculumId).maybeSingle();
      if (!row) throw new Error("Kurikulum tapılmadı");
    }
    const { error } = await supabase
      .from("profiles")
      .update({ active_curriculum_id: data.curriculumId, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCurriculum = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { curriculumId: string }) => z.object({ curriculumId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("profiles").update({ active_curriculum_id: null }).eq("id", userId).eq("active_curriculum_id", data.curriculumId);
    const { error } = await supabase.from("curricula").delete().eq("id", data.curriculumId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { scope: "global" | "topic"; curriculumKey?: string; lessonId?: string }) =>
    z
      .object({
        scope: z.enum(["global", "topic"]),
        curriculumKey: z.string().max(64).optional(),
        lessonId: z.string().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.scope === "topic") {
      const { data: rows, error } = await supabase.rpc("get_topic_leaderboard", {
        _curriculum_key: data.curriculumKey ?? SAMPLE_KEY,
        _lesson_id: data.lessonId ?? "",
        _limit: 50,
      });
      if (error) throw new Error(error.message);
      return {
        scope: "topic" as const,
        me: userId,
        rows: (rows ?? []).map((r) => ({
          userId: r.user_id,
          name: r.display_name,
          avatarUrl: r.avatar_url,
          primary: r.best_score,
          total: r.total,
          accuracy: Number(r.accuracy),
          secondary: r.attempts,
        })),
      };
    }
    const { data: rows, error } = await supabase.rpc("get_global_leaderboard", { _limit: 50 });
    if (error) throw new Error(error.message);
    return {
      scope: "global" as const,
      me: userId,
      rows: (rows ?? []).map((r) => ({
        userId: r.user_id,
        name: r.display_name,
        avatarUrl: r.avatar_url,
        primary: r.xp,
        total: 0,
        accuracy: Number(r.accuracy),
        secondary: r.streak,
      })),
    };
  });

export const getChatHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }));
  });

export const clearChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("chat_messages").delete().eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
