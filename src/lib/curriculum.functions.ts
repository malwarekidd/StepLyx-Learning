import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { curriculumStats } from "@/data/curriculum";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { extractedCurriculumSchema, extractionJsonSchema, normalizeExtracted } from "@/lib/curriculum-schema";

const EXTRACTION_PROMPT = `Sən kurikulum PDF-lərini interaktiv öyrənmə yoluna çevirən ekspertsən.
PDF-i oxu və aşağıdakıları çıxar:
- sections: PDF-in bölmələri (id qısa və unikal, məs. "s1-2"; code məs. "§1.2"; page — bölmənin başladığı səhifə).
- rules: hər bölmədəki qaydalar/düsturlar. statement — qaydanın mətnə sadiq izahı, formula — qısa düstur və ya şərt, example — qısa həll olunmuş nümunə (addımlarla).
- units: PDF ardıcıllığına uyğun 1-8 unit; hər unitdə 2-6 dərs (lesson). Hər unitin sonunda "review" və ya "checkpoint" növlü təkrar dərsi əlavə et. Adi dərslər üçün kind "star" və ya "lightning".
- Hər dərsdə 3-5 test sualı: tam 4 variant (options), answer — düzgün variantın 0-3 indeksi, ruleId — sualı həll etmək üçün lazım olan qaydanın id-si (rules siyahısından), steps — həmin sualı həll etmək üçün 2-4 addım; son addım cavabı birbaşa deməsin.
Qaydalar və suallar yalnız PDF-dəki məzmuna əsaslansın. Düzgün variantların yerini qarışdır. PDF hansı dildədirsə, o dildə yaz (default: Azərbaycan dili).`;

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
    const curriculum = normalizeExtracted(parsed, data.fileName);
    if (curriculum.units.length === 0) throw new Error("PDF-də sual yaratmaq üçün kifayət qədər məzmun tapılmadı.");

    const { data: row, error } = await supabase
      .from("curricula")
      .insert({ owner_id: userId, title: parsed.title, source_file: data.fileName, data: JSON.parse(JSON.stringify(curriculum)) })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("profiles").update({ active_curriculum_id: row.id }).eq("id", userId);

    return { id: row.id, title: parsed.title, curriculum, stats: curriculumStats(curriculum) };
  });

function extractOutputText(response: unknown): string {
  const r = response as { output_text?: string; output?: { type: string; content?: { type: string; text?: string }[] }[] };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  return (r.output ?? [])
    .flatMap((o) => (o.type === "message" ? (o.content ?? []) : []))
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");
}
