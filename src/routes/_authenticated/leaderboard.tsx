import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Crown, Flame, Medal, Target, Trophy, Zap } from "lucide-react";

import { initials, TopBar } from "@/components/learn/TopBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allLessons } from "@/data/curriculum";
import { dashboardQuery, leaderboardQuery, useDashboard } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  validateSearch: (s: Record<string, unknown>): { topic?: string } =>
    typeof s["topic"] === "string" ? { topic: s["topic"] } : {},
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery()),
  head: () => ({
    meta: [
      { title: "Liderlər cədvəli — LEARNWITHAI" },
      { name: "description", content: "XP, dəqiqlik və seriyaya görə ən yaxşı şagirdlər — ümumi və mövzu üzrə." },
      { property: "og:title", content: "Liderlər cədvəli — LEARNWITHAI" },
      { property: "og:description", content: "XP, dəqiqlik və seriyaya görə ən yaxşı şagirdlər — ümumi və mövzu üzrə." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { data } = useDashboard();
  const { topic } = Route.useSearch();
  const navigate = useNavigate({ from: "/leaderboard" });
  const lessons = allLessons(data.curriculum);
  const scope = topic ? "topic" : "global";
  const lessonId = topic ?? lessons[0]?.id;
  const board = useQuery(leaderboardQuery(scope, data.curriculumKey, scope === "topic" ? lessonId : undefined));
  const accuracy = data.stats.answered ? Math.round((data.stats.correct / data.stats.answered) * 100) : 0;

  return (
    <div className="min-h-screen bg-glow">
      <TopBar />
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-gold/15 text-gold">
            <Trophy className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold">Liderlər cədvəli</h1>
            <p className="text-sm text-muted-foreground">XP və dəqiqliyə görə sıralama</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MyStat icon={<Zap className="size-4 text-primary" />} label="XP" value={data.stats.xp} />
          <MyStat icon={<Target className="size-4 text-success" />} label="Dəqiqlik" value={`${accuracy}%`} />
          <MyStat icon={<Flame className="size-4 text-gold" />} label="Seriya" value={`${data.stats.streak} / ${data.stats.streakBest}`} />
        </div>

        <Tabs
          value={scope}
          onValueChange={(v) => navigate({ search: v === "topic" && lessonId ? { topic: lessonId } : {} })}
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-2 bg-surface">
            <TabsTrigger value="global">Ümumi</TabsTrigger>
            <TabsTrigger value="topic">Mövzu üzrə</TabsTrigger>
          </TabsList>
        </Tabs>

        {scope === "topic" && (
          <Select value={lessonId ?? ""} onValueChange={(v) => navigate({ search: { topic: v } })}>
            <SelectTrigger className="mt-3 border-border bg-surface">
              <SelectValue placeholder="Mövzu seç" />
            </SelectTrigger>
            <SelectContent>
              {lessons.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <ol className="mt-4 space-y-2">
          {board.isLoading &&
            Array.from({ length: 5 }).map((_, i) => <li key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />)}
          {board.data?.rows.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Hələ heç kim bu mövzunu bitirməyib. İlk sən ol!
            </li>
          )}
          {board.data?.rows.map((r, i) => {
            const me = r.userId === board.data.me;
            return (
              <li
                key={r.userId}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${me ? "border-primary bg-primary/10" : "border-border bg-surface"}`}
              >
                <span className="grid w-8 place-items-center font-display text-lg font-extrabold text-muted-foreground">
                  {i === 0 ? <Crown className="size-6 text-gold" /> : i < 3 ? <Medal className={`size-6 ${i === 1 ? "text-foreground/70" : "text-tone"}`} /> : i + 1}
                </span>
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-raised font-display text-sm font-extrabold">
                  {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="size-full object-cover" /> : initials(r.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    {r.name} {me && <span className="text-xs text-primary">(sən)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.accuracy}% dəqiqlik · {scope === "global" ? `${r.secondary} gün seriya` : `${r.secondary} cəhd`}
                  </p>
                </div>
                <span className="font-display text-lg font-extrabold">
                  {scope === "global" ? (
                    <>
                      {r.primary} <span className="text-xs text-primary">XP</span>
                    </>
                  ) : (
                    `${r.primary}/${r.total}`
                  )}
                </span>
              </li>
            );
          })}
        </ol>
        {data.curriculumKey !== "sample" && scope === "topic" && (
          <p className="mt-3 text-center text-xs text-muted-foreground">Öz yüklədiyin PDF-in mövzuları yalnız sənin nəticələrini göstərir.</p>
        )}
      </main>
    </div>
  );
}

function MyStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 font-display text-lg font-extrabold">{value}</p>
    </div>
  );
}
