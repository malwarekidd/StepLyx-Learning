import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { curriculumStats } from "@/data/curriculum";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import {
  EXTRACTION_PROMPT,
  extractedCurriculumSchema,
  extractionJsonSchema,
  normalizeExtracted,
  type ExtractedCurriculum,
} from "@/lib/curriculum-schema";

export const parseCurriculumPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { path: string; fileName: string }) =>
    z.object({ path: z.string().min(3).max(300), fileName: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.path.startsWith(`${userId}/`)) throw new Error("Fayla icazə yoxdur");

    const { data: file, error: downloadError } = await supabase.storage.from("curriculum-pdfs").download(data.path);
    if (downloadError || !file) throw new Error("PDF faylı oxunmadı");
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    let text = "";
    try {
      const response = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: EXTRACTION_PROMPT,
        input: [
          {
            role: "user",
            content: [
              { type: "input_file", filename: data.fileName, file_data: `data:application/pdf;base64,${base64}` },
              { type: "input_text", text: "Bu PDF-dən öyrənmə yolunu JSON formatında qur." },
            ],
          },
        ],
        text: {
          format: { type: "json_schema", name: "curriculum", strict: true, schema: extractionJsonSchema },
        },
      });
      text = extractOutputText(response);
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("PDF extraction failed", e.code, e.httpStatus, e.ids);
        if (e.httpStatus === 429) throw new Error("Hazırda çox sorğu var. Bir az sonra yenidən cəhd edin.");
        if (e.httpStatus === 402) throw new Error("AI krediti bitib. İş sahəsinin kreditini artırın.");
        throw new Error("AI PDF-i emal edə bilmədi. Başqa fayl ilə yoxlayın.");
      }
      throw e;
    }

    let parsed;
    try {
      parsed = extractedCurriculumSchema.parse(JSON.parse(text));
    } catch (e) {
      console.error("Invalid extraction output", e);
      throw new Error("PDF-dən struktur çıxarıla bilmədi. Daha aydın mətnli PDF yükləyin.");
    }
    return storeCurriculum(supabase, userId, parsed, data.fileName);
  });

export const saveExtractedCurriculum = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { fileName: string; extracted: unknown }) =>
    z.object({ fileName: z.string().min(1).max(200), extracted: extractedCurriculumSchema }).parse(input),
  )
  .handler(async ({ data, context }) => storeCurriculum(context.supabase, context.userId, data.extracted, data.fileName));

async function storeCurriculum(supabase: SupabaseClient<Database>, userId: string, parsed: ExtractedCurriculum, fileName: string) {
  const curriculum = normalizeExtracted(parsed, fileName);
  if (curriculum.units.length === 0) throw new Error("PDF-də sual yaratmaq üçün kifayət qədər məzmun tapılmadı.");
  const { data: row, error } = await supabase
    .from("curricula")
    .insert({ owner_id: userId, title: parsed.title, source_file: fileName, data: JSON.parse(JSON.stringify(curriculum)) })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("profiles").update({ active_curriculum_id: row.id }).eq("id", userId);
  return { id: row.id, title: parsed.title, curriculum, stats: curriculumStats(curriculum) };
}

function extractOutputText(response: unknown): string {
  const r = response as { output_text?: string; output?: { type: string; content?: { type: string; text?: string }[] }[] };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  return (r.output ?? [])
    .flatMap((o) => (o.type === "message" ? (o.content ?? []) : []))
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");
}
