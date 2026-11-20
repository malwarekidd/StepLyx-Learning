import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Check, Lock, RotateCcw, Star, Trophy, Zap } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { Curriculum, Lesson, NodeKind, Unit } from "@/data/curriculum";
import type { LessonResult, NodeStatus } from "@/lib/game-logic";
import { UnitGuideDialog } from "./UnitGuideDialog";

const ROW = 128;
const NODE = 72;
const PATTERN = [0, 0.6, 1, 0.6, 0, -0.6, -1, -0.6];
const ICONS: Record<NodeKind, typeof Star> = { star: Star, lightning: Zap, review: RotateCcw, checkpoint: Trophy };

interface Props {
  curriculum: Curriculum;
  statuses: Record<string, NodeStatus>;
  progress: Record<string, LessonResult>;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(360);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => e && setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export function LearningPath({ curriculum, statuses, progress }: Props) {
  const [current, setCurrent] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const onScroll = () => {
      let idx = 0;
      sectionRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top < 200) idx = i;
      });
      setCurrent(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const unit = curriculum.units[current] ?? curriculum.units[0];
  if (!unit) return null;

  return (
    <div className="relative">
      <UnitBanner unit={unit} curriculum={curriculum} statuses={statuses} />
      {curriculum.units.map((u, i) => (
        <section key={u.id} ref={(el) => void (sectionRefs.current[i] = el)} data-tone={u.tone} className="pt-6">
          {i > 0 && (
            <div className="mb-4 flex items-center gap-3 px-2">
              <span className="h-px flex-1 bg-border" />
              <span className="text-center text-sm font-bold text-muted-foreground">
                <span className="mr-2 text-tone">{u.subtitle}</span>
                {u.title}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
          )}
          <UnitPath unit={u} statuses={statuses} progress={progress} />
        </section>
      ))}
    </div>
  );
}

function UnitBanner({ unit, curriculum, statuses }: { unit: Unit; curriculum: Curriculum; statuses: Record<string, NodeStatus> }) {
  const done = unit.lessons.filter((l) => statuses[l.id] === "completed").length;
  const pct = Math.round((done / unit.lessons.length) * 100);
  return (
    <div data-tone={unit.tone} className="sticky top-[4.5rem] z-30">
      <div className="press-3d flex items-stretch overflow-hidden rounded-2xl bg-tone text-primary-foreground">
        <div className="flex-1 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider opacity-85">
            {unit.subtitle} · {done}/{unit.lessons.length} dərs
          </p>
          <h2 className="mt-0.5 text-xl font-extrabold leading-tight sm:text-2xl">{unit.title}</h2>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/25">
            <div className="h-full rounded-full bg-primary-foreground transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <UnitGuideDialog unit={unit} curriculum={curriculum}>
          <button className="flex flex-col items-center justify-center gap-1 border-l-2 border-background/20 px-4 text-xs font-extrabold uppercase tracking-wide hover:bg-background/10">
            <BookOpen className="size-6" />
            Qaydalar
          </button>
        </UnitGuideDialog>
      </div>
    </div>
  );
}

function UnitPath({ unit, statuses, progress }: { unit: Unit; statuses: Record<string, NodeStatus>; progress: Record<string, LessonResult> }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const amp = Math.min(90, width * 0.2);
  const points = unit.lessons.map((_, i) => ({ x: width / 2 + (PATTERN[i % PATTERN.length] ?? 0) * amp, y: i * ROW + ROW / 2 + 24 }));
  const height = unit.lessons.length * ROW + 24;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[440px]" style={{ height }}>
      <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden>
        {points.slice(1).map((p, i) => {
          const a = points[i]!;
          const my = (a.y + p.y) / 2;
          const done = statuses[unit.lessons[i]!.id] === "completed";
          return (
            <path
              key={i}
              d={`M ${a.x} ${a.y} C ${a.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`}
              fill="none"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray="1 14"
              className={done ? "stroke-tone" : "stroke-border"}
            />
          );
        })}
      </svg>
      {unit.lessons.map((lesson, i) => (
        <PathNode
          key={lesson.id}
          lesson={lesson}
          status={statuses[lesson.id] ?? "locked"}
          result={progress[lesson.id]}
          x={points[i]!.x}
          y={points[i]!.y}
          width={width}
          index={i}
        />
      ))}
    </div>
  );
}

function PathNode({
  lesson,
  status,
  result,
  x,
  y,
  width,
  index,
}: {
  lesson: Lesson;
  status: NodeStatus;
  result: LessonResult | undefined;
  x: number;
  y: number;
  width: number;
  index: number;
}) {
  const navigate = useNavigate();
  const Icon = status === "locked" ? Lock : ICONS[lesson.kind];
  const labelLeft = x >= width / 2;
  const space = labelLeft ? x - NODE / 2 - 14 : width - x - NODE / 2 - 14;

  const open = () => {
    if (status === "locked") {
      toast("Bu dərs hələ bağlıdır", { description: "Əvvəlcə əvvəlki dərsi bitir." });
      return;
    }
    navigate({ to: "/lesson/$lessonId", params: { lessonId: lesson.id } });
  };

  return (
    <div
      className="absolute animate-in fade-in zoom-in-75 fill-mode-both"
      style={{ left: x, top: y, animationDelay: `${index * 60}ms` }}
    >
      {status === "active" && (
        <div className="callout-float absolute bottom-[calc(100%+18px)] left-1/2 z-10 whitespace-nowrap rounded-xl border-2 border-border bg-surface px-3 py-1.5 font-display text-sm font-extrabold tracking-wider text-tone shadow-lg">
          BAŞLAT
          <span className="absolute left-1/2 top-full size-3 -translate-x-1/2 -translate-y-1.5 rotate-45 border-b-2 border-r-2 border-border bg-surface" />
        </div>
      )}
      <div className="relative -translate-x-1/2 -translate-y-1/2" style={{ width: NODE, height: NODE }}>
        {status === "active" && <span className="node-ring absolute -inset-2" />}
        <button
          onClick={open}
          data-status={status}
          aria-label={`${lesson.title}${status === "locked" ? " (bağlı)" : ""}`}
          className="path-node press-3d relative size-full"
        >
          <Icon className={status === "locked" ? "size-7" : "size-8 fill-current"} strokeWidth={status === "locked" ? 2.5 : 1.5} />
          {status === "completed" && (
            <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border-2 border-background bg-success text-success-foreground">
              <Check className="size-3.5" strokeWidth={3.5} />
            </span>
          )}
        </button>
      </div>
      <Link
        to="/lesson/$lessonId"
        params={{ lessonId: lesson.id }}
        disabled={status === "locked"}
        className={`absolute top-0 -translate-y-1/2 ${labelLeft ? "text-right" : "text-left"}`}
        style={{
          [labelLeft ? "right" : "left"]: NODE / 2 + 14,
          width: Math.max(96, Math.min(180, space)),
        }}
      >
        <p className={`text-[13px] font-bold leading-snug ${status === "locked" ? "text-muted-foreground" : "text-foreground"}`}>
          {lesson.title}
        </p>
        <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
          {lesson.questions.length} sual
          {result ? ` · ${result.score}/${result.total}` : ""}
        </p>
      </Link>
    </div>
  );
}
