// ============================================================
// Travel Pro — Structured Logger
//
// Lightweight logger with levels, structured output, and
// optional correlation IDs for request tracing.
//
// - Dev: human-readable with timestamps
// - Production: JSON lines for monitoring tools
// ============================================================

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ?? (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL];
}

function formatDev(level: LogLevel, module: string, message: string, context?: LogContext): string {
  const ts = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
  const lvl = level.toUpperCase().padEnd(5);
  const prefix = `${ts} ${lvl} [${module}]`;
  if (context && Object.keys(context).length > 0) {
    const pairs = Object.entries(context)
      .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join(" ");
    return `${prefix} ${message} | ${pairs}`;
  }
  return `${prefix} ${message}`;
}

function formatJson(level: LogLevel, module: string, message: string, context?: LogContext): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    ...context,
  });
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";

function log(level: LogLevel, module: string, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const formatted = IS_PRODUCTION
    ? formatJson(level, module, message, context)
    : formatDev(level, module, message, context);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
}

/** Create a scoped logger for a module. */
export function createLogger(module: string): Logger {
  return {
    debug: (message, context) => log("debug", module, message, context),
    info: (message, context) => log("info", module, message, context),
    warn: (message, context) => log("warn", module, message, context),
    error: (message, context) => log("error", module, message, context),
  };
}