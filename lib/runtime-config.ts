import "server-only";

const SUPPORTED_GENERATED_TOOLS_BACKENDS = ["filesystem"] as const;
const SUPPORTED_AGENT_SESSION_STORES = ["memory"] as const;

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

export function validateRuntimeConfig(): void {
  void GENERATED_TOOLS_BACKEND;
  void AGENT_SESSION_STORE;
}
