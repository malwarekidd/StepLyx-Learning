import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, FileUp, GraduationCap, Lock, Star, Trophy, Zap } from "lucide-react";

import { Brand } from "@/components/learn/Brand";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "steplyx-learning — PDF-ini öyrənmə yoluna çevir" },
      { name: "description", content: "Kurikulum PDF-ini yüklə: AI dərslər, testlər, qaydalar və şəxsi müəllim ilə interaktiv öyrənmə yolu qursun." },
      { property: "og:title", content: "steplyx-learning — PDF-ini öyrənmə yoluna çevir" },
      { property: "og:description", content: "Kurikulum PDF-ini yüklə: AI dərslər, testlər, qaydalar və şəxsi müəllim ilə interaktiv öyrənmə yolu qursun." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: FileUp, title: "PDF → yol", text: "Unitlər, dərslər, suallar və qaydalar PDF-dən avtomatik çıxarılır." },
  { icon: BookOpen, title: "Bilmirsənsə qaydaya bax", text: "Hər sualın altında PDF mənbəli qayda və addım-addım həll." },
  { icon: GraduationCap, title: "AI müəllim", text: "Cari sualı və qaydaları bilən, cavabı yox, yolu göstərən köməkçi." },
  { icon: Trophy, title: "Seriya və reytinq", text: "XP, gündəlik seriya, ümumi və mövzu üzrə liderlər cədvəli." },
];

function Landing() {
  const { session } = useSession();
  const cta = session ? "/learn" : "/auth";
  return (
    <div className="min-h-screen bg-glow">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Brand />
        <Button asChild variant="chunky" size="sm">
          <Link to={cta}>{session ? "Yola davam et" : "Daxil ol"}</Link>
        </Button>
      </header>

      <main className="mx-auto grid max-w-5xl items-center gap-12 px-4 pb-20 pt-10 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
        <section>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-primary">
            <Zap className="size-3.5 fill-primary" /> AI öyrənmə platforması
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            PDF-ini yüklə.
            <br />
            <span className="text-brand-gradient">AI onu yola çevirsin.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Kurikulumdan interaktiv dərslər, 4 variantlı testlər və hər suala aid qaydalar — seriya, XP və şəxsi AI müəllimlə.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="brand" size="xl">
              <Link to={cta}>{session ? "Yola davam et" : "Pulsuz başla"}</Link>
            </Button>
          </div>
        </section>

        <section aria-hidden className="relative mx-auto w-full max-w-sm" data-tone="1">
          <div className="press-3d rounded-2xl bg-tone p-4 text-primary-foreground">
            <p className="text-xs font-extrabold uppercase tracking-wider opacity-85">Unit 1</p>
            <p className="font-display text-xl font-extrabold">Natural ədədlər</p>
          </div>
          <div className="relative mt-10 flex flex-col items-center gap-8">
            {[
              { x: 0, s: "completed", I: Star },
              { x: 56, s: "active", I: Zap },
              { x: 0, s: "locked", I: Lock },
              { x: -56, s: "locked", I: Lock },
            ].map(({ x, s, I }, i) => (
              <div key={i} className="relative" style={{ transform: `translateX(${x}px)` }}>
                {s === "active" && (
                  <>
                    <span className="callout-float absolute bottom-[calc(100%+14px)] left-1/2 rounded-xl border-2 border-border bg-surface px-3 py-1 font-display text-sm font-extrabold tracking-wider text-tone">
                      BAŞLAT
                    </span>
                    <span className="node-ring absolute -inset-2" />
                  </>
                )}
                <span data-status={s} className="path-node press-3d size-[68px]">
                  <I className={s === "locked" ? "size-6" : "size-8 fill-current"} strokeWidth={s === "locked" ? 2.5 : 1.5} />
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border border-border bg-surface p-5">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Icon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
