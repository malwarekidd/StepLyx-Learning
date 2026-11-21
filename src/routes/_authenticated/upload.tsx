import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, FileText, FileUp, Loader2, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

import { TopBar } from "@/components/learn/TopBar";
import { Button } from "@/components/ui/button";
import { curriculumStats, type Curriculum } from "@/data/curriculum";
import { supabase } from "@/integrations/supabase/client";
import { parseCurriculumPdf } from "@/lib/curriculum.functions";
import { deleteCurriculum, setActiveCurriculum } from "@/lib/learn.functions";
import { dashboardQuery, useDashboard } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/upload")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery()),
  head: () => ({
    meta: [
      { title: "PDF yüklə — steplyx-learning" },
      { name: "description", content: "Kurikulum PDF-ini yüklə: AI unitləri, dərsləri, sualları və qaydaları çıxarıb öyrənmə yolu qurur." },
      { property: "og:title", content: "PDF yüklə — steplyx-learning" },
      { property: "og:description", content: "Kurikulum PDF-ini yüklə: AI unitləri, dərsləri, sualları və qaydaları çıxarıb öyrənmə yolu qurur." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadPage,
});

const MAX_BYTES = 20 * 1024 * 1024;
const STAGES = ["PDF yüklənir", "Mətn və bölmələr oxunur", "Qaydalar çıxarılır", "Suallar və variantlar yaradılır", "Öyrənmə yolu qurulur"];

function UploadPage() {
  const { data } = useDashboard();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const parse = useServerFn(parseCurriculumPdf);
  const activate = useServerFn(setActiveCurriculum);
  const remove = useServerFn(deleteCurriculum);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState(-1);
  const [preview, setPreview] = useState<{ title: string; curriculum: Curriculum } | null>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      setPreview(null);
      setStage(0);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Yenidən daxil ol");
      const safe = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
      const path = `${u.user.id}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("curriculum-pdfs").upload(path, file, { contentType: "application/pdf" });
      if (error) throw new Error("Fayl yüklənmədi: " + error.message);
      setStage(1);
      return parse({ data: { path, fileName: file.name } });
    },
    onSuccess: (r) => {
      setStage(STAGES.length);
      setPreview({ title: r.title, curriculum: r.curriculum });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Yol quruldu: ${r.stats.units} unit, ${r.stats.lessons} dərs, ${r.stats.questions} sual`);
    },
    onError: (e) => {
      setStage(-1);
      toast.error(e instanceof Error ? e.message : "PDF emal olunmadı");
    },
  });

  useEffect(() => {
    if (!upload.isPending || stage < 1 || stage >= STAGES.length - 1) return;
    const t = setTimeout(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 6000);
    return () => clearTimeout(t);
  }, [upload.isPending, stage]);

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Yalnız PDF faylı seç");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Fayl 20 MB-dan böyükdür");
      return;
    }
    upload.mutate(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!upload.isPending) pick(e.dataTransfer.files[0]);
  };

  const switchTo = async (id: string | null) => {
    await activate({ data: { curriculumId: id } });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    navigate({ to: "/learn" });
  };

  return (
    <div className="min-h-screen bg-glow">
      <TopBar />
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <h1 className="text-2xl font-extrabold">PDF-dən öyrənmə yolu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kurikulum və ya dərslik PDF-ini yüklə — AI unitləri, dərs ardıcıllığını, 4 variantlı sualları və hər suala aid qaydanı çıxaracaq.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !upload.isPending && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={`mt-6 flex cursor-pointer flex-col items-center rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/60"
          } ${upload.isPending ? "pointer-events-none opacity-70" : ""}`}
        >
          <span className="grid size-16 place-items-center rounded-2xl bg-primary/15 text-primary">
            <UploadCloud className="size-8" />
          </span>
          <p className="mt-4 font-display text-lg font-extrabold">PDF-i bura at</p>
          <p className="text-sm text-muted-foreground">və ya klikləyib seç · maks. 20 MB</p>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        {stage >= 0 && (
          <ol className="mt-6 space-y-2 rounded-3xl border border-border bg-surface p-5">
            {STAGES.map((s, i) => {
              const done = i < stage;
              const current = i === stage && upload.isPending;
              return (
                <li key={s} className={`flex items-center gap-3 text-sm font-semibold ${done ? "text-foreground" : current ? "text-primary" : "text-muted-foreground"}`}>
                  <span className={`grid size-6 place-items-center rounded-full ${done ? "bg-success text-success-foreground" : current ? "bg-primary/20" : "bg-surface-raised"}`}>
                    {done ? <Check className="size-3.5" strokeWidth={3} /> : current ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  </span>
                  {s}
                </li>
              );
            })}
            {upload.isPending && <p className="pt-2 text-xs text-muted-foreground">Böyük PDF-lər 1-2 dəqiqə çəkə bilər.</p>}
          </ol>
        )}

        {preview && (
          <section className="mt-6 rounded-3xl border border-primary/40 bg-surface p-5 animate-in fade-in slide-in-from-bottom-2">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary">
              <Sparkles className="size-4" /> Çıxarılan struktur
            </p>
            <h2 className="mt-1 text-xl font-extrabold">{preview.title}</h2>
            <div className="mt-4 space-y-3">
              {preview.curriculum.units.map((u) => (
                <div key={u.id} data-tone={u.tone} className="rounded-2xl border border-border p-3">
                  <p className="font-bold">
                    <span className="mr-2 text-tone">{u.subtitle}</span>
                    {u.title}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {u.lessons.map((l) => (
                      <li key={l.id} className="flex justify-between gap-3 text-sm text-muted-foreground">
                        <span className="truncate">{l.title}</span>
                        <span className="shrink-0">{l.questions.length} sual</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Button asChild variant="brand" size="xl" className="mt-5 w-full">
              <Link to="/learn">Yola bax</Link>
            </Button>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-extrabold">Mənim yollarım</h2>
          <ul className="mt-3 space-y-2">
            <CurriculumRow
              title="Riyaziyyat 5 — nümunə kurikulum"
              meta={(() => {
                const s = curriculumStats();
                return `${s.units} unit · ${s.lessons} dərs · ${s.questions} sual`;
              })()}
              active={data.curriculumKey === "sample"}
              onActivate={() => switchTo(null)}
            />
            {data.curricula.map((c) => (
              <CurriculumRow
                key={c.id}
                title={c.title}
                meta={`${c.sourceFile} · ${new Date(c.createdAt).toLocaleDateString("az")}`}
                active={data.curriculumKey === c.id}
                onActivate={() => switchTo(c.id)}
                onDelete={async () => {
                  await remove({ data: { curriculumId: c.id } });
                  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                  toast("Yol silindi");
                }}
              />
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function CurriculumRow({ title, meta, active, onActivate, onDelete }: { title: string; meta: string; active: boolean; onActivate: () => void; onDelete?: () => void }) {
  return (
    <li className={`flex items-center gap-3 rounded-2xl border p-3 ${active ? "border-primary bg-primary/10" : "border-border bg-surface"}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-raised text-primary">
        {active ? <FileUp className="size-5" /> : <FileText className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      {active ? (
        <span className="text-xs font-extrabold uppercase text-primary">Aktiv</span>
      ) : (
        <Button size="sm" variant="chunky" onClick={onActivate}>
          Aktiv et
        </Button>
      )}
      {onDelete && (
        <button onClick={onDelete} aria-label="Sil" className="rounded-lg p-2 text-muted-foreground hover:bg-surface-raised hover:text-destructive">
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  );
}
