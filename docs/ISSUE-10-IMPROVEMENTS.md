# Issue #10 "improvement" — cards, Buku 3 for admin, rich text, staff & admin fixes

**Scope:** GitHub issue #10, all nine items: General 1–2, Staff side 1–3, Admin side 1–4.
**Date:** 20 Oct 2026
**Status:** Implemented and tested locally. **Not yet deployed:** migration 0014 still has to be applied to the live Supabase project, *before* the new frontend is published (see [Deployment](#3-deployment--order-matters)).

---

## 1. Summary

| # | Request (from the issue) | Result |
|---|---|---|
| G1 | Clicking any card shows its details, without pressing the edit/view button | Done |
| G2 | "CareSenior" → "Sistem Teman Malaysia" in the sidebar | Done (also the family app bar and page titles) |
| S1 | Rekod Servis: tap the person → Rekod Harian | Done, with access through the booking (decision 2) |
| S2 | Pain score emoji ("ko cooking la") | Done: a drawn face for every score 0–10 |
| S3 | Risiko jatuh: remove the "Tidak" | Done |
| A1 | New sidebar page for admin to adjust the default checklist | Done: **Senarai Semak** |
| A2 | Add Temanion: dropdowns styled like Peranan; Lokasi opens upward unless you scroll | Done |
| A3 | Buku 3 for admin: **Jadual Pemantauan** in the sidebar, data entered like Artikel | Done |
| A4 | Quill editor for the content of Buku 1, 2 and 3 | Done |

---

## 2. What changed, item by item

Each item lists what the user now sees, then where it lives in the code.

### G1 — Click a card to open it
- **Admin:** Artikel (row → article page), Video (row → preview with its description), Pengurusan Temanion (row → profile pop-up), Jadual Pemantauan (row → section page), Borang (card → opens the form in a new tab, like *Buka Borang*; not on the *Dipadam* tab).
- **Staff:** Rekod Servis (card → Rekod Harian, see S1), Penerima Servis (card → Rekod Harian; the info button still opens the info pop-up), Borang.
- Already clickable before this issue: admin Penerima Servis cards, the Rekod Harian and Servis Monitoring rows, the dashboard lists and the family cards.
- Buttons, links and tick boxes inside a card keep their own action. Selecting text in a row does not open it. Keyboard: Tab to the row, then Enter or Space.
- Files: `src/lib/row-click.ts` (new), `admin.artikel.index.tsx`, `admin.video.tsx`, `admin.staff.tsx`, `borang-page.tsx`, `staf.index.tsx`, `staf.warga-emas.tsx`.

### G2 — Sistem Teman Malaysia
- The admin / Temanion sidebar, the family sidebar and phone app bar, and the browser tab titles (Log Masuk, Daftar Anak, Daftar Temanion, the default title and the link-preview title).
- The name is kept in one place: `src/lib/jenama.ts`.

### S1 — Rekod Servis opens Rekod Harian
- Each service card shows the care recipient's name; tapping anywhere on the card opens their Rekod Harian.
- A card that cannot open says why:
  - *"Penerima servis belum dipautkan pada tempahan ini. Minta admin pautkan di Servis Monitoring."* — the booking has no care recipient. This is the card in the issue's screenshot ("Tempahan oleh Aisha Rahman").
  - *"Rekod Harian penerima servis ini belum boleh dibuka. Hubungi admin."* — should not happen once migration 0014 is applied.
- **Access through the booking:** the Temanion assigned to an open booking (Menunggu, Disahkan or Sedang Berlangsung) for a person can now open and record their Rekod Harian, sees them under Penerima Servis and Rekod Saya, can edit their checklist, read their medication list and upload activity photos — the same as an assigned Temanion. Access ends when the booking is Selesai or Dibatalkan; the records they made stay theirs.
- Why it was needed: until now only the person's *assigned* Temanion (`parents.staff_id`) could open Rekod Harian, and no screen sets that field — it only came from seed data.
- Files: migration 0014 (§1), `staf.index.tsx`, `staf.warga-emas.tsx`, `staf.rekod.index.tsx`.

### S2 — Pain score faces
- Every score 0–10 has its own face in the Wong-Baker style: the smile turns into a frown, the brows worry from 4, the eyes squeeze shut from 8 and tears appear at 9–10, while the colour runs green → yellow → orange → red.
- A green-to-red bar under the scale ("Tiada sakit" … "Sakit sangat teruk"); the chosen score shows its face next to the label.
- The faces are drawn (SVG) rather than emoji, so they look the same on every phone — emoji look different on Android, iPhone and Windows.
- The same faces appear in Buku 3 (the Unit 8 chart) and in the record reports (admin, staff history, family Progres).
- Files: `src/components/muka-kesakitan.tsx` (new), `staf.tracker.$parentId.kesakitan.tsx`, `pilihan-skala.tsx`, `pemantauan-rujukan.tsx`, `pemantauan-report.tsx`, `src/lib/pemantauan.ts` (emoji removed from `SKALA_KESAKITAN`).

### S3 — Risiko jatuh without "Tidak"
- The "Tidak" text beside each factor is gone. A ticked factor shows **Ya** and its row is highlighted; an unticked factor still counts as "Tidak". Saved data is unchanged.
- File: `staf.tracker.$parentId.risiko-jatuh.tsx`.

### A1 — Senarai Semak (default checklist)
- New sidebar item **Senarai Semak** (after Rekod Harian) → `/admin/senarai-semak`.
- Admin edits the list used by every care recipient without their own list: rename, move up / down, remove, add (up to 50 items of 120 characters). Buttons: *Guna senarai asal sistem* (the built-in 8 items), *Batal perubahan*, *Simpan*. The page warns before leaving with unsaved changes.
- Below the list: the care recipients that have their own list. They keep it; each name links to the person's page.
- Temanion see the new default on the Checklist tab straight away. Ticks follow the item, so renaming an item keeps today's tick.
- Also: the per-person list editor (Urus Senarai) gained move up / down, and its *Guna senarai default* button now uses admin's default.
- Files: `admin.senarai-semak.tsx` (new), `checklist-editor.tsx`, `src/lib/checklists.ts`, `data.ts`, `db.ts`, `staf.tracker.$parentId.index.tsx`, migration 0014 (§2).

### A2 — Tambah Temanion dropdowns and Lokasi
- **Warganegara** and **Bangsa** now use the same dropdown as Peranan and Jantina, with fixed lists. A value typed before (they used to be free text) stays selectable. Warganegara still starts on Malaysia.
- **Lokasi** — and every other long dropdown in the app — shows about seven items and scrolls, so it opens below its field whenever there is room. It only flips upward when the space below is genuinely short.
- Files: `temanion-fields.tsx`, `src/components/ui/select.tsx`.

### A3 — Jadual Pemantauan (Buku 3 for admin)
- New sidebar item **Jadual Pemantauan** (after Video, so Buku 1–3 sit together) → `/admin/jadual-pemantauan`, laid out like Artikel:
  - **List:** every section in book order — type (*Manual 3* or *Tambahan*, plus *Diubah suai* when a Manual 3 text was changed), the chart it keeps, status, last change — with **Naik / Turun**, **Edit**, **Kembalikan teks asal** (Manual 3) or **Padam** (Tambahan). Clicking a row opens the section page, which shows the section exactly as families see it. **Bahagian Baru** adds a section.
  - **Manual 3 sections (13):** admin edits the title and text; the charts and tables stay under the text. They cannot be deleted or hidden. *Kembalikan teks asal* brings back the manual's text (the position is kept). A section that was never changed keeps following `src/lib/buku3.ts`.
  - **Added sections:** title, text, and Diterbitkan / Draf. Drafts are visible to admin only.
- Where it shows: the family **Buku 3** tab (order, text, published added sections; the search box covers them), and each unit's text in the **Panduan Buku 3** box of the staff forms (units 5–9).
- Files: `src/routes/admin.jadual-pemantauan.{index,baru,$bahagianId.index,$bahagianId.edit}.tsx` (new), `buku3-bahagian-form.tsx` (new), `buku3-badge.tsx` (new), `buku3.tsx`, `tracker-form-shell.tsx`, `src/lib/buku3-bahagian.ts` (new), `src/lib/buku3-actions.ts` (new), `src/lib/buku3.ts`, `data.ts`, `db.ts`, migration 0014 (§3).

### A4 — Quill editor for Buku 1, 2 and 3
- The **Artikel** body, the **Video** description and the **Buku 3** section text use the Quill 2 editor. The toolbar is in Malay: Teks biasa / Tajuk / Subtajuk, bold, italic, underline, numbered and bulleted lists, link, quote, clear formatting. Pictures go in the cover image or PDF, not inside the text.
- The text is saved as HTML and shown everywhere through a sanitiser (DOMPurify) that keeps only that formatting. Links open in a new tab.
- Older plain-text articles and videos show as before and open in the editor as paragraphs; they become HTML the next time they are saved.
- List previews show plain text and skip headings.
- Quill loads only on the admin forms (its own ~200 KB file); families and Temanion never download it.
- Ctrl/⌘ + B in the editor makes text bold and no longer also folds the sidebar (found during testing).
- New dependencies: `quill` 2.0.3 and `dompurify` 3.4.16.
- Files: `rich-text-editor.tsx` (new), `rich-text.tsx` (new), `src/lib/rich-text.ts` (new), `src/styles.css`, `article-form.tsx`, `admin.artikel.$articleId.index.tsx`, `admin.video.tsx`, `anak.informasi.index.tsx`, `anak.informasi.$id.tsx`, `package.json`, `package-lock.json`.

---

## 3. Deployment — order matters

All database changes are in **`supabase/migrations/0014_booking_access_checklist_buku3.sql`**. It is safe to re-run.

1. **Apply migration 0014 to the live project first.** Use the Supabase dashboard → SQL Editor (paste the file and run it) or the Supabase MCP, the same way 0006–0013 were applied.
2. **Then publish the frontend** (push to `main` → GitHub Pages workflow; Lovable syncs from the branch).

Why this order:
- **New frontend before the migration:** the Senarai Semak and Jadual Pemantauan pages show a load error and cannot save. Families and Temanion still see the built-in Buku 3 and default checklist (the app falls back to them), and a Temanion linked only through a booking still cannot open that person's Rekod Harian.
- **Migration before the new frontend** is safe: the current app keeps working, and the Temanion of open bookings simply gain access to those people.

**One data fix on the live project:** the booking in the issue's screenshot has no care recipient linked. Admin should open it in Servis Monitoring and pick the Penerima Servis; the Temanion's card then opens Rekod Harian.

### What migration 0014 does

| Area | Change |
|---|---|
| `private.is_parent_staff()` | Also true for the Temanion of a **pending / confirmed / ongoing** booking for the person. Every rule built on it follows: `parent_anak`, `medications`, `parent_checklists`, activity photos. |
| `parents_select` policy | The staff part now uses `is_parent_staff()` instead of `staff_id = auth.uid()`, so the booking's Temanion can see the person. |
| `checklist_default` (new) | One row (`id = true`); `items` is a JSON array of 1–50 items. Signed-in users read it; only admin writes. A trigger stamps `updated_at` / `updated_by`. No row = the built-in list. |
| `buku3_bahagian` (new) | `kunci` (built-in section key, or empty for an added section), `tajuk`, `kandungan` (HTML), `urutan`, `visibility`. Checks: known keys only; built-in sections always published; an added section needs a title, text and position; title 1–200 characters; text up to 100,000. Published rows for everyone, all rows for admin; only admin writes. A trigger stamps `updated_at` / `updated_by`. |
| `public.stamp_updated()` (new) | The shared trigger function for the two new tables. |

No Edge Function change is needed. The `tracker_records` rules are unchanged.

---

## 4. Decisions made where the issue left a choice

1. **Buku 3 for admin** means the manual's own sections become editable, like articles (your choice), rather than separate article-style entries.
2. **Access through the booking** (your choice), for bookings that are Menunggu, Disahkan or Sedang Berlangsung — the same ones listed on Rekod Servis.
3. **Manual 3 sections cannot be deleted or hidden**, because their charts and the staff forms rely on them. Added sections can.
4. The **Buku 3 header** (title and introduction) stays fixed.
5. **"Click any card"**: each card opens what its view button opened. Borang cards open the form in a new tab.
6. **Risiko jatuh**: a ticked factor shows "Ya" and is highlighted; an unticked one has no label (the heading already says *tandakan jika "Ya"*).
7. **Pain faces**: drawn for every score, green to red; the Wong-Baker labels are unchanged.
8. **Long dropdowns** are capped at about seven items everywhere, which fixes Lokasi and keeps all dropdowns consistent.
9. **Sidebar order**: Senarai Semak after Rekod Harian; Jadual Pemantauan after Video.
10. **Rich text**: Quill 2 is used directly (the usual React wrapper does not support React 19); no pictures inside the text.
11. The **Senarai Semak** page also lists the people with their own list, so admin knows who the change does not reach.
12. The **new name** also replaces CareSenior in page titles and the family app bar.

---

## 5. Testing

All tests ran on 20 Oct 2026 against a **local** Supabase (Docker). The live project was never touched: the browser check blocked every request to `*.supabase.co`, and none was attempted.

| Check | Command | Result |
|---|---|---|
| Unit tests (rich-text helpers, Buku 3 merge / reorder, checklist helpers, plus the existing suites) | `npm test` | **109 passed** (22 new) |
| Database tests (rules and triggers, as real admin / Temanion / family users) | see below | **30 passed** (14 new for 0014, 16 from issue #9 as a regression check) |
| Migration 0014 on top of 0001–0013 (the live project's path) | `npx supabase migration up --local` | Clean |
| Re-running 0014 on an already-migrated database | `psql < 0014…sql` (twice) | Clean; one of each constraint, trigger and policy |
| Database function lint | `npx supabase db lint --local` | No errors |
| Browser check (dev server on the local database; admin, Temanion and family; desktop and 390 px phone) | scripted headless Chrome | **36 / 36 checks passed** |
| Type-check | `npx tsc --noEmit` | Pass |
| Production build (as CI) | `npm run build` | Pass |
| Lint | `npx eslint …` (new files; edited files without the Prettier rule) | Clean |

**Database tests check that:**
- No Temanion sees a person without an assignment; the booking's Temanion sees them while the booking is pending, confirmed or ongoing, and `list_my_services()` returns the person's name.
- That Temanion can edit the person's checklist, read their medications and save a daily record; another Temanion can do none of these.
- Access ends when the booking is completed or cancelled, while the Temanion's own records stay readable; a Temanion set as the person's staff keeps access as before.
- The default checklist: readable by signed-in users, writable only by admin, stamped with the admin, one row of 1–50 items; deleting the row brings back the built-in list.
- Buku 3: admin changes a built-in section and families and Temanion read it; moving a section changes only its position; built-in sections stay published; unknown keys and blank titles are refused; an added section needs its title, text and position; a draft is admin-only until published; families and Temanion cannot insert, update or delete.

**Browser checks covered:**
- The new name in every sidebar; the new menu items and their order.
- Senarai Semak: rename, move, add, save; the Temanion's Checklist tab shows the new list.
- Jadual Pemantauan: the 13 sections, previews without the heading, row click, editing a Manual 3 section in Quill (bold), the *Diubah suai* badge, adding a draft section with a bulleted list, moving it, and the draft staying hidden from families while the edited unit shows in Buku 3 and in the staff Panduan box.
- Artikel: row click, an old plain-text article shown as before and opened as paragraphs, saved with a list, and shown formatted to families; Video: description in Quill, plain-text preview, row click → preview, formatted for families.
- Tambah Temanion: Warganegara and Bangsa dropdowns, Malaysia default, picking a race, Lokasi opening below the field; row click → profile.
- Rekod Servis: the booked person's card opens Rekod Harian; the unlinked booking explains why; Penerima Servis card click; the info pop-up does not navigate.
- Pain score: 11 faces; Risiko jatuh: no "Tidak", ticked factor shows "Ya" and is highlighted.
- Phone width (390 px): Rekod Servis, the pain scale without sideways scrolling, Senarai Semak, the Buku 3 editor.
- The only browser console errors were the YouTube and Unsplash requests the test blocked on purpose.

**Bug found and fixed during testing:**
- *Ctrl + B in the editor* also folded the sidebar, because the sidebar listens for Ctrl/⌘ + B anywhere on the page. Shortcuts typed in the editor now stay in the editor.

**Not run:** building the database from empty (0001 → 0014). The local test database still holds the accounts from issue #9's testing, and a reset would wipe them; 0014 was applied on top of 0013 instead, which is exactly how the live project will receive it.

**Running the tests yourself**
```bash
npm test                                  # unit tests (database tests skip themselves)

# database tests — needs Docker
npx supabase start
npx supabase migration up --local         # applies 0014 if the local database predates it
npx supabase status -o env                # gives API_URL, ANON_KEY, SERVICE_ROLE_KEY
SUPABASE_TEST_URL=http://127.0.0.1:54321 \
SUPABASE_TEST_ANON_KEY=<ANON_KEY> SUPABASE_TEST_SERVICE_KEY=<SERVICE_ROLE_KEY> \
npx vitest run supabase/tests
```
The database tests refuse to run unless the URL is `localhost` / `127.0.0.1`. They create and delete users, so they must never point at production.

---

## 6. Notes, limitations and follow-ups

- **Live data:** the booking in the issue's screenshot needs a care recipient linked in Servis Monitoring (see Deployment).
- **Main Temanion between bookings:** no screen sets a person's assigned Temanion (`parents.staff_id`); access now comes from bookings. If a person needs a permanent Temanion between bookings, a "Temanion penjaga" field on the Penerima Servis edit page would be a separate, small change.
- **Daily-record insert rule (unchanged, older):** the database lets any Temanion insert a record under their own name for any person id; the app only offers it for people they can see. It could be tightened to `is_parent_staff()` later.
- **Edited Manual 3 sections** no longer follow `src/lib/buku3.ts`; *Kembalikan teks asal* makes them follow it again.
- **Rich text** is stored as HTML. Only admin can write it, and the app sanitises it whenever it is shown.
- **Tooling:** `bun.lock` was not touched (it was already out of date; CI uses `npm ci`). New files are Prettier-formatted; existing files were edited in their current style to keep the diff readable.

---

## 7. Files

**New**
- `supabase/migrations/0014_booking_access_checklist_buku3.sql`
- `supabase/tests/booking-access-checklist-buku3.test.ts`
- `docs/ISSUE-10-IMPROVEMENTS.md` (this file)
- `src/lib/`: `rich-text.ts`, `row-click.ts`, `buku3-bahagian.ts`, `buku3-actions.ts`, `jenama.ts`, plus `rich-text.test.ts`, `buku3-bahagian.test.ts`, `checklists.test.ts`
- `src/components/`: `rich-text-editor.tsx`, `rich-text.tsx`, `buku3-bahagian-form.tsx`, `buku3-badge.tsx`, `muka-kesakitan.tsx`
- `src/routes/`: `admin.senarai-semak.tsx`, `admin.jadual-pemantauan.index.tsx`, `admin.jadual-pemantauan.baru.tsx`, `admin.jadual-pemantauan.$bahagianId.index.tsx`, `admin.jadual-pemantauan.$bahagianId.edit.tsx`

**Changed**
- `package.json`, `package-lock.json` (Quill, DOMPurify)
- `src/styles.css` (rich-text display and the editor's look)
- `src/lib/`: `buku3.ts`, `checklists.ts`, `data.ts`, `db.ts`, `pemantauan.ts`, `supabase/types.ts`
- `src/components/`: `anak-sidebar.tsx`, `app-sidebar.tsx`, `article-form.tsx`, `borang-page.tsx`, `buku3.tsx`, `checklist-editor.tsx`, `pemantauan-report.tsx`, `pemantauan-rujukan.tsx`, `pilihan-skala.tsx`, `temanion-fields.tsx`, `tracker-form-shell.tsx`, `ui/select.tsx`
- `src/routes/`:
  - `__root.tsx`, `login.tsx`, `daftar-anak.tsx`, `daftar-staff.tsx`, `anak.tsx`
  - `admin.artikel.index.tsx`, `admin.artikel.$articleId.index.tsx`, `admin.video.tsx`, `admin.staff.tsx`
  - `anak.informasi.index.tsx`, `anak.informasi.$id.tsx`
  - `staf.index.tsx`, `staf.warga-emas.tsx`, `staf.rekod.index.tsx`, `staf.tracker.$parentId.index.tsx`, `staf.tracker.$parentId.kesakitan.tsx`, `staf.tracker.$parentId.risiko-jatuh.tsx`
- `src/routeTree.gen.ts` (regenerated by the router plugin)
- `docs/SRS.md` (sections for the pages and data above)
