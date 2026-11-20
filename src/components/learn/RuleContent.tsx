import { BookOpenCheck, FileText, Lightbulb, ListOrdered } from "lucide-react";

import { getSection, type Curriculum, type Rule } from "@/data/curriculum";

export function PdfSourceTag({ sectionId, curriculum }: { sectionId: string; curriculum: Curriculum }) {
  const section = getSection(sectionId, curriculum);
  if (!section) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-2 py-1 font-mono text-[11px] text-muted-foreground">
      <FileText className="size-3.5 text-primary" />
      <span className="max-w-[16rem] truncate">{curriculum.source.file}</span> · səh. {section.page} · {section.code}
    </span>
  );
}

export function RuleContent({ rule, steps, curriculum }: { rule: Rule; steps?: string[]; curriculum: Curriculum }) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <PdfSourceTag sectionId={rule.sectionId} curriculum={curriculum} />
        <p className="leading-relaxed text-foreground/90">{rule.statement}</p>
      </div>

      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Qayda / düstur</p>
        <pre className="whitespace-pre-wrap font-mono text-sm font-semibold leading-relaxed text-foreground">
          {rule.formula}
        </pre>
      </div>

      {steps && steps.length > 0 && (
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <ListOrdered className="size-4" /> Bu sual üçün addımlar
          </p>
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-surface-raised/60 p-3 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background/50 p-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
          <Lightbulb className="size-4" /> Həll olunmuş nümunə
        </p>
        <p className="font-semibold">{rule.example.problem}</p>
        <ul className="mt-2 space-y-1.5">
          {rule.example.solution.map((line, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <BookOpenCheck className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
