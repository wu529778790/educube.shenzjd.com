/**
 * 教立方 — 结构化日志工具
 *
 * 生产环境输出 JSON 格式，开发环境输出可读格式。
 * 替代散落的 console.log/warn/error 调用。
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
  [key: string]: unknown;
}

function formatEntry(level: LogLevel, msg: string, data?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  if (process.env.NODE_ENV === "production") {
    const entry: LogEntry = { level, msg, ts, ...data };
    return JSON.stringify(entry);
  }
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  const suffix = data ? ` ${JSON.stringify(data)}` : "";
  return `${prefix} ${msg}${suffix}`;
}

const isTestEnv = process.env.NODE_ENV === "test";

export const logger = {
  debug(msg: string, data?: Record<string, unknown>) {
    if (!isTestEnv && process.env.NODE_ENV === "development") {
      console.log(formatEntry("debug", msg, data));
    }
  },
  info(msg: string, data?: Record<string, unknown>) {
    if (!isTestEnv) {
      console.log(formatEntry("info", msg, data));
    }
  },
  warn(msg: string, data?: Record<string, unknown>) {
    console.warn(formatEntry("warn", msg, data));
  },
  error(msg: string, data?: Record<string, unknown>) {
    console.error(formatEntry("error", msg, data));
  },
};
