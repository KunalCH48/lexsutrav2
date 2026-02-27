import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    "[LexSutra] Supabase env vars not set — database features unavailable."
  );
}

export const supabase = createClient(url ?? "", key ?? "");
