import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema/index";

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  return databaseUrl;
}

export const db = drizzle(requireDatabaseUrl(), { schema });
export * from "./schema/index";
