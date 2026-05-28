import { createClient } from "@supabase/supabase-js";

export type Env = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

export function createSupabaseAdmin(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      // Worker backend içinde session saklamaya gerek yok.
      persistSession: false,

      // Backend request bazlı çalışacağı için token refresh de gerekmiyor.
      autoRefreshToken: false,
    },
  });
}