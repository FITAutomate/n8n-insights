export type RuntimeEnv = "dev" | "demo" | "prod";

const STORAGE_KEY = "fit-insights-runtime-env";

export function normalizeRuntimeEnv(value: unknown): RuntimeEnv {
  if (value === "demo") return "demo";
  return value === "prod" ? "prod" : "dev";
}

export function getRuntimeEnv(): RuntimeEnv {
  if (typeof window === "undefined") return "dev";
  return normalizeRuntimeEnv(window.localStorage.getItem(STORAGE_KEY));
}

export function setRuntimeEnv(value: RuntimeEnv) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value);
}

export function withRuntimeEnv(url: string): string {
  if (!url.startsWith("/api")) return url;
  const env = getRuntimeEnv();
  const [path, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  params.set("env", env);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
