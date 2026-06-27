# Software Requirements Specification (SRS)
## Teman — Elderly Care Management System ("CareSenior")

**Document type:** Functional SRS (documents the existing mockup for production)
**Version:** 1.0
**Date:** 2026-06-27
**Status:** Baseline for Phase 2 (backend implementation on Supabase + GitHub)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the **functional requirements** of the Teman Elderly Care Management System as it exists in the current mockup, written so the team can implement it for production. It describes every page, what the user can do on it, what data it reads and writes, and the business rules that govern it.

Scope of this document is **functional only** — it does not contain database DDL, Row-Level Security policies, or API contract definitions. Those are produced in a separate technical design once this functional baseline is approved. It also documents **existing features only**; no new features are proposed here.

### 1.2 Product vision & objectives
Teman is a Malaysian company providing care services for the elderly. The system gives Teman a single platform to:

1. **Centralize service bookings** — view and manage every care service booked by families.
2. **Monitor staff work and elderly data** — see what caregivers record daily (vitals, medication, meals, activities) and manage elderly profiles.
3. **Provide live data to families/guardians** — let the elderly's children see near-real-time updates on their parent's condition.

### 1.3 Intended audience
- Teman operations/admin staff (primary users and reviewers of this spec).
- Developers implementing the Supabase backend and wiring it to the existing UI.

### 1.4 Glossary (domain terms)
The UI is in **Malay**. Key terms used throughout this document and the codebase:

| Term | Meaning |
|------|---------|
| **Warga emas** | Elderly person under care (the "Parent" entity) |
| **Anak** | Family member / guardian (the elderly's child) — an end-user role |
| **Staf / Penjaga** | Staff / caregiver — an end-user role |
| **Admin** | Teman operations user — an end-user role |
| **Rekod** | Record (a daily care record / tracker record) |
| **Tracker** | The daily care-logging feature used by staff |
| **Vital / Tanda vital** | Vital signs (temperature, blood pressure, pulse, etc.) |
| **Ubat / Ubatan** | Medication |
| **Makanan & minuman** | Food and drink intake |
| **Aktiviti** | Daily activity report |
| **Servis** | A booked care service |
| **Senarai semak** | Daily care checklist |
| **Waktu** | Time slot / period of day (pagi/tengahari/petang/malam) |
| **Pengesahan** | Confirmation — the staff member who recorded an entry |

---

## 2. Overall Description

### 2.1 User roles & access
There are three roles (`Role = "admin" | "staff" | "anak"`). Each role has its own panel and is redirected to it on login; users cannot access another role's panel. Unauthenticated users are redirected to `/login`.

| Role | Panel prefix | Primary purpose |
|------|--------------|-----------------|
| **Admin** | `/admin` | System oversight: manage staff, elderly, content, monitor records & bookings |
| **Staff** | `/staf` | Daily care delivery: record vitals, medication, meals, activities for assigned elderly |
| **Anak (Family)** | `/anak` | Register elderly, book services, view elderly progress, read information |

User accounts also carry a **status**: `active`, `pending`, `rejected`, `inactive`. Only `active` users can sign in.

### 2.2 Technology context (current implementation)
- **Frontend:** React 19, TypeScript, TanStack Start + TanStack Router (file-based routing), TanStack Query.
- **UI:** Tailwind CSS v4, shadcn/ui (Radix primitives), Lucide icons, Framer Motion (transitions), Recharts (vital-sign charts), Sonner (toasts).
- **Forms:** React Hook Form + Zod.
- **Current data layer:** in-memory mock arrays in `src/lib/mock-data.ts`; auth is a `localStorage` stub in `src/lib/auth-store.ts` with hardcoded demo credentials.
- **Production backend target:** Supabase (Auth, Postgres database, Storage for photos/PDFs, Realtime for live family updates). Source control on GitHub.

> **Implementation note for production:** Every "Data read" / "Data written" line in Section 3 currently maps to a mutation of the in-memory arrays. In production these become Supabase queries/mutations against the corresponding tables (Section 4), behind Supabase Auth with role-based access.

### 2.3 Navigation map (all routes)
**Public / Auth**
- `/` — Landing page
- `/login` — Login
- `/daftar-staff` — Staff registration
- `/daftar-anak` — Family registration

**Admin** (`/admin`, role = admin)
- `/admin` — Dashboard
- `/admin/staff` — Staff management
- `/admin/warga-emas` — Elderly list
- `/admin/warga-emas/baru` — Register new elderly
- `/admin/warga-emas/$parentId` — Elderly detail/edit
- `/admin/tracker` — All daily records
- `/admin/artikel` — Article management
- `/admin/video` — Video management
- `/admin/servis` — Service booking monitoring

**Staff** (`/staf`, role = staff)
- `/staf` — Dashboard
- `/staf/warga-emas` — My assigned elderly
- `/staf/rekod` — My records
- `/staf/tracker/$parentId` — Daily tracker hub
- `/staf/tracker/$parentId/vital` — Record vital signs
- `/staf/tracker/$parentId/ubat` — Record medication given
- `/staf/tracker/$parentId/makanan` — Record food & drink
- `/staf/tracker/$parentId/aktiviti` — Daily activity report
- `/staf/tracker/$parentId/sejarah/$recordId` — View a past record

**Anak / Family** (`/anak`, role = anak)
- `/anak` — Home
- `/anak/daftar-warga` — Register elderly
- `/anak/service` — Service booking (history + new booking)
- `/anak/perkembangan` — Progress list
- `/anak/perkembangan/$parentId` — Elderly progress detail
- `/anak/informasi` — Information library
- `/anak/informasi/$id` — Article/video detail

---

## 3. Functional Requirements

Each page below is specified as: **Purpose · Access · UI · Functions · Data read · Data written · Rules · States.**

### 3.A Public & Authentication

#### 3.A.1 Landing page — `/`
- **Purpose:** Public entry point introducing the service and linking to login/registration.
- **Access:** Anyone.
- **UI:** Marketing/intro content, links to `/login`, `/daftar-anak`, `/daftar-staff`.
- **Functions:** Navigate to login or registration.
- **States:** Static.

#### 3.A.2 Login — `/login`
- **Purpose:** Authenticate a user and route them to their role panel.
- **Access:** Anyone (unauthenticated).
- **UI:** Email field, password field, submit button; (mockup also shows demo-credential shortcuts).
- **Functions:** Submit credentials → on success, store session and redirect by role (admin → `/admin`, staff → `/staf`, anak → `/anak`); on failure show an error.
- **Data read:** User account by email; verify password and that `status = active`.
- **Data written:** Active session.
- **Rules:** Only `active` users may sign in. Wrong credentials or non-active status → rejected.
- **States:** Idle, submitting, error (invalid credentials).

#### 3.A.3 Staff registration — `/daftar-staff`
- **Purpose:** Let a prospective caregiver apply for an account.
- **Access:** Anyone.
- **UI:** Name, email, phone, password; note that the application is reviewed by admin before activation.
- **Functions:** Submit application → confirmation toast ("Awaiting admin approval") → return to login.
- **Data written:** New `User` with `role = staff`, `status = pending`.
- **Rules:** Account is **not** usable until an admin sets status to `active` (see 3.B.2). 
- **States:** Idle, submitting, submitted.

#### 3.A.4 Family registration — `/daftar-anak`
- **Purpose:** Let a family member create an account (so they can read content and later add elderly / book services).
- **Access:** Anyone.
- **UI:** Name, email, phone, password; note that elderly can be added later (not required at registration).
- **Functions:** Submit → account created and signed in immediately → redirect to `/anak`.
- **Data written:** New `User` with `role = anak`, `status = active`.
- **Rules:** Family accounts are active immediately (no approval needed).
- **States:** Idle, submitting.

### 3.B Admin Panel

#### 3.B.1 Admin dashboard — `/admin`
- **Purpose:** System-wide summary at a glance.
- **Access:** Admin.
- **UI:** Stat cards (total elderly, active staff, daily records, content count); table of the most recent daily records (elderly name, time, blood pressure, blood sugar, status badge).
- **Data read:** Counts across `parents`, `users` (staff), `trackers`, content; latest tracker records.
- **States:** Loading, populated, empty.

#### 3.B.2 Staff management — `/admin/staff`
- **Purpose:** Approve, edit and manage caregiver accounts.
- **Access:** Admin.
- **UI:** Search box; table of staff (name, email, phone, status, actions); "Add staff" dialog; edit dialog.
- **Functions:**
  - Search staff by name/email.
  - Add a staff account (name, email, phone, password) — created active by admin.
  - Edit a staff account (name, phone, status).
  - Change status: `active`, `pending`, `rejected`, `inactive` (this is how pending applications from 3.A.3 are approved/rejected).
- **Data read:** `users` where `role = staff`.
- **Data written:** Create/update `User` records (staff).
- **Rules:** Status governs whether the staff member can log in (only `active`).
- **States:** Loading, list, empty, no-search-results.

#### 3.B.3 Elderly list — `/admin/warga-emas`
- **Purpose:** Browse all elderly residents.
- **Access:** Admin.
- **UI:** Search box; responsive card grid — each card shows avatar/initials, full name, IC, gender, medical condition, assigned staff name, number of linked family members, relationship badge. "Register new" button → `/admin/warga-emas/baru`.
- **Data read:** `parents` (all); resolves assigned staff name and linked anak count.
- **States:** Loading, grid, empty, no-search-results.

#### 3.B.4 Register new elderly — `/admin/warga-emas/baru`
- **Purpose:** Admin creates a full elderly profile, optionally creating/linking a family account at the same time.
- **Access:** Admin.
- **UI / fields (4 sections):**
  1. **Personal:** full name, IC, birth date, gender (L/P), phone, relationship, address.
  2. **Medical:** blood type, mobility status, cognitive status, insurance no., medical condition, medication list, allergies, dietary restrictions.
  3. **Doctor:** doctor name, doctor/clinic phone, referral hospital/clinic.
  4. **Emergency & child account:** emergency contact (Name — Phone); checkbox to **create a new child (anak) account** at the same time (name, email, phone, temporary password) **or** select/link an **existing** child account from a dropdown.
- **Functions:** Validate, submit → success toast → return to elderly list. If creating a child account, that account is created and linked.
- **Data written:** New `Parent`; optionally new `User` (role anak) linked via `anakIds`, or link to an existing anak.
- **Rules:** Required fields per section enforced. Gender constrained to L/P.
- **States:** Idle, validating, submitting, success.

#### 3.B.5 Elderly detail / edit — `/admin/warga-emas/$parentId`
- **Purpose:** View and edit a single elderly profile and see their health trend.
- **Access:** Admin.
- **UI:** Header (avatar, name, IC, gender, relationship, status); Personal info card; Medical info card; Assignments card (assigned caregiver, linked family members, total record count); **vital-sign charts** (VitalCharts) showing trends across records.
- **Functions:** Edit profile fields; view assignment; view vital trends.
- **Data read:** `Parent` by id; assigned staff; linked anak; this elderly's `trackers` (for charts).
- **Data written:** Updated `Parent`.
- **States:** Loading, loaded, not-found.

#### 3.B.6 All daily records — `/admin/tracker`
- **Purpose:** Oversight of every daily care record from all staff/elderly.
- **Access:** Admin.
- **UI:** Filters — elderly (all/specific), staff (all/specific), date range (from/to), category (vital signs, medication, food/drink, checklist, daily report). Table — elderly name, date/time, staff name, category indicators (icons for what was recorded), status badge, view action. Detail sheet shows the full record (all vital entries, medication, food, activity, checklist, photos).
- **Functions:** Filter; open a record's full detail; (admin can grant edit access to a record — see Rules).
- **Data read:** `trackers` (all), filtered.
- **Data written:** Optionally set `editAllowed` on a record to re-open it for staff editing.
- **Rules:** Record status (normal/attention/critical) is derived from vitals. After the 24h window staff cannot edit unless admin grants access (see 5.3).
- **States:** Loading, list, filtered-empty.

#### 3.B.7 Article management — `/admin/artikel`
- **Purpose:** Manage the educational articles shown to families.
- **Access:** Admin.
- **UI:** "Add article" dialog; table (title, topic, subtopic, views, visibility, created date, actions); edit/delete with confirmation; bulk select.
- **Form fields:** title, topic, subtopic, cover image URL, body, PDF URL + name, optional supporting YouTube URL, visibility (published/draft).
- **Functions:** Create, edit, delete; toggle visibility; assign topic/subtopic taxonomy.
- **Data read:** `articles`; topic/subtopic taxonomy.
- **Data written:** Create/update/delete `Article`.
- **Rules:** Only `published` articles are visible to family (see 5.5).
- **States:** Loading, list, empty.

#### 3.B.8 Video management — `/admin/video`
- **Purpose:** Manage educational videos shown to families.
- **Access:** Admin.
- **UI:** Similar to articles; table with preview/edit/delete; preview modal embeds the YouTube video.
- **Form fields:** title, topic, subtopic, YouTube URL (primary embed), description, optional PDF URL + name, visibility.
- **Functions:** Create, edit, delete; preview; toggle visibility.
- **Data read/written:** `Video` records.
- **Rules:** Only `published` videos visible to family.
- **States:** Loading, list, empty.

#### 3.B.9 Service booking monitoring — `/admin/servis`
- **Purpose:** Manage all care-service bookings end-to-end.
- **Access:** Admin.
- **UI:** Status tabs (All, Pending, Confirmed, Ongoing, Completed, Cancelled); booking table (elderly name, service type, date/time, location, transport, assigned caregiver, status, actions); detail dialog.
- **Detail dialog:** elderly profile; booking details (date, time, location, service type, notes); transport mode; **assign/change caregiver** dropdown; **payment status** dropdown (Belum Bayar / Deposit / Telah Bayar); **price (RM)** field; status action buttons (Confirm / Start / Complete / Cancel). Shows assigned caregiver card (avatar, name, specialization, experience, rating).
- **Functions:** Filter by status; assign caregiver; set price & payment status; transition booking status.
- **Data read:** `bookings`, `caregivers`, `parents`.
- **Data written:** Update `Booking` (status, caregiverId, price, paymentStatus).
- **Rules:** Status transitions follow the booking lifecycle (see 5.4).
- **States:** Loading, per-tab list, empty.

### 3.C Staff Panel

#### 3.C.1 Staff dashboard — `/staf`
- **Purpose:** Caregiver's daily starting point.
- **Access:** Staff.
- **UI:** Greeting with staff name; stat cards (number of assigned elderly, records today, records needing attention); card grid of "my elderly" with last-record time and a "new record" button.
- **Data read:** `parents` where `staffId = current user`; this staff's `trackers`.
- **States:** Loading, populated, empty (no assigned elderly).

#### 3.C.2 My assigned elderly — `/staf/warga-emas`
- **Purpose:** See the elderly assigned to this caregiver, with care-relevant details.
- **Access:** Staff.
- **UI:** Card grid — avatar/initials, name, medical condition; expandable details (phone, address, medication, emergency contact); "Tracker record" button → opens the tracker hub for that elderly.
- **Data read:** `parents` where `staffId = current user`.
- **States:** Loading, grid, empty.

#### 3.C.3 My records — `/staf/rekod`
- **Purpose:** Review the records this caregiver has submitted and see daily completion.
- **Access:** Staff.
- **UI:** Per-elderly cards with last-record date/time and four care-category indicators with completion state: **Vital signs**, **Medication**, **Food & drink**, **Daily report**; status badge; click to expand full record detail.
- **Data read:** `trackers` where `staffId = current user`.
- **States:** Loading, list, empty.

#### 3.C.4 Daily tracker hub — `/staf/tracker/$parentId`
- **Purpose:** Central place to log all care for one elderly on the current day, item by item in real time.
- **Access:** Staff (the elderly's assigned caregiver).
- **UI:** Info banner (elderly name + recording staff name); guidance note ("press a button to record each item as it happens; each entry is auto-saved with the current time"); tab bar with **Rekod** and **Senarai Semak (Checklist)**.
  - **Rekod tab:** four action buttons → Vital, Ubat, Makanan & Minuman, Laporan Aktiviti Harian; plus a timeline of the latest ~10 entries (vitals/medication/food) with timestamps.
  - **Senarai Semak tab:** the 8-item daily care checklist (interactive checkboxes), a progress indicator (X/8), and a "Catatan Khas" (special notes) textarea — auto-saved on change.
- **Functions:** Navigate to each entry sub-page; tick checklist items; write special notes.
- **Data read/written:** Today's `TrackerRecord` for this (elderly, staff, date); created if it doesn't exist yet. Updates `checklist`, `catatanKhas`.
- **The 8 checklist items (`DEFAULT_CHECKLIST`):** Mandi/kebersihan diri · Tukar pakaian · Ambil ubat mengikut jadual · Sarapan/makan mengikut waktu · Senaman ringan/pergerakan · Pantau tanda vital · Minum air mencukupi · Rehat/tidur secukupnya.
- **States:** Loading, ready, saving.

#### 3.C.5 Record vital signs — `/staf/tracker/$parentId/vital`
- **Purpose:** Record a single vital-signs reading.
- **Access:** Staff.
- **UI / fields:** Suhu (°C), BP Sistolik (mmHg), BP Diastolik (mmHg), Nadi (bpm), Pernafasan (/min), Gula Darah (mmol/L), Oksigen/SpO₂ (%); current timestamp shown.
- **Functions:** Enter values → save. Each vital sign is independently validated and shows its own status (Normal / Amaran / Bahaya) per the thresholds in Section 4.6.
- **Data written:** Append a `VitalEntry` (with `masa` = current ISO time, `pengesahan` = staff name) to today's tracker record; the record's overall status is derived.
- **Rules:** Per-vital thresholds (4.6); overall record status via `computeVitalStatus` (4.5). Editable within 24h window (5.3).
- **States:** Idle, validating, saved.

#### 3.C.6 Record medication given — `/staf/tracker/$parentId/ubat`
- **Purpose:** Record which medicines were administered, and maintain the elderly's medication master list.
- **Access:** Staff.
- **UI:** Two sections — **Regular (scheduled)** medications and **PRN (as-needed)** medications. Each medication card shows name, dose, administration route, frequency, notes, and a checkbox to mark as given. "Add new medication" button opens a form (name, dose, route, frequency, notes, PRN flag). Optional note for this giving event.
- **Functions:** Tick medicines given; add a new medicine to the master list; save the giving event.
- **Data read:** `medications` for this elderly (`medsForParent`).
- **Data written:** Append an `UbatanEntry` (selected items, `masa`, `pengesahan`) to today's tracker record; optionally create a new `Medication` in the master list.
- **Rules:** PRN/emergency medicines must be selected manually. Editable within 24h window.
- **States:** Idle, saving, saved.

#### 3.C.7 Record food & drink — `/staf/tracker/$parentId/makanan`
- **Purpose:** Log a meal / drink intake.
- **Access:** Staff.
- **UI / fields:** Jenis makanan (food type), jenis minuman (drink type), kuantiti (Tidak Makan / Suku / Separuh / 3 Suku / Penuh), cecair ml (liquid in ml), catatan (notes); current timestamp shown.
- **Functions:** Enter and save.
- **Data written:** Append a `MakananEntry` (`masa`, `pengesahan`) to today's tracker record.
- **Rules:** At least one field must be filled. Editable within 24h window.
- **States:** Idle, validating, saved.

#### 3.C.8 Daily activity report — `/staf/tracker/$parentId/aktiviti`
- **Purpose:** Describe the elderly's activities/mood for the day, with photos.
- **Access:** Staff.
- **UI:** Activity textarea (e.g. "walked in garden, coloured pictures, chatted with family"); photo gallery with multiple uploads, thumbnail grid, remove (X) per photo, add-more box; current timestamp.
- **Functions:** Enter text and/or upload photos; save.
- **Data written:** Set `aktiviti`, `gambar[]` (photo references), and `aktivitiPengesahan` (staff name) on today's tracker record. **Production:** photos stored in Supabase Storage; URLs referenced here.
- **Rules:** Requires text **or** at least one photo. Editable within 24h window.
- **States:** Idle, uploading, saved.

#### 3.C.9 View past record — `/staf/tracker/$parentId/sejarah/$recordId`
- **Purpose:** Read a previously submitted record (history).
- **Access:** Staff.
- **UI:** Full read view of the record (vitals, medication, food, activity, checklist, photos).
- **Data read:** `TrackerRecord` by id.
- **Rules:** Read-only unless the record is still within the 24h edit window or admin granted edit access.
- **States:** Loading, loaded, not-found.

### 3.D Anak (Family) Panel

#### 3.D.1 Family home — `/anak`
- **Purpose:** Family member's overview of their registered elderly.
- **Access:** Anak.
- **UI:** Welcome hero card; "Orang Tersayang" (loved ones) card grid — each card shows the elderly name, relationship, last-record time, and links to that elderly's progress. Empty state with a link to register an elderly.
- **Data read:** `parents` where `anakIds` contains the current user.
- **States:** Loading, populated, empty.

#### 3.D.2 Register elderly — `/anak/daftar-warga`
- **Purpose:** Family requests registration of an elderly relative for care.
- **Access:** Anak.
- **UI / fields:** full name, IC, birth date, gender, phone, address, medical condition (optional), medication notes (optional), emergency contact (optional), your relationship (e.g. Ibu/Ayah).
- **Functions:** Submit → toast "Registered. Awaiting admin review." → return home.
- **Data written:** A new elderly registration request linked to this anak, pending admin review.
- **Rules:** Requires admin review before the elderly becomes an active managed profile and is assigned a caregiver (see 5.2).
- **States:** Idle, submitting, submitted.

#### 3.D.3 Service booking — `/anak/service`
- **Purpose:** Book care services and manage existing bookings.
- **Access:** Anak.
- **UI — two modes:**
  - **History (default):** tabs Akan Datang (Upcoming) / Sedang Berlangsung (Ongoing) / Selesai (Completed) / Dibatalkan (Cancelled). Each booking card shows elderly name, service type, date/time, location, transport, status badge, and the assigned caregiver (avatar, name, specialization, rating, experience). Actions: view detail, cancel (if cancellable), reschedule (date/time pickers).
  - **New booking form:** select elderly (from this user's registered elderly), service type (Companion vs Care), date & time, location, transport (Sendiri / Hantar / Pickup), notes. Submit creates the booking.
- **Functions:** Create booking; view; cancel; reschedule; filter by status.
- **Data read:** `bookings` where `anakId = current user`; `caregivers`; this user's `parents`.
- **Data written:** Create `Booking` (status `pending`); update (reschedule date/time) or cancel.
- **Rules:** New bookings start `pending` (admin confirms & assigns caregiver — 3.B.9). A booking may be created without a registered elderly (`parentId` optional). Booking lifecycle in 5.4.
- **States:** Loading, per-tab list, empty per tab, form idle/submitting.

#### 3.D.4 Progress list — `/anak/perkembangan`
- **Purpose:** Choose which elderly's progress to view.
- **Access:** Anak.
- **UI:** List/grid of this family's elderly, each linking to their progress detail.
- **Data read:** `parents` where `anakIds` contains current user.
- **States:** Loading, list, empty.

#### 3.D.5 Progress detail — `/anak/perkembangan/$parentId`
- **Purpose:** View an elderly's daily care records and health trends (the core "live data to family" feature).
- **Access:** Anak (must be linked to the elderly via `anakIds`).
- **UI:**
  - Header: elderly name, relationship, medical condition, "live update" badge.
  - **Date filter:** popover calendar — single day or date range; days without records are disabled; clear button.
  - **Daily record cards** for the selected period, each showing:
    - **Vital signs:** entries by time with temperature, BP, pulse, breathing, blood sugar, O₂, and per-vital status badge (Normal/Amaran/Bahaya).
    - **Medication:** medicines given by time of day, with dose, route, and confirming staff.
    - **Food & drink:** meals by time with food/drink type, quantity, liquid volume, notes.
    - **Activity report:** the day's activity text + confirming staff.
    - **Checklist:** the 8-item checklist with done/not-done indicators.
    - **Photos:** activity-photo thumbnails.
  - **Vital-sign charts** (VitalCharts) across the selected range.
  - **Live update:** the page polls for new staff records (~every 4 seconds in the mockup). **Production:** replace polling with Supabase Realtime subscriptions.
- **Data read:** `parents` by id (verify link to current anak); `trackers` for that elderly in the date range.
- **Rules:** Read-only. A family member may only view elderly linked to them.
- **States:** Loading, populated, empty (no records / none in range), not-authorized.

#### 3.D.6 Information library — `/anak/informasi`
- **Purpose:** Browse educational articles and videos.
- **Access:** Anak.
- **UI:** Search bar; topic filter buttons (All + the four topics); dynamic subtopic filter; tabs for Articles vs Videos; content cards (cover image, title, topic/subtopic badges, view count).
- **Functions:** Search; filter by topic/subtopic; open an item.
- **Data read:** `articles` and `videos` where `visibility = published`; taxonomy (4.7).
- **States:** Loading, grid, empty, no-results.

#### 3.D.7 Article/video detail — `/anak/informasi/$id`
- **Purpose:** Read an article or watch a video.
- **Access:** Anak.
- **UI:** Back button; cover image; topic/subtopic badges; title; body. If a PDF exists: "Dokumen PDF" with download + embedded PDF viewer. If a YouTube URL exists: embedded video player.
- **Functions:** Read/watch; download PDF; increment view count.
- **Data read:** `Article` or `Video` by id.
- **Data written:** Increment `views`.
- **States:** Loading, loaded, not-found.

---

## 4. Data Model (functional level)

Plain-language entity catalog derived from the current type definitions. Relationships are noted; this is **not** the database schema (DDL/RLS come later).

### 4.1 User
A login account for any role.
| Field | Meaning |
|-------|---------|
| id | Unique identifier |
| name | Full name |
| email | Login email (unique) |
| role | `admin` \| `staff` \| `anak` |
| status | `active` \| `pending` \| `rejected` \| `inactive` |
| phone | Contact number (optional) |

### 4.2 Parent (Warga Emas / Elderly)
The elderly person under care.
| Field | Meaning |
|-------|---------|
| id | Unique identifier |
| fullName | Full name |
| ic | National IC number |
| birthDate | Date of birth |
| gender | `L` (male) \| `P` (female) |
| address | Home address |
| phone | Contact number |
| medicalCondition | Free-text medical condition |
| medication | Medication summary (free text) |
| emergencyContact | Emergency contact (Name — Phone) |
| relationship | Relationship to the family member (e.g. Ibu/Ayah) |
| anakIds | IDs of linked family (anak) users — **many-to-one+** |
| staffId | Assigned caregiver (staff) — optional |
| jenisDarah | Blood type (optional) |
| alahan | Allergies (optional) |
| namaDoktor / telDoktor / hospitalRujukan | Doctor name / phone / referral hospital (optional) |
| noInsurans | Insurance/health card number (optional) |
| statusMobiliti | Mobility status (optional) |
| statusKognitif | Cognitive status (optional) |
| sekatanPemakanan | Dietary restrictions (optional) |

**Relationships:** A Parent is cared for by one staff (`staffId`) and linked to one or more anak (`anakIds`). Has many `Medication`, `TrackerRecord`, `Booking`.

### 4.3 Medication (master list per elderly)
A prescribed medicine on a resident's list. Staff add new entries when prescribed; when giving medicine they tick which of these were taken.
| Field | Meaning |
|-------|---------|
| id | Identifier |
| parentId | The elderly this belongs to |
| namaUbat | Medicine name |
| dos | Dose |
| caraPengambilan | Administration route/instructions |
| kekerapan | Frequency/schedule (optional) |
| catatan | Notes (optional) |
| prn | PRN / as-needed flag — must be selected manually when given |

### 4.4 TrackerRecord (daily care record) and its entries
One record per (elderly, staff, day). Holds all care logged that day.
| Field | Meaning |
|-------|---------|
| id | Identifier |
| parentId | Elderly |
| staffId | Recording staff |
| date | Record date/time |
| status | `normal` \| `attention` \| `critical` (derived from vitals) |
| vitalEntries[] | Vital-sign readings (see below) |
| ubatanEntries[] | Medication giving events (see below) |
| makananEntries[] | Food/drink intake events (see below) |
| aktiviti | Daily activity report text |
| aktivitiPengesahan | Staff who confirmed the report |
| gambar[] | Activity photo references (→ Supabase Storage in production) |
| checklist[] | The 8-item daily checklist (`{id, label, done}`) |
| catatanKhas | Special notes |
| editedByAdmin / editedAt | Edit audit (optional) |
| editAllowed | Admin override to re-open editing after 24h |
| *(legacy)* bpSystolic, bpDiastolic, bloodSugar, meal, notes | Older simple fields kept for backward compatibility |

**VitalEntry:** `masa` (ISO timestamp), `suhu`, `bpSistolik`, `bpDiastolik`, `nadi`, `pernafasan`, `gulaDarah`, `oksigen`, `status`, `pengesahan` (recording staff). (`waktu` is a legacy slot label on older records.)

**UbatanEntry:** `masa`, `items[]` (each: `namaUbat`, `dos`, `caraPengambilan`, `catatan?`, `prn?`), `catatan?`, `pengesahan`.

**MakananEntry:** `masa`, `jenisMakanan?`, `jenisMinum?`, `kuantiti?`, `cecairMl?`, `catatan?`, `pengesahan`.

### 4.5 Caregiver
A care worker who can be assigned to a booking (shown to the family).
| Field | Meaning |
|-------|---------|
| id, name, phone | Identity & contact |
| avatar | Photo (optional) |
| specialization | Area of expertise |
| experienceYears | Years of experience |
| rating | 0–5 |
| notes | Optional |

### 4.6 Booking
A care service booked by a family member.
| Field | Meaning |
|-------|---------|
| id | Identifier |
| anakId | Family member who booked |
| parentId | Elderly (optional — may book without a registered elderly) |
| serviceType | `companion` \| `care` |
| date / time | Scheduled date (yyyy-mm-dd) and time (HH:mm) |
| transport | `sendiri` \| `hantar` \| `pickup` |
| location | Pickup/service location |
| notes | Special requests (optional) |
| status | `pending` \| `confirmed` \| `ongoing` \| `completed` \| `cancelled` |
| createdAt | Creation timestamp |
| caregiverId | Assigned caregiver (set by admin) |
| price | RM (set by admin) |
| paymentStatus | `belum_bayar` \| `deposit` \| `telah_bayar` |

### 4.7 Article & Video (content)
| Field (Article) | Meaning |
|-------|---------|
| id, title | Identity |
| topic, subtopic | Taxonomy (4.8) |
| coverImage | Cover image URL |
| body | Article text |
| pdfUrl / pdfName | Optional attached PDF |
| youtubeUrl | Optional supporting video |
| visibility | `published` \| `draft` |
| views | View count |
| createdAt | Creation date |

`Video` is similar but `url` is the primary YouTube embed, `description` replaces body, and PDF is optional supporting material.

### 4.8 Reference value lists (enums) & business thresholds

**Booking status** (`BOOKING_STATUS_LABEL`): pending→Menunggu · confirmed→Disahkan · ongoing→Sedang Berlangsung · completed→Selesai · cancelled→Dibatalkan.

**Payment status** (`PAYMENT_STATUS_LABEL`): belum_bayar→Belum Bayar · deposit→Deposit Dibayar · telah_bayar→Telah Dibayar.

**Service types:** companion → "Teman & sokongan harian tanpa penjagaan perubatan"; care → "Penjagaan termasuk pemantauan kesihatan & ubatan".

**Transport modes:** sendiri → Sediakan kenderaan sendiri · hantar → Hantar ke lokasi · pickup → Ambil di lokasi (pickup).

**Quantity (`KUANTITI_OPTIONS`):** Tidak Makan · Suku · Separuh · 3 Suku · Penuh.

**Medication time slots (`WAKTU_UBATAN`):** Pagi · Tengah Hari · Petang · Malam · PRN (Bila Perlu) · Kecemasan.

**Meal time slots (`WAKTU_MAKANAN`):** Sarapan Pagi · Snek Pagi/Brunch · Makan Tengah Hari · Minum Petang · Makan Malam · Snek Malam.

**Administration routes (`CARA_PENGAMBILAN`):** Oral/Mulut · Suntikan · Topikal/Sapu · Titisan · Sedutan/Inhaler · Lain-lain.

**Per-vital-sign status thresholds** (each vital shows its own Normal/Amaran/Bahaya — real business rules):
| Vital | Normal | Amaran | Bahaya |
|-------|--------|--------|--------|
| Suhu (°C) | 36.5–37.5 | 37.6–37.9 | ≥ 38.0 |
| Tekanan darah (mmHg) | < 120/80 | 120–139 / 80–89 | ≥ 140/90 or < 90/60 |
| Nadi (bpm) | 60–100 | 50–59 or 101–110 | < 50 or > 110 |
| Pernafasan (/min) | 12–20 | 21–24 | < 10 or > 24 |
| Gula darah (mmol/L) | 3.9–5.5 | 5.6–6.9 | ≥ 7.0 or < 3.9 |
| Oksigen SpO₂ (%) | 95–100 | 91–94 | ≤ 90 |

**Overall record status (`computeVitalStatus`)** — derived from a vital set:
- **Critical:** suhu ≥ 39 or < 35; BP systolic ≥ 150; nadi ≥ 120 or < 50; pernafasan ≥ 25 or < 10; gula darah ≥ 9 or < 3.5; oksigen < 92.
- **Attention:** suhu ≥ 37.8; BP systolic ≥ 140; nadi ≥ 100; pernafasan ≥ 22; gula darah ≥ 7.5; oksigen < 95.
- Otherwise **Normal**.

**Content taxonomy (`TOPICS` / `SUBTOPICS`):** Kesihatan (Darah Tinggi, Diabetes, Jantung) · Pemakanan (Diet Seimbang, Suplemen) · Senaman (Ringan, Pernafasan) · Mental (Demensia, Kemurungan). Admins can extend topics/subtopics at runtime.

---

## 5. Business Rules & Workflows

### 5.1 Staff onboarding (approval lifecycle)
1. Applicant submits the staff registration form (`/daftar-staff`) → `User{role: staff, status: pending}`.
2. Admin reviews in `/admin/staff` and sets status to `active` (approve), `rejected`, or `inactive`.
3. Only `active` staff can log in. Admins may also create staff directly (created active).

### 5.2 Elderly registration & assignment
- **Admin path:** Admin registers a full elderly profile (`/admin/warga-emas/baru`), optionally creating or linking a family (anak) account, and assigns a caregiver (`staffId`).
- **Family path:** A family member submits a registration request (`/anak/daftar-warga`) → pending admin review. Admin verifies, completes the profile, and assigns a caregiver.
- An elderly is linked to one assigned staff and one or more anak.

### 5.3 Daily tracker lifecycle & edit window
- One `TrackerRecord` per (elderly, staff, day); created on first entry of the day from the tracker hub.
- Staff log vitals, medication, food, and the activity report as discrete timestamped entries throughout the day, plus tick the daily checklist and add special notes.
- Each record's status (normal/attention/critical) is derived from its vital signs.
- **Edit window:** records stay editable by staff for **24 hours** (`EDIT_WINDOW_MS`) so staff can add later time-slots. After 24h, editing requires an admin to grant access (`editAllowed`). Logic: `canStaffEdit = within 24h OR editAllowed` (`canStaffEdit`).

### 5.4 Booking lifecycle
1. Family creates a booking → `pending`.
2. Admin reviews in `/admin/servis`, assigns a caregiver, sets price & payment status, and **confirms** → `confirmed`.
3. Service starts → `ongoing`; finishes → `completed`.
4. Family or admin may **cancel** before completion → `cancelled`.
5. Family sees the assigned caregiver and can reschedule (date/time) where allowed.

### 5.5 Content visibility
- Articles and videos have `published` / `draft` visibility.
- Family users see **only** `published` content. Drafts are visible to admin only.
- View counts increment when a family member opens an item.

### 5.6 Access scoping
- Staff see only elderly assigned to them (`staffId`) and their own records.
- Family see only elderly linked to them (`anakIds`), their own bookings, and published content.
- Admin sees everything.

---

## 6. Non-Functional Requirements

*(Kept lightweight — scope is to document existing behavior.)*

- **Authentication & authorization:** Email/password login with role-based access. Currently a `localStorage` stub with demo credentials; **production must use Supabase Auth** with role-based access enforced server-side. Only `active` accounts may sign in.
- **Authorization scoping:** Enforce the access rules in 5.6 at the data layer (production: Supabase RLS — defined in the later technical design).
- **Live updates:** The family progress page must reflect new staff records quickly. Mockup polls ~every 4s; **production should use Supabase Realtime**.
- **File storage:** Activity photos and content PDFs must be stored and served (production: Supabase Storage); records hold references/URLs.
- **Responsive design:** Family panel uses a bottom navigation bar on mobile and a sidebar on desktop; admin/staff use a collapsible sidebar. The app is mobile-friendly.
- **Language:** UI is entirely in Malay.
- **Usability:** Each list/form has clear loading, empty, and error states; destructive actions (delete) use confirmation dialogs; saves show toast feedback.

---

## 7. Appendix

### 7.1 Route ↔ file map
| Route | File (`src/routes/`) |
|-------|----------------------|
| `/` | `index.tsx` |
| `/login` | `login.tsx` |
| `/daftar-staff` | `daftar-staff.tsx` |
| `/daftar-anak` | `daftar-anak.tsx` |
| `/admin` | `admin.index.tsx` (+ `admin.tsx` layout/guard) |
| `/admin/staff` | `admin.staff.tsx` |
| `/admin/warga-emas` | `admin.warga-emas.index.tsx` |
| `/admin/warga-emas/baru` | `admin.warga-emas.baru.tsx` |
| `/admin/warga-emas/$parentId` | `admin.warga-emas.$parentId.tsx` |
| `/admin/tracker` | `admin.tracker.tsx` |
| `/admin/artikel` | `admin.artikel.tsx` |
| `/admin/video` | `admin.video.tsx` |
| `/admin/servis` | `admin.servis.tsx` |
| `/staf` | `staf.index.tsx` (+ `staf.tsx` layout/guard) |
| `/staf/warga-emas` | `staf.warga-emas.tsx` |
| `/staf/rekod` | `staf.rekod.tsx` |
| `/staf/tracker/$parentId` | `staf.tracker.$parentId.index.tsx` |
| `/staf/tracker/$parentId/vital` | `staf.tracker.$parentId.vital.tsx` |
| `/staf/tracker/$parentId/ubat` | `staf.tracker.$parentId.ubat.tsx` |
| `/staf/tracker/$parentId/makanan` | `staf.tracker.$parentId.makanan.tsx` |
| `/staf/tracker/$parentId/aktiviti` | `staf.tracker.$parentId.aktiviti.tsx` |
| `/staf/tracker/$parentId/sejarah/$recordId` | `staf.tracker.$parentId.sejarah.$recordId.tsx` |
| `/anak` | `anak.index.tsx` (+ `anak.tsx` layout/guard) |
| `/anak/daftar-warga` | `anak.daftar-warga.tsx` |
| `/anak/service` | `anak.service.tsx` |
| `/anak/perkembangan` | `anak.perkembangan.index.tsx` |
| `/anak/perkembangan/$parentId` | `anak.perkembangan.$parentId.tsx` |
| `/anak/informasi` | `anak.informasi.index.tsx` |
| `/anak/informasi/$id` | `anak.informasi.$id.tsx` |

### 7.2 Shared components
- `app-sidebar.tsx` — admin/staff sidebar navigation.
- `anak-sidebar.tsx` / `anak-bottom-nav.tsx` — family navigation (desktop sidebar / mobile bottom nav).
- `stat-card.tsx` — dashboard stat cards.
- `status-badge.tsx` — health/record status indicator (normal/attention/critical).
- `vital-charts.tsx` — Recharts vital-sign trend charts.
- `record-detail.tsx` — expandable daily-record detail view.
- `topic-subtopic-fields.tsx` — taxonomy selector for content forms.
- `page-transition.tsx` — page/list entry animations.
- `now-stamp.tsx` — current date/time stamp on entry forms.

### 7.3 Demo credentials (mockup only — to be removed in production)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@care.my | admin123 |
| Staff | nurul@care.my | staff123 |
| Family | aisha@mail.my | anak123 |

### 7.4 Source-of-truth files
- `src/lib/mock-data.ts` — all entity types, enums, status thresholds, edit-window constants, seed data.
- `src/lib/auth-store.ts` — current auth flow and roles.
- `src/lib/tracker-actions.ts` — tracker mutation helpers.
- `src/lib/taxonomy-store.ts` — runtime-mutable content taxonomy.
