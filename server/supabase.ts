import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

type InventoryEnv = "dev" | "demo" | "prod";

function envConfig(env: InventoryEnv) {
  const url = env === "prod"
    ? process.env.SUPABASE_URL_PROD ?? supabaseUrl
    : env === "demo"
      ? process.env.SUPABASE_URL_DEMO ?? process.env.SUPABASE_URL_DEV ?? supabaseUrl
      : process.env.SUPABASE_URL_DEV ?? supabaseUrl;
  const serviceRoleKey = env === "prod"
    ? process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ?? supabaseServiceKey
    : env === "demo"
      ? process.env.SUPABASE_SERVICE_ROLE_KEY_DEMO ?? process.env.SUPABASE_SERVICE_ROLE_KEY_DEV ?? supabaseServiceKey
      : process.env.SUPABASE_SERVICE_ROLE_KEY_DEV ?? supabaseServiceKey;
  const schema = env === "prod"
    ? process.env.SUPABASE_DB_SCHEMA_PROD ?? process.env.SUPABASE_DB_SCHEMA ?? "n8n_inventory"
    : env === "demo"
      ? process.env.SUPABASE_DB_SCHEMA_DEMO ?? process.env.SUPABASE_DB_SCHEMA_DEV ?? process.env.SUPABASE_DB_SCHEMA ?? "n8n_inventory"
      : process.env.SUPABASE_DB_SCHEMA_DEV ?? process.env.SUPABASE_DB_SCHEMA ?? "n8n_inventory";

  return { url, serviceRoleKey, schema };
}

const clients = new Map<InventoryEnv, any>();

export function parseInventoryEnv(value: unknown): InventoryEnv {
  if (value === "demo") return "demo";
  return value === "prod" ? "prod" : "dev";
}

export function getEnvStatus(environment: InventoryEnv = "dev") {
  const devConfig = envConfig("dev");
  const demoConfig = envConfig("demo");
  const prodConfig = envConfig("prod");

  return {
    environment,
    availableEnvironments: {
      dev: !!devConfig.url && !!devConfig.serviceRoleKey,
      demo: !!demoConfig.url && !!demoConfig.serviceRoleKey,
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

  const { url, serviceRoleKey, schema } = envConfig(environment);
  const client = createClient(url!, serviceRoleKey!, {
    db: { schema },
  });
  clients.set(environment, client);
  return client;
}
