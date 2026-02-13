import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

type InventoryEnv = "dev" | "prod";

function envConfig(env: InventoryEnv) {
  const url = env === "prod"
    ? process.env.SUPABASE_URL_PROD ?? supabaseUrl
    : process.env.SUPABASE_URL_DEV ?? supabaseUrl;
  const serviceRoleKey = env === "prod"
    ? process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ?? supabaseServiceKey
    : process.env.SUPABASE_SERVICE_ROLE_KEY_DEV ?? supabaseServiceKey;

  return { url, serviceRoleKey };
}

const clients = new Map<InventoryEnv, any>();

export function parseInventoryEnv(value: unknown): InventoryEnv {
  return value === "prod" ? "prod" : "dev";
}

export function getEnvStatus(environment: InventoryEnv = "dev") {
  const devConfig = envConfig("dev");
  const prodConfig = envConfig("prod");

  return {
    environment,
    availableEnvironments: {
      dev: !!devConfig.url && !!devConfig.serviceRoleKey,
      prod: !!prodConfig.url && !!prodConfig.serviceRoleKey,
    },
    supabaseUrl: !!envConfig(environment).url,
    supabaseAnonKey: !!supabaseAnonKey,
    supabaseServiceRoleKey: !!envConfig(environment).serviceRoleKey,
  };
}

export function isConfigured(environment: InventoryEnv = "dev"): boolean {
  const config = envConfig(environment);
  return !!config.url && !!config.serviceRoleKey;
}

export function getSupabaseClient(environment: InventoryEnv = "dev") {
  if (!isConfigured(environment)) {
    return null;
  }

  const cached = clients.get(environment);
  if (cached) return cached;

  const { url, serviceRoleKey } = envConfig(environment);
  const client = createClient(url!, serviceRoleKey!, {
    db: { schema: "n8n_inventory" },
  });
  clients.set(environment, client);
  return client;
}
