# Issue #9 "Improvement" — Admin side & monitoring reports

**Scope:** GitHub issue #9, from **Admin Side** (items 9–16) to the end (**untuk report**, items 1–5).
The login, Borang and Staff-side items earlier in the issue are outside this change.
**Date:** 14 Oct 2026
**Status:** Implemented and tested locally. **Not yet deployed:** the database migration still has to be applied to the live Supabase project, *before* the new frontend is published (see [Deployment](#3-deployment--order-matters)).

---

## 1. Summary

| # | Request (from the issue) | Result |
|---|---|---|
| 9 | Menu: operations at the top, Artikel/Video at the bottom; Warga Emas → Klien, Staf Aktif → Temanion Aktif, Rekod Harian → Rekod Hari Ini | Done |
| 10 | Add-staff form in the application format (name, age, phone, nationality, gender, race, location, skills); location as a state list with Klang, Perak, Johor first; the rest as address | Done |
| 11 | Staf → Temanion; filter by location; clicking a Temanion's name pops up their page | Done |
| 12 | Family & elderly data — "to be specified elsewhere" | Nothing to do yet |
| 13 | Penerima Servis cards: full name, IC, gender, phone, booking-approved date + service, last Temanion, booker's name (instead of linked-children count); filter by location | Done |
| 14 | Servis Monitoring: remove the Pelanggan column, Warga Emas → Penerima Servis, Caregiver → Temanion, add a search box | Done |
| 15 | Only admin can make bookings | Done (UI + database rule) |
| 16 | Manual → Buku; new Buku 3 (Jadual Pemantauan) | Done |
| R1 | Perkumuhan (urine / stool / vomit, Bristol & urine colour charts) | Done |
| R2 | Mood tracker (tingkah laku & emosi) | Done |
| R3 | Penukaran posisi for bedridden patients (clock-turn schedule) | Done |
| R4 | Pain score | Done |
| R5 | Risiko jatuh | Done |

The five reports (R1–R5) follow units 5–9 of the attached *First Draft of MANUAL 3*. The same manual is shown to families as **Buku 3**.

---

## 2. What changed, item by item

Each item lists what the user now sees, then where it lives in the code.

### Item 9 — Admin menu and dashboard
- **Menu order:** Ringkasan · Pengurusan Temanion · Penerima Servis · Rekod Harian · Servis Monitoring · Borang · Artikel · Video. Education content (Artikel, Video) is last.
- **Dashboard cards:** **Klien** (active care recipients), **Temanion Aktif**, **Rekod Hari Ini**, Kandungan.
- **Rekod Hari Ini** now always counts **today's** records, whatever filter is chosen for the "Rekod terkini" list below it. Before, the card followed the filter and was only titled "Rekod Hari Ini" when the filter was "Hari Ini".
- The admin's first menu item is **Ringkasan** again. Earlier uncommitted work had renamed it "Rekod Servis", but the issue asks for that rename on the **staff** side only.
- Files: `src/components/app-sidebar.tsx`, `src/routes/admin.index.tsx`.

### Item 10 — Temanion details (add / edit form)
- New fields, in the order applications arrive on WhatsApp: **Umur, Jantina, Warganegara (default "Malaysia"), Bangsa, Lokasi, Alamat, Kemahiran**. These sit next to the existing Nama Penuh and No. Telefon.
  - **Lokasi** is a dropdown: Klang, Perak, Johor first, then every other state and federal territory alphabetically (`src/lib/lokasi.ts`). The detailed location ("Setapak Indah, KL") goes in **Alamat**.
  - **Kemahiran** is typed comma-separated ("Elderly, First aid, …"), with one-tap suggestions (Penjagaan Warga Emas, Penggunaan Kerusi Roda, Pertolongan Cemas, Rawatan Luka). It is saved as a list, without repeats.
  - **Umur** must be a whole number from 16 to 100. It is stored as a **birth year**, so the age stays correct in later years.
- These fields only appear when the role is **Temanion**. An Admin account doesn't use them.
- The account itself is still created by the `admin-users` Edge Function (unchanged). The details are saved on the new profile right after; if that second step fails, admin gets a warning and can complete them through **Edit**.
- The details are **admin-managed**: a Temanion can see them but cannot change them. They can still edit their own name, phone and photo on their profile page. A database trigger enforces this.
- Files: `src/routes/admin.staff.tsx`, `src/components/temanion-fields.tsx`, `src/lib/temanion.ts`.

### Item 11 — Pengurusan Temanion list
- All wording is Temanion (page title, buttons, dialogs, "Profil Temanion").
- **Location filter:** Semua lokasi / any location / Tiada lokasi. The search box also matches phone numbers.
- **Click a name → profile pop-up:** personal details (age, gender, nationality, race, phone, email, location, address, join date), skills, Profil Temanion (speciality, experience, rating, notes), and **Tugasan**: the care recipients assigned to them and their active services. An **Edit Maklumat** button opens the edit form.
- Each row shows the Temanion's location.
- Files: `src/routes/admin.staff.tsx`, `src/components/temanion-profile-dialog.tsx`, `src/components/lokasi-select.tsx`.

### Item 13 — Penerima Servis list
Each card now shows exactly the agreed profile:

| Field | Source |
|---|---|
| Full name, IC, gender | Profile (blue / pink person icon instead of initials, as on the staff side) |
| No. Telefon | Profile |
| **Booking Diluluskan** | Date of the **latest approved booking** (not cancelled) + its service type |
| **Temanion Terakhir** | The Temanion of the most recent booking that has **started** (ongoing / completed); if none has started, the latest scheduled one; if there are no bookings, the Temanion assigned for daily records |
| **Penempah Servis** | The family account that made the most recent booking. It replaces "Anak terpaut: N" |
| Lokasi | New field (see below) |

- **Location filter**, same as item 11.
- Care recipients now have a **Lokasi** field, set in *Daftar Penerima Servis* and *Edit*, and shown on the detail page.
- All admin wording changed from Warga Emas to Penerima Servis. This also covers the register, edit and detail pages, Rekod Harian and the booking record page. Family pages are untouched, as item 4 asked.
- Files: `src/routes/admin.warga-emas.index.tsx`, `src/lib/penerima-servis.ts`, `admin.warga-emas.baru.tsx`, `admin.warga-emas.$parentId.edit.tsx`, `admin.warga-emas.$parentId.index.tsx`.

### Item 14 — Servis Monitoring
- Columns: **Tarikh & Masa · Penerima Servis · Servis · Lokasi · Temanion · Status · Tindakan**. "Pelanggan (Anak)" is removed.
- **Search box:** matches care recipient, booker, service, location and Temanion. Words can come in any order, and case and accents are ignored. The status tab counts follow the search.
- Booking detail: **Penempah Servis** (who booked), **Dicipta Pada**, **Diluluskan Pada** (new), **Temanion Ditugaskan**. "Caregiver" is now "Temanion" everywhere on this page.
- Files: `src/routes/admin.servis.tsx`, `src/lib/search.ts`.

### Item 15 — Only admin makes bookings
- **Admin:** new **Tambah Tempahan** button on Servis Monitoring. Steps:
  1. Pick the **Penerima Servis**.
  2. The **Penempah Servis** list shows the family accounts linked to that person; with one account it is picked automatically. If nobody is linked, the form says so and links to the edit page to link a family account.
  3. Pick the service type, date, time, address (pre-filled from the person's address, and it follows when you switch person unless you typed one), transport, optional Temanion, and the starting status **Disahkan** (default) or **Menunggu Pengesahan**.
- **Family (`/anak/service`):** the page is now **Servis**. It has no "Tambah Tempahan" button or booking form, and shows a note to contact admin to book, change or cancel. Their bookings are still listed by status as before.
- **Database:** the rule that let a family insert a booking is removed, so the API refuses it too, not just the screen.
- Files: `src/components/tempahan-baru-dialog.tsx`, `src/lib/tempahan.ts`, `src/routes/admin.servis.tsx`, `src/routes/anak.service.tsx`.

### Item 16 — Buku
- Family menu: **Buku Caregiver** ("Buku" on the phone bar). The page title is **Buku Caregiver**, and the tabs are **Buku 1** (articles), **Buku 2** (videos) and **Buku 3**.
- **Buku 3 — Jadual Pemantauan Pesakit oleh Caregiver** contains the attached Manual 3 draft as an in-app book, in collapsible sections:
  - Peranan Utama, Sasaran Pengguna, Profil dan Maklumat Pesakit, Panduan Penggunaan.
  - Units 1–9, each with its *Arahan am* and reference charts: daily routine list, vital-sign interpretation table, medicine categories and dose-time chart, meal times, Bristol stool chart, urine colour chart, behaviour indicators, clock-turn schedule, Wong-Baker pain scale, and the fall-risk factors with the Morse Fall Scale note.
- The page's search box also searches Buku 3. The topic chips are hidden on Buku 3, since it isn't tagged by topic.
- The text lives in `src/lib/buku3.ts`. When the final Manual 3 is ready, update that file; the forms and Buku 3 read the same scales, so they stay in step.
- Files: `src/components/buku3.tsx`, `src/components/pemantauan-rujukan.tsx`, `src/lib/buku3.ts`, `src/routes/anak.informasi.index.tsx`, `src/components/anak-bottom-nav.tsx`, `src/routes/anak.informasi.$id.tsx`.

### Reports R1–R5 — Jadual Pemantauan (Buku 3, units 5–9)
On a care recipient's **Rekod Harian** page, staff now see a second group of buttons, **Jadual Pemantauan (Buku 3)**: Perkumuhan · Mood & Tingkah Laku · Penukaran Posisi · Skor Kesakitan · Risiko Jatuh.

The forms work like the existing Vital / Ubat / Makanan ones:
- Each saved entry goes into **today's record**. The time is stamped automatically and **Pengesahan** is the Temanion's name, as Manual 3 asks ("tulis nama ringkas anda pada ruangan Pengesahan").
- Each form has a collapsible **Panduan Buku 3** box with that unit's general instructions.

| Report | What staff record | Interpretation shown |
|---|---|---|
| **R1 Perkumuhan** | Type (Air Kencing / Najis / Muntah), urine colour 1–8 (colour swatches) or Bristol type 1–7, how many times (1–20), condition (colour, texture, smell), notes | Urine 1–3 optimum · 4–6 nearly dehydrated · 7–8 dehydrated. Bristol 1–2 constipation · 3–4 normal · 5–7 diarrhoea. Vomiting flagged. |
| **R2 Mood & tingkah laku** | Mood, Interaksi, Tingkah Laku, Emosi — each 1–5 with the manual's labels (at least one), notes | 4 = attention, 5 = worst state |
| **R3 Penukaran posisi** | Position (Baring Terlentang / Mengiring ke Kanan / Mengiring ke Kiri / Lain-lain + text), purpose (quick picks), "redness / pressure-sore signs" tick box, notes | The clock-turn position for the current hour is **pre-selected**; the form shows the last turn today and **when the next turn is due** (2 hours later) |
| **R4 Skor kesakitan** | Score 0–10 with Wong-Baker faces, where it hurts, notes | 0–3 normal · 4–6 attention · 7–10 severe, with the manual's label |
| **R5 Risiko jatuh** | The 8 risk factors (Ya / Tidak), any fall since last check (none / near fall / fall without injury / fall with injury), notes | "N / 8 faktor"; any fall = danger; near fall or any factor = attention. The Morse Fall Scale disclaimer is shown. |

**Where the reports appear:**
- **Staff:** the record history (`Sejarah Rekod`). The Pengesahan column is hidden there, as for the existing tables.
- **Admin:** Rekod Harian detail, and the booking's *Lihat Rekod Harian* page in a new "Jadual Pemantauan (Buku 3)" section. **Rekod Harian** also gets five new category filters.
- **Family:** the Progres page.
- Every view uses a table on desktop and labelled cards on phones.

Files:
- Forms: `src/routes/staf.tracker.$parentId.{perkumuhan,tingkah-laku,posisi,kesakitan,risiko-jatuh}.tsx`
- Scales: `src/lib/pemantauan.ts`
- Display: `src/components/pemantauan-report.tsx`, `record-report.tsx`
- Shared form parts: `tracker-form-shell.tsx`, `pilihan-skala.tsx`, `src/hooks/use-simpan-pemantauan.ts`
- Saving: `src/lib/tracker-actions.ts` (`addPemantauanEntry`)
- Filters: `src/lib/tracker-filters.ts`, `src/routes/admin.tracker.tsx`
- Staff hub: `src/routes/staf.tracker.$parentId.index.tsx`
- Booking record page: `src/routes/admin.rekod-penjagaan.$bookingId.tsx`

---

## 3. Deployment — order matters

All database changes are in **`supabase/migrations/0013_admin_side_and_monitoring.sql`**. It is safe to re-run.

1. **Apply migration 0013 to the live project first.** Use the Supabase dashboard → SQL Editor (paste the file and run it) or the Supabase MCP, the same way 0006–0012 were applied.
2. **Then publish the frontend** (push to `main` → GitHub Pages workflow; Lovable syncs from the branch).

Why this order:
- **New frontend before the migration** would break pages: the Temanion page and the new report forms read and write columns that don't exist yet.
- **Migration before the new frontend** is safe. The only visible effect is that a family pressing the *old* "Tambah Tempahan" button gets an error, which is the intended new rule.

> Migrations 0006–0012 were applied by hand, so Supabase's migration history on the live project only lists 0001–0005. That is unchanged by this work.

### What migration 0013 does

| Area | Change |
|---|---|
| `profiles` | New columns `tahun_lahir`, `jantina`, `bangsa`, `warganegara`, `lokasi`, `alamat`, `kemahiran text[]`. Checks: birth year 1900–2100, at most 30 skills. The trigger `enforce_admin_caregiver_details` now also blocks non-admins from changing these columns (error *"Hanya admin dibenarkan mengemas kini maklumat Temanion."*). |
| `parents` | New column `lokasi`. |
| `bookings` | Policy **`bookings_anak_insert` dropped**, so only admin (`bookings_admin_all`) can create bookings. New column `confirmed_at`, owned by the trigger `trg_booking_confirmed`: set the first time a booking becomes confirmed / ongoing / completed, never changed afterwards, and any value sent by a client is ignored. **Existing** approved bookings are backfilled with their creation time, because the real approval time was never recorded. |
| `tracker_records` | New JSON array columns `perkumuhan_entries`, `tingkah_laku_entries`, `posisi_entries`, `kesakitan_entries`, `risiko_jatuh_entries`, each checked to be an array. The existing row rules apply: the recording staff writes; admin, that staff and linked family read. |

No Edge Function change is needed.

---

## 4. Decisions made where the issue left a choice

These are the defaults from the analysis you confirmed. Each is easy to change if you prefer something else.

1. **Admin "Ringkasan"** keeps its name. "Rekod Servis" is the staff dashboard only.
2. **"Klien"** (Malay spelling) on the dashboard card. The menu and pages say **Penerima Servis**, per item 4 ("staff dengan admin je").
3. **"Rekod Hari Ini"** always counts today's records.
4. **Location list:** Klang, Perak, Johor first (as asked), then all states and federal territories, **including Selangor** (Klang is a town in Selangor). The same list is used for Temanion and Penerima Servis.
5. **Age** is entered as Umur and stored as a birth year (16–100 allowed).
6. **Temanion details are admin-only**, like the existing caregiver card fields.
7. **A booking needs a family account linked to the care recipient.** That account is the *Penempah Servis* and lets the family follow the booking and progress. Admin can create the family account while registering a care recipient, or link one on the Edit page.
8. **New admin bookings start as "Disahkan"** by default (admin can choose "Menunggu Pengesahan").
9. **Family booking edits:** the old "reschedule" database rule (migration 0005) is kept; its button was already hidden in the app. Only *creating* bookings is now admin-only.
10. **Buku 3** shows the manual as reading material. The family sees the actual monitoring entries on Progres.
11. **The new reports don't change a record's Normal / Perlu Perhatian / Kritikal badge.** That still comes from vital signs only. Each entry shows its own coloured interpretation instead.
12. **"Temanion Terakhir"** means the Temanion of the latest service that has started, falling back as described in item 13.

---

## 5. Testing

All tests ran on 14 Oct 2026 against a **local** Supabase (Docker) built from migrations 0001–0013. The live project was never touched.

| Check | Command | Result |
|---|---|---|
| Unit tests (scales & interpretation, clock-turn schedule, location list & filter, age/skills parsing, Penerima Servis summary, search, booking validation & address rule, Buku 3 content incl. vital table vs. the app's checks, Rekod Harian filters) | `npm test` | **87 passed** |
| Database tests (rules & triggers, as real admin / Temanion / family users) | see below | **16 passed** |
| Migrations from an empty database, 0001→0013 | `npx supabase db reset` | Clean (run 4 times) |
| Re-running 0013 on an already-migrated database | `psql < 0013…sql` (twice) | Clean; one trigger, no duplicate constraints |
| `confirmed_at` backfill | simulated pre-migration rows | confirmed / completed → creation time; pending / cancelled → empty |
| Database function lint | `npx supabase db lint --local` | No errors |
| End-to-end in Chrome (app on the local database, seeded data) | scripted browser run | **37 / 37 checks passed**, desktop and 390 px phone |
| Type-check | `npx tsc --noEmit` | Pass |
| Production build (as CI) | `npm run build` | Pass |
| Lint on new files | `npx eslint …` | Clean |

**Database tests check that:**
- A family **cannot** create a booking, but admin can.
- The approval time is set by the database, ignores client values, survives later status changes, and stays empty for bookings cancelled before approval.
- A family cannot fake the approval time through their reschedule right.
- Families still see only their own bookings.
- The Temanion service list still works, with the booker's name.
- Admin can save Temanion details; a Temanion can read but not change them, yet can still edit their own name and phone.
- A bad birth year and more than 30 skills are rejected.
- Admin can set a person's location; a family cannot.
- A Temanion saves all five report lists; the linked family reads them back unchanged; an unrelated family or another Temanion can neither see nor change them; non-array data is rejected.

**End-to-end checks covered:**
- Every item above, as admin, Temanion and family: menu order, card labels and counts, the age validation, adding a Temanion with all new fields, both location filters, the profile pop-up and editing from it, the card fields for four different booking situations, the gender icons, the register and edit location field, Servis Monitoring columns, search and the empty state, and booking validation, family hint, auto-picked booker and address pre-fill.
- Every report form, including its validation messages, interpretation labels, the clock-turn pre-selection and the next-turn time.
- History and Progres views, with and without Pengesahan.
- Buku 3 tabs, accordion and search, and the family Servis page.
- No "Warga Emas" / "Caregiver" left on the admin pages.
- The only browser console error was a missing favicon (404), which predates this work.

**Bugs found and fixed during testing:**
- *Tambah Tempahan:* switching to another person left the previous person's address in the address box. It now follows the chosen person unless admin typed an address. This has a unit test.
- *Location filter:* the pin icon was drawn above the value instead of beside it.
- *Report tables:* short score labels ("2 · Ceria") wrapped onto two lines on desktop.

**Running the tests yourself**
```bash
npm test                                  # unit tests (database tests skip themselves)

# database tests — needs Docker
npx supabase start
npx supabase status -o env                # gives API_URL, ANON_KEY, SERVICE_ROLE_KEY
SUPABASE_TEST_URL=http://127.0.0.1:54321 \
SUPABASE_TEST_ANON_KEY=<ANON_KEY> SUPABASE_TEST_SERVICE_KEY=<SERVICE_ROLE_KEY> \
npx vitest run supabase/tests
```
The database tests refuse to run unless the URL is `localhost` / `127.0.0.1`. They create and delete users, so they must never point at production. The test admin account is left behind on purpose: the database refuses to delete the last active admin.

---

## 6. Notes, limitations and follow-ups

- **Manual 3 draft inconsistencies** (the app follows the table of contents):
  - The behaviour unit is printed as "UNIT 5" (should be 6) and fall risk as "UNIT 8" (should be 9).
  - The position-change tables are headed "Contoh Jadual Pemerhatian Tingkah Laku dan Emosi".
  - Worth fixing in the final manual.
- **Record badge thresholds:** the whole-record badge (Normal / Perlu Perhatian / Kritikal) uses older cut-offs (e.g. temperature ≥ 39 °C critical). These differ from Manual 3's table, which the per-reading Amaran/Bahaya pills follow, and Buku 3's table matches the per-reading pills (pinned by a unit test). This is outside issue #9 and was not changed.
- **Existing approved bookings** show their creation date as "Booking Diluluskan" (backfill). New approvals are exact.
- **Staff "Rekod Saya"** completion indicators still count the four original categories; the monitoring reports are optional per patient.
- **Item 12** (family and elderly data) is waiting for the issue author's details.
- **Tooling:**
  - `vitest` was added as a dev dependency with `npm test`; `package-lock.json` is updated.
  - `bun.lock` was already out of date before this work (it lacks `@supabase/supabase-js`) and was not touched. CI uses `npm ci`.
  - `supabase/.gitignore` was added so local Supabase CLI files (`.branches`, `.temp`) are never committed.
- **Formatting:** the existing code base is not Prettier-formatted (`npm run lint` reports formatting errors in untouched files). New files are formatted; existing files were edited in their current style to keep the diff readable.

---

## 7. Files

**New**
- `supabase/migrations/0013_admin_side_and_monitoring.sql`
- `supabase/tests/admin-side-and-monitoring.test.ts`
- `supabase/.gitignore`
- `vitest.config.ts`
- `docs/ISSUE-9-ADMIN-AND-REPORTS.md` (this file)
- `src/lib/`: `lokasi.ts`, `temanion.ts`, `pemantauan.ts`, `penerima-servis.ts`, `tempahan.ts`, `search.ts`, `buku3.ts`, plus a `*.test.ts` for each and `tracker-filters.test.ts`
- `src/hooks/use-simpan-pemantauan.ts`
- `src/components/`: `lokasi-select.tsx`, `temanion-fields.tsx`, `temanion-profile-dialog.tsx`, `tempahan-baru-dialog.tsx`, `pemantauan-rujukan.tsx`, `pemantauan-report.tsx`, `pilihan-skala.tsx`, `tracker-form-shell.tsx`, `buku3.tsx`
- `src/routes/`: `staf.tracker.$parentId.perkumuhan.tsx`, `…tingkah-laku.tsx`, `…posisi.tsx`, `…kesakitan.tsx`, `…risiko-jatuh.tsx`

**Changed**
- `package.json`, `package-lock.json` (Vitest, `test` script)
- `src/lib/`: `db.ts`, `mock-data.ts`, `supabase/types.ts`, `tracker-actions.ts`, `tracker-filters.ts`
- `src/components/`: `app-sidebar.tsx`, `anak-bottom-nav.tsx`, `record-report.tsx`
- `src/routes/`:
  - `admin.index.tsx`, `admin.staff.tsx`, `admin.servis.tsx`, `admin.tracker.tsx`
  - `admin.rekod-harian.$recordId.tsx`, `admin.rekod-penjagaan.$bookingId.tsx`
  - `admin.warga-emas.index.tsx`, `admin.warga-emas.baru.tsx`, `admin.warga-emas.$parentId.edit.tsx`, `admin.warga-emas.$parentId.index.tsx`
  - `anak.service.tsx`, `anak.informasi.index.tsx`, `anak.informasi.$id.tsx`
  - `staf.tracker.$parentId.index.tsx`
- `src/routeTree.gen.ts` (regenerated by the router plugin)
- `docs/SRS.md` (sections for the pages above)
