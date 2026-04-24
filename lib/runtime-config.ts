import "server-only";

const SUPPORTED_AI_PROVIDERS = ["openai", "anthropic"] as const;
const SUPPORTED_GENERATED_TOOLS_BACKENDS = ["filesystem"] as const;
const SUPPORTED_AGENT_SESSION_STORES = ["memory"] as const;

type AIProvider = (typeof SUPPORTED_AI_PROVIDERS)[number];
type GeneratedToolsBackend =
  (typeof SUPPORTED_GENERATED_TOOLS_BACKENDS)[number];
type AgentSessionStoreBackend =
  (typeof SUPPORTED_AGENT_SESSION_STORES)[number];

function readEnumEnv<T extends string>(
  envName: string,
  fallback: T,
  supported: readonly T[],
): T {
  const value = (process.env[envName] ?? fallback) as T;
  if (supported.includes(value)) {
    return value;
  }

  throw new Error(
    `Unsupported ${envName}: ${value}. Supported values: ${supported.join(", ")}`,
  );
}

function readIntEnv(
  envName: string,
  fallback: number,
): number {
  const raw = process.env[envName];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  throw new Error(
    `Unsupported ${envName}: ${raw}. Expected a positive integer.`,
  );
}

export const AI_PROVIDER: AIProvider = readEnumEnv(
  "AI_PROVIDER",
  "openai",
  SUPPORTED_AI_PROVIDERS,
);

export const AI_API_KEY = process.env.AI_API_KEY;
export const AI_BASE_URL = process.env.AI_BASE_URL?.trim() || null;
export const AI_MODEL = process.env.AI_MODEL?.trim() || null;
export const AI_MAX_TOKENS = readIntEnv("AI_MAX_TOKENS", 16000);
export const AI_TIMEOUT = readIntEnv("AI_TIMEOUT", 120000);

export const GENERATED_TOOLS_BACKEND: GeneratedToolsBackend = readEnumEnv(
  "GENERATED_TOOLS_BACKEND",
  "filesystem",
  SUPPORTED_GENERATED_TOOLS_BACKENDS,
);

export const AGENT_SESSION_STORE: AgentSessionStoreBackend = readEnumEnv(
  "AGENT_SESSION_STORE",
  "memory",
  SUPPORTED_AGENT_SESSION_STORES,
);

export function getDefaultAIModel(provider: AIProvider): string {
  if (AI_MODEL) return AI_MODEL;
  if (provider === "anthropic") return "claude-sonnet-4-20250514";
  return "gpt-4o";
}

export function getOpenAIBaseURL(): string {
  return AI_BASE_URL || "https://api.openai.com/v1";
}

export function validateRuntimeConfig(): void {
  void AI_PROVIDER;
  void AI_API_KEY;
  void AI_BASE_URL;
  void AI_MODEL;
  void AI_MAX_TOKENS;
  void AI_TIMEOUT;
  void GENERATED_TOOLS_BACKEND;
  void AGENT_SESSION_STORE;
}
