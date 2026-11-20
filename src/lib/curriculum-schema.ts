import { z } from "zod";

import type { Curriculum, NodeKind } from "@/data/curriculum";

const str = (max: number) => z.string().trim().min(1).max(max);

export const extractedCurriculumSchema = z.object({
  title: str(160),
  subject: str(80),
  grade: z.string().max(80),
  sections: z.array(z.object({ id: str(60), code: str(30), title: str(200), page: z.number().int().min(0) })).min(1).max(80),
  rules: z
    .array(
      z.object({
        id: str(60),
        sectionId: str(60),
        title: str(200),
        statement: str(2000),
        formula: z.string().max(600),
        example: z.object({ problem: z.string().max(600), solution: z.array(z.string().max(600)).max(10) }),
      }),
    )
    .min(1)
    .max(150),
  units: z
    .array(
      z.object({
        title: str(160),
        lessons: z
          .array(
            z.object({
              title: str(200),
              kind: z.enum(["star", "lightning", "review", "checkpoint"]),
              sectionId: str(60),
              questions: z
                .array(
                  z.object({
                    prompt: str(800),
                    options: z.array(z.string().trim().min(1).max(300)),
                    answer: z.number().int(),
                    ruleId: str(60),
                    steps: z.array(z.string().max(500)).max(8),
                  }),
                )
                .max(20),
            }),
          )
          .max(20),
      }),
    )
    .min(1)
    .max(12),
});

export type ExtractedCurriculum = z.infer<typeof extractedCurriculumSchema>;

/** JSON schema handed to the model (strict structured output). */
export const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "subject", "grade", "sections", "rules", "units"],
  properties: {
    title: { type: "string" },
    subject: { type: "string" },
    grade: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "code", "title", "page"],
        properties: {
          id: { type: "string" },
          code: { type: "string" },
          title: { type: "string" },
          page: { type: "integer" },
        },
      },
    },
    rules: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "sectionId", "title", "statement", "formula", "example"],
        properties: {
          id: { type: "string" },
          sectionId: { type: "string" },
          title: { type: "string" },
          statement: { type: "string" },
          formula: { type: "string" },
          example: {
            type: "object",
            additionalProperties: false,
            required: ["problem", "solution"],
            properties: {
              problem: { type: "string" },
              solution: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    units: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "lessons"],
        properties: {
          title: { type: "string" },
          lessons: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "kind", "sectionId", "questions"],
              properties: {
                title: { type: "string" },
                kind: { type: "string", enum: ["star", "lightning", "review", "checkpoint"] },
                sectionId: { type: "string" },
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["prompt", "options", "answer", "ruleId", "steps"],
                    properties: {
                      prompt: { type: "string" },
                      options: { type: "array", items: { type: "string" } },
                      answer: { type: "integer" },
                      ruleId: { type: "string" },
                      steps: { type: "array", items: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

const slug = (s: string, i: number) =>
  `${s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "lesson"}-${i + 1}`;

/** Turns raw model output into a playable curriculum; drops anything that breaks references. */
export function normalizeExtracted(raw: ExtractedCurriculum, fileName: string): Curriculum {
  const sectionIds = new Set(raw.sections.map((s) => s.id));
  const fallbackSection = raw.sections[0]!.id;
  const rules = raw.rules.map((r) => ({ ...r, sectionId: sectionIds.has(r.sectionId) ? r.sectionId : fallbackSection }));
  const ruleIds = new Set(rules.map((r) => r.id));
  let lessonIndex = 0;

  const units = raw.units
    .map((u, ui) => ({
      id: `u${ui + 1}`,
      number: ui + 1,
      title: u.title,
      subtitle: `Unit ${ui + 1}`,
      tone: ((ui % 3) + 1) as 1 | 2 | 3,
      lessons: u.lessons
        .map((l) => {
          const questions = l.questions
            .filter((q) => q.options.length >= 4 && ruleIds.has(q.ruleId) && q.answer >= 0 && q.answer <= 3)
            .map((q, qi) => ({
              id: `q${qi + 1}`,
              prompt: q.prompt,
              options: q.options.slice(0, 4) as [string, string, string, string],
              answer: q.answer as 0 | 1 | 2 | 3,
              ruleId: q.ruleId,
              steps: q.steps,
            }));
          return {
            id: slug(l.title, lessonIndex++),
            title: l.title,
            kind: l.kind as NodeKind,
            sectionId: sectionIds.has(l.sectionId) ? l.sectionId : fallbackSection,
            questions,
          };
        })
        .filter((l) => l.questions.length > 0),
    }))
    .filter((u) => u.lessons.length > 0)
    .map((u, i) => ({ ...u, id: `u${i + 1}`, number: i + 1, subtitle: `Unit ${i + 1}`, tone: ((i % 3) + 1) as 1 | 2 | 3 }));

  return {
    source: {
      file: fileName,
      pages: Math.max(1, ...raw.sections.map((s) => s.page)),
      subject: raw.subject,
      grade: raw.grade,
    },
    sections: raw.sections,
    rules,
    units,
  };
}
