# Derdiedas – AI Agent Instructions

Project-specific context for AI coding agents (Cursor, Copilot, etc.).

## Project overview

**derdiedas** is a Next.js web app for German article/vocabulary training. It uses the App Router, React 19, TypeScript, Ant Design, Tailwind CSS, i18next (en/ru/uk), and Drizzle ORM with libSQL/Turso.

## Dev environment

- **Node**: Use a current LTS version.
- **Install**: `npm install`
- **Dev server**: `npm run dev` → [http://localhost:3000](http://localhost:3000)
- **Build**: `npm run build`
- **Lint**: `npm run lint`

Optional: copy `.env.example` to `.env` and set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` if you need the user-dictionary DB.

## Codebase structure

- **`app/`** – Next.js App Router: routes, layout, pages (`page.tsx`), API routes under `api/`.
- **`app/components/`** – React components (Trainer, WordDisplay, SettingsDrawer, etc.).
- **`app/hooks/`** – Custom React hooks (e.g. `useWordTraining`).
- **`app/services/`** – Backend-style services (e.g. user dictionary).
- **`app/db/`** – Drizzle schema and DB client.
- **`app/locales/`** – i18next JSON files: `en.json`, `ru.json`, `uk.json`.
- **`app/utils/`** – Shared utilities (dataset, cookies, import, etc.).
- **`app/types.ts`** – Shared TypeScript types.

## Conventions

- **TypeScript** everywhere; avoid `any`; use types from `app/types.ts` where relevant.
- **React**: Functional components and hooks only; colocate component logic in `app/components/` or `app/hooks/`.
- **i18n**: All user-facing text via `react-i18next`; add/update keys in `app/locales/{en,ru,uk}.json` and use `t('key')` in components.
- **Styling**: Tailwind for layout/utility; Ant Design components for UI (buttons, drawers, etc.). Use the app’s `ThemeProvider` / `AntConfigProvider` for theming.
- **Data**: Drizzle for DB; API routes under `app/api/` for server-side logic and external clients.

## Testing & PRs

- Run `npm run build` and `npm run lint` before committing.
- For UI changes, consider en/ru/uk and light/dark theme if applicable.
- Keep new strings in all three locale files when adding copy.

## Notes for agents

- User dictionary and optional DB features depend on Turso/libSQL env vars; the app can run without them for core training.
- Routing: main trainer at `/`, dictionary views under `/d/[id]`; API at `/api/dictionaries` and `/api/dictionaries/[id]`.
