// ============================================================
// Integration Test Setup
// Requires: Docker PostgreSQL running on localhost:5432
// Skips gracefully if database is unreachable.
// ============================================================
import { beforeAll, afterEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { execSync } from "child_process";
import net from "net";

const DATABASE_URL =
  "postgresql://travelpro:travelpro_local@localhost:5432/travelpro";

// Dedicated client for setup/teardown — separate from app's getPrisma()
let testPrisma: PrismaClient;

/** TCP-probe localhost:5432 to check if PostgreSQL is reachable. */
function isDatabaseReachable(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "localhost", port: 5432 });
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 3000);
    socket.on("connect", () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

beforeAll(async () => {
  const reachable = await isDatabaseReachable();
  if (!reachable) {
    console.warn(
      "\n⚠  Skipping integration tests: PostgreSQL not reachable on localhost:5432.\n" +
        "   Run `docker compose up -d` to start the database.\n",
    );
    process.exit(0);
  }

  // Set DATABASE_URL so the app's getPrisma() picks it up
  process.env.DATABASE_URL = DATABASE_URL;

  // Apply pending migrations (idempotent — matches production build script)
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL },
    stdio: "inherit",
    timeout: 30_000,
  });

  // Create test client for cleanup operations (Prisma v7 requires adapter)
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  testPrisma = new PrismaClient({ adapter });
  await testPrisma.$connect();
});

afterEach(async () => {
  // Clean up in cascade-safe order (children before parents)
  await testPrisma.itineraryEdit.deleteMany();
  await testPrisma.affiliateClick.deleteMany();
  await testPrisma.itinerary.deleteMany();
  await testPrisma.trip.deleteMany();
  await testPrisma.profile.deleteMany();
});

afterAll(async () => {
  await testPrisma?.$disconnect();
});

export { testPrisma, DATABASE_URL };
