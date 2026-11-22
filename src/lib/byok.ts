import { EXTRACTION_PROMPT, extractedCurriculumSchema, extractionJsonSchema, type ExtractedCurriculum } from "@/lib/curriculum-schema";

export type ByokProvider = "gemini" | "openai" | "custom";
export type ByokSettings = { provider: ByokProvider; apiKey: string; model: string; baseUrl: string };
export type ByokErrorKind = "config" | "auth" | "forbidden" | "quota" | "model" | "request" | "server" | "network" | "json" | "empty";

export const PROVIDERS: Record<ByokProvider, { label: string; baseUrl: string; model: string }> = {
  gemini: { label: "Gemini API", baseUrl: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.5-flash" },
  openai: { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  custom: { label: "OpenAI-uyğun URL", baseUrl: "", model: "" },
};

const STORAGE_KEY = "steplyx-byok";

export class ByokError extends Error {
  constructor(
    public kind: ByokErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "ByokError";
  }
}

export function maskKey(key: string) {
  const k = key.trim();
  return k.length <= 10 ? "••••••" : `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

export function loadByok(): ByokSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as ByokSettings | null;
    return s && s.provider in PROVIDERS && s.apiKey && s.model ? s : null;
  } catch {
    return null;
  }
}

export const saveByok = (s: ByokSettings) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
export const clearByok = () => localStorage.removeItem(STORAGE_KEY);

export function validateByok(s: ByokSettings): string | null {
  if (!s.apiKey.trim()) return "API açarını daxil et.";
  if (!s.model.trim()) return "Model adını daxil et.";
  const base = baseUrlOf(s);
  try {
    const u = new URL(base);
    if (u.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(u.hostname)) return "Base URL https:// ilə başlamalıdır.";
  } catch {
    return "Base URL düzgün deyil (məs. https://api.example.com/v1).";
  }
  return null;
}

const baseUrlOf = (s: ByokSettings) => (s.provider === "custom" ? s.baseUrl : s.baseUrl || PROVIDERS[s.provider].baseUrl).trim().replace(/\/+$/, "");

export function errorForStatus(status: number, detail = ""): ByokError {
  const d = detail.slice(0, 180);
  if (status === 401 || /API_KEY_INVALID|API key not valid|invalid api key|incorrect api key/i.test(d))
    return new ByokError("auth", "API açarı yanlışdır və ya etibarsızdır. Ayarlarda açarı yoxla.");
  if (status === 403) return new ByokError("forbidden", "Bu açarın seçilmiş modelə və ya API-yə icazəsi yoxdur (403). Açarın icazələrini və modeli yoxla.");
  if (status === 429) return new ByokError("quota", "Limit və ya kvota bitib (429). Bir az gözlə və ya provayderdə balansını yoxla.");
  if (status === 404) return new ByokError("model", "Model və ya endpoint tapılmadı (404). Model adını və base URL-i yoxla.");
  if (status >= 500) return new ByokError("server", `Provayder hazırda cavab vermir (${status}). Bir az sonra yenidən cəhd et.`);
  return new ByokError("request", `Provayder sorğunu qəbul etmədi (${status})${d ? `: ${d}` : "."}`);
}

export function parseModelJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  try {
    if (start < 0 || end <= start) throw new Error();
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    throw new ByokError("json", "AI cavabı düzgün JSON deyil (bəlkə yarımçıq kəsilib). Yenidən cəhd et və ya daha güclü model seç.");
  }
}

export function parseExtraction(text: string): ExtractedCurriculum {
  const r = extractedCurriculumSchema.safeParse(parseModelJson(text));
  if (!r.success) throw new ByokError("json", "AI cavabı gözlənilən struktura uyğun gəlmir (unit, dərs, sual, qayda). Yenidən cəhd et və ya başqa model seç.");
  return r.data;
}

async function complete(s: ByokSettings, system: string, user: string, json: boolean, signal?: AbortSignal): Promise<string> {
  const invalid = validateByok(s);
  if (invalid) throw new ByokError("config", invalid);
  const base = baseUrlOf(s);
  const key = s.apiKey.trim();
  const gemini = s.provider === "gemini";
  const url = gemini ? `${base}/models/${encodeURIComponent(s.model.trim().replace(/^models\//, ""))}:generateContent` : `${base}/chat/completions`;
  const body = gemini
    ? {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: json ? { responseMimeType: "application/json", temperature: 0.4 } : {},
      }
    : {
        model: s.model.trim(),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        ...(json && s.provider === "openai" ? { response_format: { type: "json_object" } } : {}),
      };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      signal: signal ?? null,
      headers: { "Content-Type": "application/json", ...(gemini ? { "x-goog-api-key": key } : { Authorization: `Bearer ${key}` }) },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ByokError("network", "Provayderə qoşulmaq olmadı. İnterneti yoxla; custom endpoint brauzer sorğularına (CORS) icazə verməlidir.");
  }
  const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    const err = payload?.["error"] as { message?: string; status?: string } | string | undefined;
    throw errorForStatus(res.status, typeof err === "string" ? err : `${err?.status ?? ""} ${err?.message ?? ""}`.trim());
  }
  const text = gemini ? geminiText(payload) : openAiText(payload);
  if (!text.trim()) throw new ByokError("empty", "AI boş cavab qaytardı (məzmun filtri və ya limit). Başqa model və ya daha qısa PDF ilə yoxla.");
  return text;
}

function geminiText(p: Record<string, unknown> | null) {
  const c = (p?.["candidates"] as { content?: { parts?: { text?: string }[] } }[] | undefined)?.[0];
  return (c?.content?.parts ?? []).map((x) => x.text ?? "").join("");
}

function openAiText(p: Record<string, unknown> | null) {
  const c = (p?.["choices"] as { message?: { content?: string } }[] | undefined)?.[0];
  return c?.message?.content ?? "";
}

export async function testByok(s: ByokSettings) {
  await complete(s, "Reply with the single word OK.", "ping", false);
}

export async function analyzeWithByok(s: ByokSettings, pdfText: string, fileName: string, signal?: AbortSignal) {
  const system = `${EXTRACTION_PROMPT}\n\nCavabı YALNIZ bu JSON Schema-ya tam uyğun tək JSON obyekti kimi qaytar, başqa mətn yazma:\n${JSON.stringify(extractionJsonSchema)}`;
  const text = await complete(s, system, `Fayl: ${fileName}\n\nPDF-in mətni ([Səhifə N] işarələri ilə):\n${pdfText}`, true, signal);
  return parseExtraction(text);
}
