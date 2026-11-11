# Appwrite backend

The site's backend is one Appwrite Cloud project (`portfolio`, region `nyc`). This file records how it is configured, so the console never has to be reverse-engineered. Update it whenever you change the project.

## Access model

- **One admin.** Admin rights come from the `admin` user label, not from being signed in. Every table and the bucket grant `create/read/update/delete` to `label:admin`, so any other account (if one ever exists) gets no write access.
- **No public sign-ups.** The user limit is 1, and only the email/password sign-in method is enabled (anonymous, magic URL, email OTP, phone and invites are off). JWT stays on.
- **Guests read only what is public.** `read("any")` is granted at table level for fully public tables. For tables with private rows, it is granted per row (see row security below).

## Tables (database `db`)

| Table        | Env var                                             | Guest access                       | Notes                                                                                     |
| ------------ | --------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `profile`    | `VITE_APPWRITE_DB_PROFILE_COLLECTION_ID`            | read                               | Single row; the oldest wins if duplicates appear. First save uses row id `profile`.       |
| `projects`   | `VITE_APPWRITE_DB_PROJECTS_COLLECTION_ID`           | read                               | `order` ascending; rows without an order sort last.                                       |
| `visibility` | `VITE_APPWRITE_DB_SECTION_VISIBILITY_COLLECTION_ID` | read                               | Single row of section toggles; the oldest wins. First save uses row id `site-settings`.   |
| `blogs`      | `VITE_APPWRITE_DB_BLOG_COLLECTION_ID`               | published rows only (row security) | Unique index `slug_unique` (191-char prefix; the app caps slugs at 120).                   |
| `resumes`    | `VITE_APPWRITE_DB_RESUME_COLLECTION_ID`             | active row only (row security)     | Exactly one row is `isActive`; every activation change runs in one transaction.           |
| `notes`      | (not used by this app)                              | none                               | Left untouched; still grants the `users` role.                                            |

Indexes: `blogs.published_date` on (`published`, `publishedDate` desc) and `resumes.active_upload` on (`isActive`, `uploadDate` desc). Both cover the public queries.

**Row security.** For `blogs` and `resumes`, the app writes each row's permissions on every save: `read("any")` when the row is public (published post, active resume), none otherwise. Admins read everything through the table-level `label:admin` grant. The Zod schemas in `src/api/*.ts` describe exactly which columns the app reads and writes.

## Storage (bucket `file`, the only one the plan allows)

`VITE_APPWRITE_STORAGE_FILE_BUCKET_ID`. Guests can read files; only admins can write them. The bucket caps uploads at 20 MB and accepts the extensions `jpg jpeg png gif webp svg pdf`; the app enforces the same rules before uploading (`FILE_RULES` in `src/api/core/files.ts`).

Files are grouped into virtual folders (Appwrite reports them with a trailing slash, e.g. `blog/`):

| Folder        | Contents                                                         |
| ------------- | ---------------------------------------------------------------- |
| `blog`        | Images inside post bodies; the dashboard media library lists only this folder |
| `blog-covers` | Post cover images                                                |
| `profile`     | Profile photo                                                    |
| `projects`    | Project logos                                                    |
| `resumes`     | Resume versions, each stored as `HenryBao_Resume.pdf`            |
| (root)        | Files uploaded before folders existed                            |

Image transformations (`/preview`) return 403 on this plan, so the app always uses `/view` URLs.

## Function `record-blog-view`

Source: `functions/record-blog-view/src/main.ts`. It runs on Bun 1.4 with no dependencies and no build step.

- Execute: `any`. Scopes: `rows.read`, `rows.write` (the per-execution key Appwrite injects).
- Variables: `DATABASE_ID`, `BLOG_TABLE_ID`.
- Takes `POST {"postId": "..."}` and increments `viewCount` atomically, but only for published posts. Responses: 400 for a bad id, 404 for a missing or unpublished post.

To redeploy, package `package.json` and `src/` as a `.tar.gz` and create a deployment with entrypoint `src/main.ts`, from the console, the CLI (`appwrite push functions`) or the MCP.

## Resume link

`/resume` (and the legacy `/resume-redirect`) always serves the active version:

- **Vercel (henry.bao.dev):** `vercel.json` rewrites both paths to `api/resume.ts`, which looks up the active row and answers with a 302 to that version's file. The redirect is edge-cached for 60 s.
- **Appwrite Sites mirror:** a static SPA that can't redirect by path, so `src/pages/ResumePage.tsx` does the lookup in the browser.

Each version keeps its own file id on purpose. Appwrite tells browsers to cache a file's view URL for 45 days, so overwriting one fixed file would keep serving stale copies.

## Still to do after the rebuild is deployed

These wait for the new code to be live on both hosts, because the old code breaks without them:

1. Enable row security on `blogs` and `resumes`, and remove `read("any")` from their table-level permissions. Before flipping, check that every published post and the active resume has `read("any")` in its row permissions (backfilled 2026-11-11; the new code maintains it).
2. Delete the unused `profile.resumeFileId` column. The old dashboard still writes it, and the resumes table is now the only source of truth for the resume.
