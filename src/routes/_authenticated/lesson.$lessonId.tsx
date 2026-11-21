import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Check, Flame, Lock, Star, Trophy, X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RuleDrawer } from "@/components/learn/RuleDrawer";
import { PdfSourceTag } from "@/components/learn/RuleContent";
import { TutorChat } from "@/components/learn/TutorChat";
import { Button } from "@/components/ui/button";
import { allLessons, findLesson, getRule, OPTION_LETTERS } from "@/data/curriculum";
import { canOpenLesson, getNodeStatuses, localDateString, starsFor } from "@/lib/game-logic";
import { submitLesson } from "@/lib/learn.functions";
import { dashboardQuery, useDashboard } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/lesson/$lessonId")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery()),
  head: () => ({
    meta: [
      { title: "Dərs — steplyx-learning" },
      { name: "description", content: "Test sualları, PDF qaydaları və AI müəllim ilə interaktiv dərs." },
      { property: "og:title", content: "Dərs — steplyx-learning" },
      { property: "og:description", content: "Test sualları, PDF qaydaları və AI müəllim ilə interaktiv dərs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LessonPage,
});

type Result = Awaited<ReturnType<typeof submitLesson>>;

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { data } = useDashboard();
  const found = findLesson(lessonId, data.curriculum);
  const statuses = getNodeStatuses(allLessons(data.curriculum).map((l) => l.id), data.progress);

  if (!found || !canOpenLesson(statuses[lessonId])) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-surface-raised text-muted-foreground">
          <Lock className="size-7" />
        </span>
        <h1 className="text-2xl font-extrabold">{found ? "Bu dərs hələ bağlıdır" : "Dərs tapılmadı"}</h1>
        <p className="max-w-sm text-muted-foreground">Əvvəlki dərsləri bitir, sonra bu dərs açılacaq.</p>
        <Button asChild variant="brand" size="xl">
          <Link to="/learn">Yola qayıt</Link>
        </Button>
      </main>
    );
  }
  return <Quiz key={lessonId} unitTone={found.unit.tone} />;
}

function Quiz({ unitTone }: { unitTone: 1 | 2 | 3 }) {
  const { lessonId } = Route.useParams();
  const { data } = useDashboard();
  const { lesson, unit } = findLesson(lessonId, data.curriculum)!;
  const questions = lesson.questions;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submit = useServerFn(submitLesson);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<(number | null)[]>(() => questions.map(() => null));
  const [checked, setChecked] = useState<boolean[]>(() => questions.map(() => false));
  const [ruleOpen, setRuleOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const q = questions[index]!;
  const sel = selected[index] ?? null;
  const isChecked = checked[index] ?? false;
  const isCorrect = isChecked && sel === q.answer;
  const correctCount = questions.filter((qq, i) => checked[i] && selected[i] === qq.answer).length;
  const checkedCount = checked.filter(Boolean).length;
  const allChecked = checkedCount === questions.length;
  const rule = getRule(q.ruleId, data.curriculum);

  const mutation = useMutation({
    mutationFn: () => submit({ data: { curriculumKey: data.curriculumKey, lessonId, answers: selected.map((s) => s ?? 0), localDate: localDateString() } }),
    onSuccess: (r) => {
      setResult(r);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Nəticə yadda saxlanmadı"),
  });

  const choose = (i: number) => {
    if (isChecked) return;
    setSelected((s) => s.map((v, k) => (k === index ? i : v)));
  };
  const check = () => {
    if (sel === null) return;
    setChecked((c) => c.map((v, k) => (k === index ? true : v)));
  };
  const next = () => {
    const nextOpen = questions.findIndex((_, i) => i > index && !checked[i]);
    const anyOpen = nextOpen === -1 ? questions.findIndex((_, i) => !checked[i]) : nextOpen;
    if (anyOpen === -1) mutation.mutate();
    else setIndex(anyOpen);
  };

  if (result) return <Results result={result} lessonTitle={lesson.title} onRetry={() => window.location.reload()} />;

  const optionState = (i: number) => {
    if (!isChecked) return sel === i ? "selected" : "idle";
    if (i === q.answer) return "correct";
    if (i === sel) return "wrong";
    return "dim";
  };

  return (
    <div data-tone={unitTone} className="min-h-screen bg-glow">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-4 px-4">
          <button onClick={() => navigate({ to: "/learn" })} aria-label="Dərsdən çıx" className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-raised hover:text-foreground">
            <X className="size-6" />
          </button>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-surface-raised">
            <div className="h-full rounded-full bg-tone transition-all duration-500" style={{ width: `${(checkedCount / questions.length) * 100}%` }} />
          </div>
          <span className="flex items-center gap-1 text-sm font-extrabold text-success">
            <Check className="size-4" strokeWidth={3} /> {correctCount}
          </span>
          <span className="flex items-center gap-1 text-sm font-extrabold text-destructive">
            <X className="size-4" strokeWidth={3} /> {checkedCount - correctCount}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-40 pt-6">
        <p className="text-xs font-extrabold uppercase tracking-wider text-tone">
          {unit.subtitle} · {unit.title}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">{lesson.title}</h1>

        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Suallar">
          {questions.map((qq, i) => {
            const st = checked[i] ? (selected[i] === qq.answer ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground") : i === index ? "bg-tone text-primary-foreground" : "bg-surface-raised text-muted-foreground";
            return (
              <button key={qq.id} role="tab" aria-selected={i === index} onClick={() => setIndex(i)} className={`h-8 min-w-8 rounded-lg px-2 font-display text-sm font-extrabold ${st}`}>
                {i + 1}
              </button>
            );
          })}
        </div>

        <article className="mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-tone/15 px-3 py-1 font-display text-sm font-extrabold text-tone">Sual {index + 1}</span>
            {rule && <PdfSourceTag sectionId={rule.sectionId} curriculum={data.curriculum} />}
          </div>
          <h2 className="mt-4 font-sans text-lg font-bold leading-relaxed sm:text-xl">{q.prompt}</h2>

          <div role="radiogroup" aria-label="Variantlar" className="mt-5 grid gap-3">
            {q.options.map((opt, i) => {
              const state = optionState(i);
              return (
                <button
                  key={i}
                  role="radio"
                  aria-checked={sel === i}
                  data-state={state}
                  onClick={() => choose(i)}
                  className={`option-card press-3d flex items-center gap-3 rounded-2xl p-3.5 text-left ${isChecked ? "cursor-default" : ""}`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl border-2 font-display text-sm font-extrabold ${
                      state === "selected" ? "border-primary bg-primary text-primary-foreground" : state === "correct" ? "border-success bg-success text-success-foreground" : state === "wrong" ? "border-destructive bg-destructive text-destructive-foreground" : "border-border text-muted-foreground"
                    }`}
                  >
                    {OPTION_LETTERS[i]})
                  </span>
                  <span className="flex-1 font-semibold">{opt}</span>
                  {state === "correct" && <Check className="size-5 text-success" strokeWidth={3} />}
                  {state === "wrong" && <X className="size-5 text-destructive" strokeWidth={3} />}
                </button>
              );
            })}
          </div>

          <Button variant="rule" size="xl" className="mt-5 w-full" onClick={() => setRuleOpen(true)}>
            <BookOpen /> Bilmirsənsə qaydaya bax
          </Button>
        </article>
      </main>

      <footer
        className={`fixed inset-x-0 bottom-0 z-30 border-t-2 ${isChecked ? (isCorrect ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10") : "border-border bg-background/95"} backdrop-blur-md`}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            {isChecked ? (
              isCorrect ? (
                <p className="font-display text-lg font-extrabold text-success">Əla, düzdür! +10 XP</p>
              ) : (
                <div>
                  <p className="font-display text-lg font-extrabold text-destructive">Səhv cavab</p>
                  <p className="text-sm text-muted-foreground">
                    Düzgün cavab: {OPTION_LETTERS[q.answer]}) {q.options[q.answer]} ·{" "}
                    <button onClick={() => setRuleOpen(true)} className="font-bold text-primary hover:underline">
                      qaydaya bax
                    </button>
                  </p>
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">{sel === null ? "Bir variant seç" : "Fikrini dəyişə bilərsən — sonra «Yoxla» düyməsinə bas"}</p>
            )}
          </div>
          {isChecked ? (
            <Button variant={isCorrect ? "success" : "danger"} size="xl" className="sm:min-w-44" onClick={next} disabled={mutation.isPending}>
              {allChecked ? (mutation.isPending ? "Yadda saxlanır..." : "Nəticəyə bax") : "Növbəti sual"}
            </Button>
          ) : (
            <Button variant="brand" size="xl" className="sm:min-w-44" onClick={check} disabled={sel === null}>
              Yoxla
            </Button>
          )}
        </div>
      </footer>

      <RuleDrawer open={ruleOpen} onOpenChange={setRuleOpen} rule={rule} question={q} questionNumber={index + 1} curriculum={data.curriculum} />
      <div className="[&>button]:bottom-36 sm:[&>button]:bottom-28">
        <TutorChat context={{ curriculumKey: data.curriculumKey, lessonId, lessonTitle: lesson.title, questionIndex: index, answered: isChecked }} />
      </div>
    </div>
  );
}

function Results({ result, lessonTitle, onRetry }: { result: Result; lessonTitle: string; onRetry: () => void }) {
  const stars = starsFor(result.score, result.total);
  const { lessonId } = Route.useParams();
  return (
    <main className="dashed-grid flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center animate-in fade-in zoom-in-95">
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <Star key={s} className={`size-12 ${s <= stars ? "fill-gold text-gold" : "text-surface-raised"}`} style={{ transitionDelay: `${s * 120}ms` }} />
          ))}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold">{result.score === result.total ? "Mükəmməl!" : "Dərs tamamlandı!"}</h1>
        <p className="mt-1 text-muted-foreground">{lessonTitle}</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <ResultTile icon={<Check className="size-5" />} label="Nəticə" value={`${result.score}/${result.total}`} tone="text-success" />
          <ResultTile icon={<Zap className="size-5" />} label="XP" value={`+${result.xpEarned}`} tone="text-primary" />
          <ResultTile icon={<Flame className="size-5" />} label="Seriya" value={`${result.streak}`} tone="text-gold" />
        </div>
        <div className="mt-4 space-y-1 text-sm text-muted-foreground">
          {result.combo >= 3 && <p>Ən uzun düz cavab seriyası: {result.combo} 🔥</p>}
          {result.streakIncreased && <p className="font-semibold text-gold">Gündəlik seriya artdı!</p>}
          {!result.firstCompletion && result.xpEarned === 0 && <p>Təkrarda XP yalnız ən yaxşı nəticəni keçəndə verilir.</p>}
        </div>
        <div className="mt-8 grid gap-3">
          <Button asChild variant="brand" size="xl">
            <Link to="/learn">Yola qayıt</Link>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="chunky" size="xl" onClick={onRetry}>
              Yenidən
            </Button>
            <Button asChild variant="chunky" size="xl">
              <Link to="/leaderboard" search={{ topic: lessonId }}>
                <Trophy /> Reytinq
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ResultTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <span className={`mx-auto flex w-fit items-center ${tone}`}>{icon}</span>
      <p className="mt-1 font-display text-xl font-extrabold">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
