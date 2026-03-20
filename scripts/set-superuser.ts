/**
 * Set or revoke the superuser flag on a profile.
 *
 * Usage:
 *   npm run db:set-superuser -- --user-id <supabase-user-id>
 *   npm run db:set-superuser -- --email <user-email>
 *   npm run db:set-superuser -- --email <user-email> --revoke
 *
 * Requires DATABASE_URL in .env.local.
 * Email lookup also requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { resolve } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

type CliArgs = {
  email?: string;
  help: boolean;
  revoke: boolean;
  userId?: string;
};

function printUsage() {
  console.log(`
Usage:
  npm run db:set-superuser -- --user-id <supabase-user-id>
  npm run db:set-superuser -- --email <user-email>
  npm run db:set-superuser -- --email <user-email> --revoke

Options:
  --user-id <id>   Target a profile by Supabase auth user ID
  --email <email>  Resolve the Supabase auth user ID from email first
  --revoke         Set isSuperUser=false instead of true
  --help, -h       Show this help
`);
}

function readFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function parseArgs(args: string[]): CliArgs {
  const parsed: CliArgs = { help: false, revoke: false };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    switch (arg) {
      case "--email":
        parsed.email = readFlagValue(args, i, arg);
        i += 1;
        break;
      case "--user-id":
        parsed.userId = readFlagValue(args, i, arg);
        i += 1;
        break;
      case "--revoke":
        parsed.revoke = true;
        break;
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (parsed.help) {
    return parsed;
  }

  if ((parsed.userId ? 1 : 0) + (parsed.email ? 1 : 0) !== 1) {
    throw new Error("Pass exactly one of --user-id or --email.");
  }

  return parsed;
}

async function resolveUserIdFromEmail(email: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Email lookup requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Failed to list Supabase users: ${error.message}`);
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
    if (user) {
      return user.id;
    }

    if (data.users.length < 200) {
      break;
    }
  }

  throw new Error(`No Supabase auth user found for email "${email}".`);
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    printUsage();
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not set. Add it to .env.local.");
  }

  const userId = parsed.userId ?? (await resolveUserIdFromEmail(parsed.email!));
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const profile = await prisma.profile.update({
      where: { userId },
      data: { isSuperUser: !parsed.revoke },
      select: { id: true, isSuperUser: true, userId: true },
    });

    console.log(
      `${parsed.revoke ? "Revoked" : "Granted"} superuser access for profile ${profile.id} (${profile.userId}).`
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new Error(
        `No profile found for user ID "${userId}". Have that user sign in and save their profile first.`
      );
    }

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
