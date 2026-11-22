import { CheckCircle2, KeyRound, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearByok, loadByok, maskKey, PROVIDERS, saveByok, testByok, validateByok, type ByokProvider, type ByokSettings } from "@/lib/byok";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onChange: (s: ByokSettings | null) => void };

export function ByokSettingsDialog({ open, onOpenChange, onChange }: Props) {
  const [saved, setSaved] = useState<ByokSettings | null>(null);
  const [provider, setProvider] = useState<ByokProvider>("gemini");
  const [model, setModel] = useState(PROVIDERS.gemini.model);
  const [baseUrl, setBaseUrl] = useState("");
  const [key, setKey] = useState("");
  const [test, setTest] = useState<{ state: "idle" | "running" | "ok" | "fail"; msg?: string }>({ state: "idle" });

  useEffect(() => {
    if (!open) return;
    const s = loadByok();
    setSaved(s);
    setProvider(s?.provider ?? "gemini");
    setModel(s?.model ?? PROVIDERS.gemini.model);
    setBaseUrl(s?.baseUrl ?? "");
    setKey("");
    setTest({ state: "idle" });
  }, [open]);

  const draft = (): ByokSettings => ({
    provider,
    model: model.trim(),
    baseUrl: provider === "custom" ? baseUrl.trim() : "",
    apiKey: key.trim() || saved?.apiKey || "",
  });

  const choose = (p: ByokProvider) => {
    setProvider(p);
    setModel(p === saved?.provider ? saved.model : PROVIDERS[p].model);
    setTest({ state: "idle" });
  };

  const runTest = async () => {
    const s = draft();
    const invalid = validateByok(s);
    if (invalid) return setTest({ state: "fail", msg: invalid });
    setTest({ state: "running" });
    try {
      await testByok(s);
      setTest({ state: "ok", msg: "Bağlantı işləyir." });
    } catch (e) {
      setTest({ state: "fail", msg: e instanceof Error ? e.message : "Bağlantı alınmadı." });
    }
  };

  const save = () => {
    const s = draft();
    const invalid = validateByok(s);
    if (invalid) return setTest({ state: "fail", msg: invalid });
    saveByok(s);
    onChange(s);
    toast.success("AI ayarları yadda saxlandı");
    onOpenChange(false);
  };

  const clear = () => {
    clearByok();
    onChange(null);
    setSaved(null);
    setKey("");
    toast("API açarı silindi");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" /> Öz AI açarın
          </DialogTitle>
          <DialogDescription>Açar yalnız bu brauzerdə saxlanılır və birbaşa seçdiyin provayderə göndərilir.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Provayder">
            {(Object.keys(PROVIDERS) as ByokProvider[]).map((p) => (
              <button
                key={p}
                role="radio"
                aria-checked={provider === p}
                onClick={() => choose(p)}
                className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors ${
                  provider === p ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/60"
                }`}
              >
                {PROVIDERS[p].label}
              </button>
            ))}
          </div>

          {provider === "custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="byok-base">Base URL</Label>
              <Input id="byok-base" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" />
              <p className="text-xs text-muted-foreground">/chat/completions ilə işləyən OpenAI-uyğun endpoint.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="byok-model">Model</Label>
            <Input id="byok-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder={PROVIDERS[provider].model || "model-adı"} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="byok-key">API açarı</Label>
            <Input
              id="byok-key"
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={saved ? `Saxlanılıb: ${maskKey(saved.apiKey)}` : provider === "gemini" ? "AIza..." : "sk-..."}
            />
            {saved && <p className="text-xs text-muted-foreground">Boş saxlasan, mövcud açar qalacaq.</p>}
          </div>

          {test.state !== "idle" && (
            <p
              className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
                test.state === "ok" ? "bg-success/15 text-success" : test.state === "fail" ? "bg-destructive/15 text-destructive" : "bg-surface-raised text-muted-foreground"
              }`}
            >
              {test.state === "running" ? (
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
              ) : test.state === "ok" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0" />
              )}
              {test.state === "running" ? "Yoxlanılır..." : test.msg}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" onClick={runTest} disabled={test.state === "running"}>
              Bağlantını yoxla
            </Button>
            {saved && (
              <Button variant="ghost" onClick={clear} className="text-destructive hover:text-destructive">
                Açarı sil
              </Button>
            )}
            <Button variant="brand" onClick={save} className="ml-auto">
              Yadda saxla
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
