import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const key = supabaseServiceKey || supabaseAnonKey;

export function getEnvStatus() {
  return {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey,
    supabaseServiceRoleKey: !!supabaseServiceKey,
  };
}

export function isConfigured(): boolean {
  return !!supabaseUrl && !!key;
}

export const supabase = supabaseUrl && key
  ? createClient(supabaseUrl, key, {
      db: { schema: "n8n_inventory" },
    })
  : null;
