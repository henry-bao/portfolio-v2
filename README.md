# portfolio-v2

Portfolio site and blog built with React, Material-UI and Appwrite. Every push to `main` deploys to Vercel (henry.bao.dev) and to Appwrite Sites.

## Scripts

```sh
bun install
bun run dev        # Vite dev server (needs a .env, see .env.example)
bun run test       # bun test: data layer, resume redirect
bun run typecheck  # tsc -b: app, server code and tests
bun run lint
bun run build
```

## How it fits together

```
src/
  api/          The data layer. Every Appwrite call goes through here.
    core/       Client, env validation (Zod), ApiError, and the table/file/transaction primitives
    *.ts        One module per domain (blog, projects, resumes...): its Zod schemas, types and operations
  queries/      React Query hooks over api/ (caching, retries, invalidation after writes)
  app/          App shell: router, providers, admin guard, toasts, route paths
  pages/        One component per route; pages/admin/ is the dashboard
  components/   UI pieces, grouped by where they're used (sections, blog, layout, admin, shared)
  hooks/ lib/   UI-only hooks and pure helpers
  config/       Site owner details and built-in fallback content
api/resume.ts   Vercel Function behind /resume (302 to the active resume version)
appwrite/       Backend configuration notes and the record-blog-view Appwrite Function
test/           bun test suites, with an in-memory fake of the Appwrite services
```

Conventions:

- **Rows are validated, never cast.** `defineTable()` (`src/api/core/table.ts`) parses every row with Zod. One malformed row is logged and skipped instead of breaking a whole list.
- **Writes are checked first.** Each domain's input schema enforces the Appwrite column limits and returns per-field messages that the forms display.
- **Every failure is an `ApiError`** with a `kind` (`not_found`, `conflict`, `network`...). `getErrorMessage()` turns any thrown value into text that is safe to show.
- **File swaps never orphan or break anything.** `swapFile()` uploads the new file, saves the row, and only then deletes the old file. If the save fails, it deletes the new upload instead.
- **Multi-row changes run in one transaction** (`runTransaction`), e.g. switching the active resume or reordering projects.

To add a new kind of content: define its table and schemas in `src/api/<domain>.ts`, add hooks in `src/queries/<domain>.ts`, then build the page. `appwrite/README.md` documents the Appwrite side: permissions, row security, indexes, storage folders and the function.
