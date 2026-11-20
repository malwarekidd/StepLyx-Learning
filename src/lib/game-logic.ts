export type NodeStatus = "completed" | "active" | "locked";

export interface LessonResult {
  score: number;
  total: number;
}

export const XP_PER_CORRECT = 10;
export const XP_FIRST_COMPLETION = 20;
export const XP_COMBO_BONUS = 5;
export const COMBO_THRESHOLD = 3;

export function getNodeStatuses(
  lessonIds: string[],
  completed: Record<string, LessonResult>,
): Record<string, NodeStatus> {
  const out: Record<string, NodeStatus> = {};
  let activeAssigned = false;
  for (const id of lessonIds) {
    if (completed[id]) out[id] = "completed";
    else if (!activeAssigned) {
      out[id] = "active";
      activeAssigned = true;
    } else out[id] = "locked";
  }
  return out;
}

export function canOpenLesson(status: NodeStatus | undefined) {
  return status === "completed" || status === "active";
}

export function starsFor(score: number, total: number): 1 | 2 | 3 {
  if (total === 0) return 1;
  if (score === total) return 3;
  if (score / total >= 2 / 3) return 2;
  return 1;
}

/** Answers from the 3rd correct-in-a-row onward each earn a combo bonus. */
export function comboBonus(results: boolean[]) {
  let run = 0;
  let bonus = 0;
  for (const ok of results) {
    run = ok ? run + 1 : 0;
    if (run >= COMBO_THRESHOLD) bonus += XP_COMBO_BONUS;
  }
  return bonus;
}

export function bestCombo(results: boolean[]) {
  let run = 0;
  let best = 0;
  for (const ok of results) {
    run = ok ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/**
 * First completion: correct answers + completion bonus + combo bonus.
 * Replays: only XP for correct answers above the previous best (no farming).
 */
export function lessonXp(results: boolean[], previousBest: number | null) {
  const score = results.filter(Boolean).length;
  if (previousBest === null) {
    return score * XP_PER_CORRECT + XP_FIRST_COMPLETION + comboBonus(results);
  }
  return Math.max(0, score - previousBest) * XP_PER_CORRECT;
}

function dayDiff(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Streak after a lesson is finished on `today` (YYYY-MM-DD). */
export function nextStreak(lastActive: string | null, today: string, current: number) {
  if (!lastActive) return 1;
  const diff = dayDiff(lastActive, today);
  if (diff <= 0) return Math.max(current, 1);
  if (diff === 1) return current + 1;
  return 1;
}

/** Streak to display: it drops to 0 once a whole day has been missed. */
export function visibleStreak(lastActive: string | null, today: string, current: number) {
  if (!lastActive) return 0;
  return dayDiff(lastActive, today) <= 1 ? current : 0;
}

export function isPlausibleLocalDate(localDate: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return false;
  const utc = now.toISOString().slice(0, 10);
  return Math.abs(dayDiff(utc, localDate)) <= 1;
}

export function localDateString(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
