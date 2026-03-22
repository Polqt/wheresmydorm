import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const workspaceRoot = path.resolve(currentDirPath, "../..");

const candidateEnvPaths = [
  path.join(workspaceRoot, "apps/web/.env"),
  path.join(workspaceRoot, "apps/web/.env.local"),
  path.join(currentDirPath, ".env"),
];

for (const envPath of candidateEnvPaths) {
  if (!fs.existsSync(envPath)) {
    continue;
  }

  dotenv.config({
    path: envPath,
    override: false,
  });
}

const databaseUrl =
  process.env.DATABASE_URL_MIGRATION ||
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    [
      "A database connection string is missing for Drizzle.",
      "Set DATABASE_URL_MIGRATION, DIRECT_URL, or DATABASE_URL.",
      "Recommended for Supabase on Windows: use the IPv4 pooler URL in DATABASE_URL_MIGRATION.",
    ].join(" "),
  );
}

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
