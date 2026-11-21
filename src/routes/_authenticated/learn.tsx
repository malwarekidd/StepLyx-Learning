import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, FileUp, Target } from "lucide-react";

import { LearningPath } from "@/components/learn/LearningPath";
import { TopBar } from "@/components/learn/TopBar";
import { TutorChat } from "@/components/learn/TutorChat";
import { allLessons } from "@/data/curriculum";
import { getNodeStatuses } from "@/lib/game-logic";
import { dashboardQuery, useDashboard } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/learn")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery()),
  head: () => ({
    meta: [
      { title: "Öyrənmə yolu — steplyx-learning" },
      { name: "description", content: "Unitlər, dərslər və yoxlama nöqtələri ilə şəxsi öyrənmə yolun." },
      { property: "og:title", content: "Öyrənmə yolu — steplyx-learning" },
      { property: "og:description", content: "Unitlər, dərslər və yoxlama nöqtələri ilə şəxsi öyrənmə yolun." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const { data } = useDashboard();
  const lessons = allLessons(data.curriculum);
  const statuses = getNodeStatuses(lessons.map((l) => l.id), data.progress);
  const done = lessons.filter((l) => statuses[l.id] === "completed").length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-glow">
      <TopBar />
      <main className="mx-auto max-w-xl px-4 pb-32 pt-4">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface/80 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{data.curriculumTitle}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="size-3.5" /> {done}/{lessons.length} dərs · {pct}% tamamlanıb
            </p>
          </div>
          <Link
            to="/upload"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:border-primary hover:text-primary"
          >
            <FileUp className="size-4" /> PDF
          </Link>
        </div>
        <LearningPath curriculum={data.curriculum} statuses={statuses} progress={data.progress} />
      </main>
      <TutorChat context={{ curriculumKey: data.curriculumKey }} />
    </div>
  );
}
