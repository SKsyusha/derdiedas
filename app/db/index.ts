import { drizzle } from "drizzle-orm/libsql";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error(
    "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN. Add them to .env.local (Turso Cloud)."
  );
}

export const db = drizzle({
  connection: {
    url,
    authToken,
  },
});
