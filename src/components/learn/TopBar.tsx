import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, FileUp, Flame, LogOut, Map, Menu, Trophy, Zap } from "lucide-react";
import { useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { curriculumStats } from "@/data/curriculum";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardMaybe } from "@/lib/queries";
import { Brand } from "./Brand";

const navItems = [
  { to: "/learn", label: "Öyrənmə yolu", icon: Map },
  { to: "/leaderboard", label: "Liderlər cədvəli", icon: Trophy },
  { to: "/upload", label: "PDF yüklə / yol qur", icon: FileUp },
] as const;

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "ŞG"
  );
}

export function TopBar() {
  const { data } = useDashboardMaybe();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: {}, replace: true });
  }

  const stats = data?.stats;
  const cs = data ? curriculumStats(data.curriculum) : null;
  const accuracy = stats && stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-3xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Menyunu aç"
            className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            <Menu className="size-6" />
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col gap-6 overflow-y-auto border-border bg-surface">
            <SheetHeader className="text-left">
              <SheetTitle>
                <Brand />
              </SheetTitle>
              <SheetDescription>{data?.profile.displayName ?? "Şagird"}</SheetDescription>
            </SheetHeader>

            <nav className="flex flex-col gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-foreground hover:bg-surface-raised"
                  activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/15" }}
                >
                  <Icon className="size-5" /> {label}
                </Link>
              ))}
            </nav>

            {stats && cs && (
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Ümumi XP" value={stats.xp} />
                <Stat label="Seriya" value={`${stats.streak} gün`} />
                <Stat label="Dəqiqlik" value={`${accuracy}%`} />
                <Stat label="Düz / cəmi" value={`${stats.correct} / ${stats.answered}`} />
                <div className="col-span-2 rounded-2xl border border-border bg-background/60 p-3">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <BookOpenCheck className="size-4" /> Aktiv PDF
                  </p>
                  <p className="mt-1 truncate font-semibold">{data.curriculum.source.file}</p>
                  <p className="text-xs text-muted-foreground">
                    {cs.units} unit · {cs.lessons} dərs · {cs.questions} sual · {cs.rules} qayda
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={signOut}
              className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-muted-foreground hover:bg-surface-raised hover:text-foreground"
            >
              <LogOut className="size-4" /> Çıxış
            </button>
          </SheetContent>
        </Sheet>

        <Link to="/learn" className="justify-self-center">
          <Brand />
        </Link>

        <div className="flex items-center justify-self-end gap-2">
          <span
            className={`flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-sm font-bold ${stats?.activeToday ? "text-gold" : "text-muted-foreground"}`}
            title={stats?.activeToday ? "Bu gün seriya qorunub" : "Seriyanı qorumaq üçün bu gün bir dərs bitir"}
          >
            <Flame className={`size-4 ${stats?.activeToday ? "fill-gold" : ""}`} /> {stats?.streak ?? 0}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-2.5 pr-1 text-sm font-bold">
            <Zap className="size-4 fill-primary text-primary" />
            <span className="hidden sm:inline">{stats?.xp ?? 0}</span>
            <span className="relative ml-0.5 grid size-7 place-items-center overflow-hidden rounded-full bg-primary/20 font-display text-xs font-extrabold text-primary">
              {data?.profile.avatarUrl ? (
                <img src={data.profile.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initials(data?.profile.displayName ?? "")
              )}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-lg font-extrabold">{value}</p>
    </div>
  );
}
