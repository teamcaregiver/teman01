# Google Drive storage for uploads

**Status:** Implemented, off by default. Uploads still go to Supabase Storage until `VITE_STORAGE_BACKEND=gdrive` is set at build time, and that should only happen after the setup below has been checked.

---

## 1. What it does

All four upload flows can store their files in **one app-owned Google account** (a plain Gmail account, 15 GB free):

| Flow | Screen | Who may upload | Who may view | Saved in the record |
|---|---|---|---|---|
| Article / video / Buku 3 PDF | Admin › Artikel, Video, Jadual Pemantauan | admin | everyone | `pdf_url` = permanent function link |
| Cover image | Admin › Artikel, Video, Jadual Pemantauan | admin | everyone | `cover_image` = permanent function link |
| Profile photo | Profil | the user, for themselves | everyone | `profiles.avatar_url` = permanent function link |
| Activity photo (residents) | Staf › Laporan Aktiviti | admin, assigned staff | admin, assigned staff, linked family | `tracker_records.gambar[]` = `gdrive:<drive file id>` |

Validation, previews, toasts and saving to the database work as before. Callers use the same helpers in `src/lib/storage.ts` and get back the same shapes.

## 2. How it works

```
browser ──JWT──▶ Edge Function `drive-files` ──OAuth refresh token──▶ Google Drive
                     │
                     └── checks public.drive_files RLS *as the caller*
```

- **No Google secret is ever sent to the browser.** The SPA is a static GitHub Pages build with no server, so the Drive calls run in a Supabase Edge Function (`supabase/functions/drive-files`), the same way `admin-users` already works. The OAuth client secret, refresh token and signing key are Supabase function secrets only. None of them are `VITE_` variables.
- **Access control stays in Postgres.** Migration `0015_drive_files.sql` adds `public.drive_files`, with one row per Drive file: the Drive file id, kind, scope (parent id or user id), original name, MIME type, size and uploader. Its RLS policies reuse the helpers the Storage buckets already use (`is_admin`, `is_parent_staff`, `can_view_parent`). For each request, the function queries this table **with the caller's JWT**, so Postgres decides who may upload, view or delete a file.
- **Stable ids, not Drive links.** Records store the Drive **file id**, either as a `gdrive:` reference or inside the function link `…/functions/v1/drive-files?id=<id>`. The app never uses `webViewLink` or "anyone with the link" sharing. Every file in Drive stays private to the app account.

### Upload steps (for each file)
1. The browser checks type and size as before. PDFs now also have a 20 MB limit.
2. The function checks the JWT and works out the real file type from the file's first bytes. It does not trust the browser's MIME type. It then checks size and type again.
3. It inserts a `drive_files` row as the caller. RLS rejects anyone not allowed to upload, before anything reaches Drive.
4. It uploads to Drive as `<row id>.<ext>` inside a sub-folder per kind (`content-articles`, `content-videos`, `content-buku3`, `avatar`, `activity`). Names are always unique, so two files with the same original name can't clash. The original name is kept in `drive_files.name`.
5. It saves the Drive id on the row. **If any step fails, both the Drive file and the row are removed.**
6. If saving the *record* fails afterwards, the caller cleans up. The activity form already did this, and the profile photo flow now does too.

### How files are shown (access strategy)
A Drive link can't be used directly as an `<img>` source, and `<img>` tags can't send a JWT. So **every file is served through the function** (`GET ?id=…`), which streams the bytes from Drive with the right `Content-Type`. It also passes through `Range` headers so PDF viewers can load a file page by page.

- **Public kinds** (content, avatars): served to anyone with the link and cached for 1 day. This matches the old public buckets.
- **Activity photos (private)**: the link only works with a **signed, short-lived token** (HMAC-SHA256, valid 1 hour). The token comes from the `sign` action, which only signs photos the caller can read under RLS. `useActivityPhotoUrls` re-signs links before they expire, exactly as it did with Supabase signed links.

## 3. Setup

### 3.1 Google Cloud (once)
1. Sign in to <https://console.cloud.google.com> with the **app-owned Gmail account** that will hold the files. Do not use a personal account.
2. Create a project, e.g. `teman01-storage`.
3. **APIs & Services › Library** → enable **Google Drive API**.
4. **APIs & Services › OAuth consent screen** (Google Auth Platform):
   - User type **External**. Fill in the app name and support email.
   - **Data access / Scopes:** add only `https://www.googleapis.com/auth/drive.file`. With this scope the app can only see files and folders it created itself, never the rest of the account's Drive. It is a non-sensitive scope, so Google verification is not needed.
   - **Audience → Publish app** (status *In production*). **This is required.** While the app is in *Testing*, Google expires the refresh token after 7 days and uploads start failing.
5. **APIs & Services › Credentials › Create credentials › OAuth client ID**, application type **Desktop app**. Copy the client ID and client secret.

### 3.2 Refresh token and Drive folder (once)
On your own machine (Node 18+):

```sh
GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com \
GOOGLE_OAUTH_CLIENT_SECRET=xxx \
node scripts/google-drive-setup.mjs
```

PowerShell:

```powershell
$env:GOOGLE_OAUTH_CLIENT_ID="xxx.apps.googleusercontent.com"; $env:GOOGLE_OAUTH_CLIENT_SECRET="xxx"; node scripts/google-drive-setup.mjs
```

Open the printed link and sign in as the app-owned account. You will see an "unverified app" warning; choose *Advanced › Go to …*. Then allow access. The script prints `GOOGLE_OAUTH_REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID` (it creates a `teman01-uploads` folder) and a random `DRIVE_URL_SIGNING_SECRET`. It writes nothing to disk.

> The root folder **must** be the one this script creates. A folder made by hand in the Drive UI is invisible to the `drive.file` scope.

### 3.3 Supabase (in this order)
```sh
# 1. Secrets for the function (never put these in .env or a VITE_ variable)
npx supabase secrets set \
  GOOGLE_OAUTH_CLIENT_ID=... \
  GOOGLE_OAUTH_CLIENT_SECRET=... \
  GOOGLE_OAUTH_REFRESH_TOKEN=... \
  GOOGLE_DRIVE_ROOT_FOLDER_ID=... \
  DRIVE_URL_SIGNING_SECRET=...

# 2. The drive_files table and its policies
npx supabase db push            # or paste 0015_drive_files.sql into the SQL editor

# 3. The function (JWT is checked inside the function; see config.toml)
npx supabase functions deploy drive-files --no-verify-jwt
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase automatically.

### 3.4 Check it before switching
1. Build locally with `VITE_STORAGE_BACKEND=gdrive` in `.env` and run `npm run dev`.
2. Try each flow: an article PDF, a cover image, a profile photo, and an activity report with photos. Then open each one as a **family member who is linked** to the resident (photos show) and as **another staff member** (photos must not show).
3. Check that the files appear in the `teman01-uploads` sub-folders in Drive and that `drive_files` has a row for each, with `drive_file_id` filled in.
4. Try a file larger than 5 MB and a `.gif` renamed to `.jpg`. Both must be refused.
5. Run the RLS tests against a local Supabase: `npx vitest run supabase/tests` (see the header of `supabase/tests/drive-files.test.ts`).

### 3.5 Switch on
Set `VITE_STORAGE_BACKEND=gdrive` in the environment that builds the site: `.env` on the machine that runs `npm run deploy`, and Lovable's environment settings if you build there. Then rebuild and deploy.

**Rollback:** set it back to `supabase` and redeploy. New uploads go to Supabase Storage again. Files already on Drive keep working as long as the function and its secrets stay deployed.

## 4. Configuration reference

| Name | Where | Secret? | Purpose |
|---|---|---|---|
| `VITE_STORAGE_BACKEND` | `.env` / build env | no | `supabase` (default) or `gdrive`. Only picks the code path. |
| `GOOGLE_OAUTH_CLIENT_ID` | Supabase secrets | yes | OAuth Desktop client |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Supabase secrets | yes | OAuth Desktop client |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Supabase secrets | **yes, critical** | Gives write access to the app's Drive files. Rotate by re-running the script and revoking the old grant at <https://myaccount.google.com/permissions>. |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Supabase secrets | no | Folder created by the setup script |
| `DRIVE_URL_SIGNING_SECRET` | Supabase secrets | yes | Signs private photo links. Changing it invalidates links already handed out; the app re-signs them automatically. |

Limits (kept the same in `src/lib/storage.ts` and the function): images are JPG/PNG/WebP up to 5 MB, and PDFs up to 20 MB.

## 5. Known limits and what's left
- **Existing files are not migrated.** Older Supabase Storage files keep working as they are. Moving them to Drive would need a separate one-off script.
- **Orphaned files, as before:** a PDF or cover uploaded and then replaced or abandoned before saving the form, or an old profile photo after a new one, stays in storage. Supabase Storage behaved the same way.
- **Every view goes through the function.** This counts against Edge Function invocations and egress, and against the Drive API quota (generous for this app's size). Public files are cached by browsers for 1 day.
- **Upload size:** check that a ~20 MB PDF uploads on your Supabase plan. If the platform's request limit is lower, reduce `MAX_PDF_BYTES` in `src/lib/storage.ts` and the `content` limit in the function.
- **One account, one token.** If the refresh token is revoked, unused for 6 months, or the consent screen goes back to *Testing*, uploads and views fail with "Tidak dapat menyambung ke Google Drive". The function logs show `invalid_grant`. Fix it by re-running step 3.2 and updating the secret. Storage is shared with that account's Gmail and Photos (15 GB).
- **Signed photo links** can be forwarded and work for up to 1 hour, the same as Supabase signed links.
