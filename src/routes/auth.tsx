import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Brand } from "@/components/learn/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const safePath = (p?: string) => {
  if (!p) return "/learn";
  try {
    const u = new URL(p, "http://x");
    return u.pathname.startsWith("/") && !u.pathname.startsWith("//") ? u.pathname + u.search : "/learn";
  } catch {
    return "/learn";
  }
};

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Daxil ol — LEARNWITHAI" },
      { name: "description", content: "LEARNWITHAI hesabına daxil ol və öyrənmə yoluna davam et." },
      { property: "og:title", content: "Daxil ol — LEARNWITHAI" },
      { property: "og:description", content: "LEARNWITHAI hesabına daxil ol və öyrənmə yoluna davam et." },
    ],
  }),
  component: AuthPage,
});

const GoogleG = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
  </svg>
);

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const target = safePath(redirect);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const go = () => {
      const stored = sessionStorage.getItem("lwai-after-auth");
      sessionStorage.removeItem("lwai-after-auth");
      navigate({ to: redirect ? target : safePath(stored ?? undefined), replace: true });
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" && s) go();
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, target, redirect]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name: name.trim() || undefined } },
        });
        if (error) throw error;
        if (!data.session) toast.success("Təsdiq linki e-poçtuna göndərildi. Linkə klikləyib daxil ol.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: "google" | "lovable") {
    sessionStorage.setItem("lwai-after-auth", target);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) toast.error("Daxil olmaq alınmadı. Yenidən cəhd et.");
  }

  return (
    <main className="dashed-grid flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center">
          <Brand className="text-2xl" />
        </Link>
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-extrabold">{mode === "signin" ? "Yenidən xoş gəldin" : "Hesab yarat"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Seriyanı qoru və yola davam et." : "XP topla, seriya qur, liderlər cədvəlinə düş."}
          </p>

          <div className="mt-6 grid gap-3">
            <Button type="button" variant="chunky" size="xl" className="w-full" onClick={() => social("google")}>
              <GoogleG /> Continue with Google
            </Button>
            <Button type="button" variant="chunky" size="xl" className="w-full" onClick={() => social("lovable")}>
              <LovableMark className="size-[18px]" /> Continue with Lovable
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> və ya e-poçt <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            {mode === "signup" && (
              <div className="grid gap-2">
                <Label htmlFor="name">Ad</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Məs. Leyla" />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">E-poçt</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Şifrə</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            <Button type="submit" variant="brand" size="xl" disabled={busy} className="mt-2 w-full">
              {busy && <Loader2 className="animate-spin" />}
              {mode === "signin" ? "Daxil ol" : "Qeydiyyatdan keç"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Hesabın yoxdur?" : "Artıq hesabın var?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-bold text-primary hover:underline"
            >
              {mode === "signin" ? "Qeydiyyat" : "Daxil ol"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
