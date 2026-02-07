# Share custom dictionary – implementation todo

## Goal

- On import: save dictionary to DB with a unique ID; store ID in cookies and load words by ID.
- Share: mark dictionary as public and show a link; anyone with the link can open that dictionary.

---

## 1. Database (libSQL only – no ORM, raw SQL)

- **Tables:** See `app/db/schema.sql`. Run that SQL once (Turso dashboard or a script).
  - **`user_dictionaries`**: `id`, `name`, `public` (0/1), `created_at`.
  - **`user_dictionary_words`**: `id`, `dictionary_id`, `noun`, `article`, `alternative_articles` (JSON text), `translation`, `translation_ru/en/uk`, `example_sentence`, `level`, `topic`, `audio_url`.
- **Client:** `import { db } from "@/app/db";` then `db.execute(sql, args)` or `db.batch([...])`. No Drizzle.

---

## 2. API routes (raw SQL with `db` from `@/app/db`)

- **POST `/api/dictionaries`**  
  Body: `{ name, words: Word[] }`. `await db.execute("INSERT INTO user_dictionaries (id, name, public, created_at) VALUES (?, ?, 0, ?)", [id, name, Date.now()]);` then for each word `await db.execute("INSERT INTO user_dictionary_words (...) VALUES (...)", [...])`. Return `{ id }`. Use `db.batch()` to insert all words in one round-trip.
- **GET `/api/dictionaries/[id]`**  
  `const dict = (await db.execute("SELECT * FROM user_dictionaries WHERE id = ?", [id])).rows[0];` if missing → 404. If not owner and not `dict.public` → 403. `const words = (await db.execute("SELECT * FROM user_dictionary_words WHERE dictionary_id = ?", [id])).rows;` map rows to `Word[]` (parse `alternative_articles` JSON). Return `{ id, name, words, public }`.
- **PATCH `/api/dictionaries/[id]`**  
  Body: `{ public?: boolean }`. `await db.execute("UPDATE user_dictionaries SET public = ? WHERE id = ?", [public ? 1 : 0, id]);`. Validate “owner” (e.g. cookie).

- **Word ↔ row**: Insert: map Word fields to columns; `alternative_articles` → `JSON.stringify(word.alternative_articles ?? [])`. Read: map row to Word; `alternative_articles` → `JSON.parse(row.alternative_articles ?? '[]')`.

---

## 3. Import flow (save to DB + cookie)

- In **UserDictionaryDrawer** (or wherever import is confirmed):
  - After `mergeImportedWordsIntoUserDictionaries`, take the created/updated dictionary (with its words and name).
  - Call `POST /api/dictionaries` with `{ name, words }` → get `id`.
  - Set cookie: e.g. `userDictionaryId` = `id` (and optionally keep a “list” cookie if you support multiple dicts later).
  - Update client state: set this dictionary with `id` from response so UI shows it and uses it for training.
- **Trainer** load:
  - On mount, read `userDictionaryId` from cookie.
  - If present, `GET /api/dictionaries/[id]` and set `userDictionaries` from response (one item: `{ id, name, words, enabled }`).
  - If no cookie or API 404: fall back to current localStorage logic (or empty user dicts).

---

## 4. Persist “current dictionary” in cookie

- Cookie name: e.g. `userDictionaryId`.
- When user selects or creates the dictionary that should be “theirs”, set this cookie to that dictionary’s `id`.
- When loading app, use this cookie to call `GET /api/dictionaries/[id]` and hydrate `userDictionaries`.

---

## 5. Share flow

- In **UserDictionaryDrawer** (or list item): add “Share” button for the dictionary.
- On click:
  - Call `PATCH /api/dictionaries/[id]` with `{ public: true }`.
  - Show a copyable link: `https://yoursite.com/d/[id]` (or `?dict=[id]` on home).
- Optional: “Unshare” = `PATCH` with `{ public: false }`.

---

## 6. Public link (open shared dictionary)

- **Route**: e.g. `/d/[id]` (or handle `?dict=[id]` on `/`).
  - Server or client: `GET /api/dictionaries/[id]`. If not public, return 404 or “private”.
  - If public: load dictionary into app state (e.g. as a read-only or clone-into-mine user dictionary) and optionally set cookie so this device “has” this dict for the session.
- UX: “Open shared dictionary” → user can train with it; optional “Save to my dictionaries” = POST same words as new dict and set cookie to new id.

---

## 7. Order of implementation

1. DB schema + migrate.
2. POST + GET `/api/dictionaries` (create and load by id).
3. Import flow: after import → POST → save id in cookie; load on app init via GET using cookie.
4. Trainer: prefer loading user dict by id from cookie + API; keep localStorage as fallback if no id.
5. PATCH for `public`; add Share button and link.
6. Route `/d/[id]` (or `?dict=`) and load shared public dict.

---

## 8. Optional

- **Multiple dictionaries**: cookie could store JSON array of ids; or one “active” id and rest from API by ids in settings.
- **Rate limit** on POST/PATCH to avoid abuse.
- **Auth later**: tie dictionaries to user id; share link stays the same (load by id if public).
