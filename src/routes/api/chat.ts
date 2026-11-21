import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { findLesson, getRule, OPTION_LETTERS, type Curriculum } from "@/data/curriculum";
import type { Database } from "@/integrations/supabase/types";
import { loadCurriculum } from "@/lib/curriculum-store";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
  context: z.object({
    curriculumKey: z.string().max(64),
    lessonId: z.string().max(80).optional(),
    questionIndex: z.number().int().min(0).max(30).optional(),
    answered: z.boolean().optional(),
  }),
});

function userClient(token: string) {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
        if (token.split(".").length !== 3) return new Response("Unauthorized", { status: 401 });
        const supabase = userClient(token);
        const { data: claims } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { message, context } = parsed.data;

        const active = await loadCurriculum(supabase, context.curriculumKey);
        const instructions = buildTutorPrompt(active.curriculum, active.title, context);

        const { data: history } = await supabase
          .from("chat_messages")
          .select("role, content")
          .order("created_at", { ascending: false })
          .limit(20);

        const { error: insertError } = await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: message });
        if (insertError) return new Response("Could not save message", { status: 500 });

        const { streamResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
        const input = [
          ...(history ?? []).reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: message },
        ];

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            let full = "";
            try {
              const events = await streamResponse({ model: "openai/gpt-6-astra", instructions, input }, { signal: request.signal });
              for await (const event of events) {
                const e = event as { type?: string; delta?: string };
                if (e.type === "response.output_text.delta" && e.delta) {
                  full += e.delta;
                  controller.enqueue(encoder.encode(e.delta));
                }
              }
            } catch (err) {
              const note =
                err instanceof GatewayError && err.httpStatus === 429
                  ? "\n\n_Hazırda çox sorğu var, bir az sonra yenidən yaz._"
                  : err instanceof GatewayError && err.httpStatus === 402
                    ? "\n\n_AI krediti bitib._"
                    : "\n\n_Cavab yarımçıq qaldı. Yenidən cəhd et._";
              console.error("Tutor stream failed", err);
              full += note;
              controller.enqueue(encoder.encode(note));
            } finally {
              if (full.trim()) {
                const { error } = await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: full });
                if (error) console.error("Saving assistant message failed", error);
              }
              controller.close();
            }
          },
        });
        return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
      },
    },
  },
});

function buildTutorPrompt(
  c: Curriculum,
  title: string,
  ctx: z.infer<typeof bodySchema>["context"],
) {
  const lines = [
    "Sən steplyx-learning platformasının mehriban AI müəllimisən (riyaziyyat və digər fənlər).",
    "Azərbaycan dilində qısa, aydın cavab ver; düsturları və addımları markdown ilə yaz.",
    "Sokratik üsul: şagirdi addım-addım istiqamətləndir. Aktiv sual hələ cavablandırılmayıbsa, düzgün variantı birbaşa demə — qaydanı və növbəti addımı izah et.",
    "Yalnız aşağıdakı PDF qaydalarına əsaslan; mövzudan kənar suallarda nəzakətlə dərsə qaytar.",
    `Kurikulum: ${title} (${c.source.file}).`,
    `Unitlər: ${c.units.map((u) => `${u.subtitle}: ${u.title} [${u.lessons.map((l) => l.title).join("; ")}]`).join(" | ")}`,
  ];
  const found = ctx.lessonId ? findLesson(ctx.lessonId, c) : undefined;
  if (found) {
    lines.push(`Cari dərs: ${found.lesson.title} (${found.unit.subtitle} — ${found.unit.title}).`);
    const q = ctx.questionIndex !== undefined ? found.lesson.questions[ctx.questionIndex] : undefined;
    if (q) {
      lines.push(
        `Aktiv sual (Sual ${(ctx.questionIndex ?? 0) + 1}): ${q.prompt}`,
        `Variantlar: ${q.options.map((o, i) => `${OPTION_LETTERS[i]}) ${o}`).join("  ")}`,
        ctx.answered
          ? `Şagird artıq cavab verib. Düzgün cavab: ${OPTION_LETTERS[q.answer]}) ${q.options[q.answer]}. İndi izah edə bilərsən.`
          : "Şagird hələ cavab verməyib — düzgün cavabı açıqlama.",
      );
    }
    const ruleIds = new Set(found.lesson.questions.map((x) => x.ruleId));
    const rules = [...ruleIds].map((id) => getRule(id, c)).filter(Boolean);
    lines.push(
      "Bu dərsin PDF qaydaları:",
      ...rules.map((r) => `- ${r!.title}: ${r!.statement} Düstur: ${r!.formula}`),
    );
  } else {
    lines.push("Bütün PDF qaydaları:", ...c.rules.slice(0, 60).map((r) => `- ${r.title}: ${r.formula}`));
  }
  return lines.join("\n");
}
