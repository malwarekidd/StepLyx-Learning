import type { SupabaseClient } from "@supabase/supabase-js";

import { curriculum as sampleCurriculum, type Curriculum } from "@/data/curriculum";
import type { Database } from "@/integrations/supabase/types";

export const SAMPLE_KEY = "sample";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface LoadedCurriculum {
  key: string;
  title: string;
  curriculum: Curriculum;
}

export async function loadCurriculum(
  supabase: SupabaseClient<Database>,
  key: string | null | undefined,
): Promise<LoadedCurriculum> {
  if (!key || key === SAMPLE_KEY || !UUID.test(key)) {
    return { key: SAMPLE_KEY, title: "Riyaziyyat 5 — nümunə kurikulum", curriculum: sampleCurriculum };
  }
  const { data, error } = await supabase.from("curricula").select("id, title, data").eq("id", key).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { key: SAMPLE_KEY, title: "Riyaziyyat 5 — nümunə kurikulum", curriculum: sampleCurriculum };
  return { key: data.id, title: data.title, curriculum: data.data as unknown as Curriculum };
}
