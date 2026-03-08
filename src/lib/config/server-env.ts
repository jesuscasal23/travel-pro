import { z } from "zod";
import { ServiceMisconfiguredError } from "@/lib/api/errors";

export type EnvCheckStatus = "ok" | "missing" | "unreachable";

const nonEmptyString = z.string().trim().min(1);
const urlString = z.string().trim().url();

function parseRequiredEnv<T>(
  service: string,
  schema: z.ZodType<T>,
  input: unknown,
  fields: string[]
): T {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }

  throw new ServiceMisconfiguredError(service, {
    fields,
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

function hasEnvValue(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

export function getDatabaseUrl(): string {
  return parseRequiredEnv("database", nonEmptyString, process.env.DATABASE_URL, ["DATABASE_URL"]);
}

export function getAnthropicApiKey(): string {
  return parseRequiredEnv("anthropic", nonEmptyString, process.env.ANTHROPIC_API_KEY, [
    "ANTHROPIC_API_KEY",
  ]);
}

export function getCronSecret(): string {
  return parseRequiredEnv("cron", nonEmptyString, process.env.CRON_SECRET, ["CRON_SECRET"]);
}

export function getOptionalSupabaseSessionEnv(): { url: string; anonKey: string } | null {
  if (!hasEnvValue("NEXT_PUBLIC_SUPABASE_URL") || !hasEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
    return null;
  }

  return parseRequiredEnv(
    "supabase-session",
    z.object({
      url: urlString,
      anonKey: nonEmptyString,
    }),
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
  );
}

export function getSupabaseSessionEnv(): { url: string; anonKey: string } {
  return parseRequiredEnv(
    "supabase-session",
    z.object({
      url: urlString,
      anonKey: nonEmptyString,
    }),
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
  );
}

export function getSupabaseAdminEnv(): { url: string; serviceRoleKey: string } {
  return parseRequiredEnv(
    "supabase-admin",
    z.object({
      url: urlString,
      serviceRoleKey: nonEmptyString,
    }),
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
  );
}

export function getGuestTripOwnerSecret(): string {
  const configuredSecret = process.env.GUEST_TRIP_OWNER_SECRET;
  if (configuredSecret?.trim()) {
    return configuredSecret;
  }

  const fallbackSecret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.CRON_SECRET;
  if (fallbackSecret?.trim()) {
    return fallbackSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "travelpro-dev-guest-trip-owner-secret";
  }

  throw new ServiceMisconfiguredError("guest-trip-owner", {
    fields: ["GUEST_TRIP_OWNER_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET"],
  });
}

export function getOptionalRedisEnv(): { url: string; token: string } | null {
  if (!hasEnvValue("UPSTASH_REDIS_REST_URL") || !hasEnvValue("UPSTASH_REDIS_REST_TOKEN")) {
    return null;
  }

  return parseRequiredEnv(
    "redis",
    z.object({
      url: urlString,
      token: nonEmptyString,
    }),
    {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]
  );
}

export function getOptionalAmadeusEnv(): {
  apiKey: string;
  apiSecret: string;
  environment: "production" | "test";
} | null {
  if (!hasEnvValue("AMADEUS_API_KEY") || !hasEnvValue("AMADEUS_API_SECRET")) {
    return null;
  }

  return parseRequiredEnv(
    "amadeus",
    z.object({
      apiKey: nonEmptyString,
      apiSecret: nonEmptyString,
      environment: z.enum(["production", "test"]).default("test"),
    }),
    {
      apiKey: process.env.AMADEUS_API_KEY,
      apiSecret: process.env.AMADEUS_API_SECRET,
      environment: process.env.AMADEUS_ENVIRONMENT,
    },
    ["AMADEUS_API_KEY", "AMADEUS_API_SECRET", "AMADEUS_ENVIRONMENT"]
  );
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://travelpro.app";
}

export function getServerEnvChecks(): Record<string, EnvCheckStatus> {
  return {
    anthropic: hasEnvValue("ANTHROPIC_API_KEY") ? "ok" : "missing",
    supabase:
      hasEnvValue("NEXT_PUBLIC_SUPABASE_URL") &&
      hasEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
      hasEnvValue("SUPABASE_SERVICE_ROLE_KEY")
        ? "ok"
        : "missing",
    database: hasEnvValue("DATABASE_URL") ? "ok" : "missing",
    redis:
      hasEnvValue("UPSTASH_REDIS_REST_URL") && hasEnvValue("UPSTASH_REDIS_REST_TOKEN")
        ? "ok"
        : "missing",
  };
}
