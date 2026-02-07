# Turso Cloud (Drizzle + libSQL)

Uses **drizzle-orm/libsql** with the `connection` object (no separate client). See [Drizzle <> Turso Cloud](https://orm.drizzle.team/docs/get-started-turso).

1. **Install:** `npm i drizzle-orm @libsql/client` and `npm i -D drizzle-kit`.

2. **Env** (e.g. `.env.local`):
   ```
   TURSO_DATABASE_URL=libsql://your-db-xxx.turso.io
   TURSO_AUTH_TOKEN=your-token
   ```
   Token: `turso db tokens create your-db-name`.

3. **Connect:** `app/db/index.ts` uses `drizzle({ connection: { url, authToken } })`.

4. **Migrations:** `npx drizzle-kit generate` then `npx drizzle-kit push` (or `migrate`).  
   For CLI, use `.env` or set env vars so drizzle-kit can connect.

5. **Use:** `import { db } from "@/app/db";` then e.g. `await db.select().from(userDictionaries)`.
