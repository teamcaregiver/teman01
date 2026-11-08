# Issue #12 "improvement": booker and care recipient details

**Scope:** GitHub issue #12. Every field the issue lists for the penempah servis (anak) and the penerima servis (warga emas), at registration and when the profile is edited.
**Date:** 8 Nov 2026
**Status:** Implemented. Unit tests and the build pass locally. **Not yet deployed:** migration 0017 must be applied to the live Supabase project **before** the new frontend is published (see [Deployment](#4-deployment--order-matters)).

---

## 1. Summary

### Penempah servis (anak)

| # | Field (from the issue) | Where it is stored | Required | Asked at |
|---|---|---|---|---|
| 1 | Full name | `profiles.name` (existing) | Yes | Sign-up, Profil Saya |
| 2 | IC number | `profiles.ic` **(new)** | Yes | Sign-up, Profil Saya |
| 3 | Relationship | `parents.relationship` (existing) | Yes | **Only when adding a warga emas**, as the issue says |
| 4 | Phone number | `profiles.phone` (existing) | Yes | Sign-up, Profil Saya |
| 5 | Email address | `profiles.email` (existing) | Yes | Sign-up (read-only on Profil Saya: it is the login ID) |
| 6 | Employer name (company) | `profiles.nama_majikan` **(new)** | No | Sign-up, Profil Saya |
| 7 | Staff ID | `profiles.no_pekerja` **(new)** | No | Sign-up, Profil Saya |
| 8 | Emergency contact person | `profiles.kecemasan_nama` + `profiles.kecemasan_telefon` **(new)** | Yes, both | Sign-up, Profil Saya |

### Penerima servis (warga emas)

| # | Field (from the issue) | Where it is stored | Required | Asked at |
|---|---|---|---|---|
| 1 | Full name | `parents.full_name` (existing) | Yes | Family *Daftar Warga Emas*, admin *Daftar* and *Edit Penerima Servis* |
| 2 | Age | Worked out from `parents.birth_date` (existing) | Yes (birth date) | Same forms; the age shows under the date as you type |
| 3 | Gender: male, female | `parents.gender` (existing) | Yes | Same forms; **no longer defaults to Perempuan** |
| 4 | Preferred language | `parents.bahasa_pilihan` **(new)** | Yes | Same forms |
| 5 | Weight | `parents.berat_kg` **(new)** | Yes | Same forms |
| 6 | Height | `parents.tinggi_cm` **(new)** | Yes | Same forms |

---

## 2. What changed

### Sign-up (`/daftar-anak`)
- Form order follows the issue: Nama Penuh, No. Kad Pengenalan, No. Telefon, Emel, then **Majikan** (optional), **Kontak Kecemasan** and **Akaun** (password).
- IC: a MyKad must be 12 digits (dashes and spaces are ignored). Anything containing a letter is accepted as a passport number (6–20 letters and digits).
- Phone numbers must have 9–15 digits. Spaces, dashes, brackets and a leading `+` are allowed.
- The Temanion sign-up (`/daftar-staff`) uses the same component and is unchanged, apart from phone now coming before email.
- **Why the IC is not sent with the sign-up call:** Supabase copies sign-up metadata into every access token, which is stored in the browser and sent with every request. So only name and phone go in the metadata, as before. The new fields are written to `profiles` right after the account is created. If that write fails, the account still works: the user sees a warning and fills the details in on Profil Saya.

### Profil Saya (anak)
- The same fields, in the *Maklumat Akaun* card, with one *Simpan Perubahan* button. Phone becomes required for anak accounts (it stays optional for admin and Temanion).
- A *"Profil anda belum lengkap"* notice shows until the IC, phone and emergency contact are filled.
- Family home page: a **Lengkapkan profil anda** card links to Profil Saya while any of those are missing. This covers accounts made before this change and accounts admin creates from *Daftar Penerima Servis*.

### Adding / editing a warga emas
- **Family (`/anak/daftar-warga`):** "Hubungan dengan Anda" was free text. It is now the same dropdown admin uses (from issue #4: Suami, Isteri, Anak, Datuk, Nenek, Keluarga, Kenalan, Lain-lain), labelled *Hubungan Anda dengan Penerima Servis*, and it is required.
- **All three forms** (family add, admin add, admin edit) gain **Bahasa Pilihan**, **Berat (kg)** and **Tinggi (cm)**, and show *Umur: N tahun* under the birth date.
  - Languages: Bahasa Melayu, Bahasa Inggeris, Mandarin, Kantonis, Hokkien, Tamil, or *Lain-lain* with a text box (e.g. Hakka, Iban, Kadazandusun). The issue's "BM, BI, English" is BM plus English, since BI is English. Dialects were added because many Chinese elderly prefer one over Mandarin.
  - Weight 10–300 kg, height 50–250 cm, one decimal place. A height typed in metres (1.6) is rejected with a message.
  - A birth date in the future is rejected.
- **Jantina** no longer pre-selects Perempuan on the two *add* forms, so a person cannot be saved as female by accident.
- **Admin add:** *Hubungan dengan Anak* becomes required only when the person is linked to an anak account (new or existing).
- **Admin edit:** language, weight and height are required here too, so **saving an older record asks for them once**.

### Where the new data shows
- **Admin, penerima servis page:** Umur, Bahasa Pilihan, Berat and Tinggi in *Maklumat Peribadi*. A new **Penempah Servis** card lists each linked anak with IC, phone, email, employer, staff ID and emergency contact, plus a *Profil belum lengkap* badge when needed. It replaces the bare name badges under "Anak Terpaut".
- **Temanion, Info pop-up:** Bahasa Pilihan, Berat and Tinggi, which are useful for daily care. IC, birth date and the other fields removed in issue #9 stay hidden from staff.
- The booker's IC and emergency contact are visible **only to that user and to admin** (existing `profiles_select` policy). Temanion and other families cannot read them; this is covered by the DB tests.

### Also fixed
- **Profile photo disappearing after upload.** `fetchProfile` in `src/lib/auth-store.ts` never selected `avatar_url`, so as soon as a photo was uploaded the refreshed user came back without it. The photo vanished from Profil Saya, and the sidebar never showed it. The column is now selected.
- The family list on `/anak` now refreshes right after a warga emas is registered (previously it could stay stale for up to 30 s).

### Files
- New: `src/lib/penempah.ts`, `src/lib/profil-penerima.ts` (+ tests), `src/components/penempah-fields.tsx`, `src/components/penerima-fizikal-fields.tsx`, `supabase/migrations/0017_penempah_penerima_details.sql`, `supabase/tests/penempah-penerima-details.test.ts`.
- Changed: `daftar-anak.tsx`, `profile-page.tsx`, `anak.index.tsx`, `anak.daftar-warga.tsx`, `admin.warga-emas.baru.tsx`, `admin.warga-emas.$parentId.edit.tsx`, `admin.warga-emas.$parentId.index.tsx`, `elderly-info-dialog.tsx`, `auth-store.ts`, `db.ts`, `data.ts`, `mock-data.ts`, `supabase/types.ts`.

---

## 3. Database (migration 0017)

- `profiles`: `ic`, `nama_majikan`, `no_pekerja`, `kecemasan_nama`, `kecemasan_telefon` (text, nullable; one length check).
- `parents`: `bahasa_pilihan` (text), `berat_kg` and `tinggi_cm` (`numeric(4,1)`), all nullable, with range checks.
- No policy changes. Users already edit their own profile through `profiles_update_self`, which keeps blocking changes to role and status. The Temanion-details trigger from 0013 does not cover the new columns, so anak users can edit them.
- Nullable on purpose: existing rows have none of this data. The app enforces what is required.
- Safe to re-run.

---

## 4. Deployment — order matters

1. **Apply `supabase/migrations/0017_penempah_penerima_details.sql`** to the live project (SQL editor or `supabase db push`). It only adds nullable columns, so the current live frontend keeps working.
2. **Then publish the frontend.** If the frontend goes first, adding or editing a warga emas and saving Profil Saya fail with *"Could not find the '…' column"*. Sign-up still creates the account but shows the "lengkapkan di Profil Saya" warning. Login is not affected.

---

## 5. Testing

- `npm test`: 137 tests pass, including 27 new unit tests for the validation and conversion helpers.
- `npx tsc --noEmit` is clean and `npm run build` succeeds.
- `supabase/tests/penempah-penerima-details.test.ts` (14 tests): who can read and write the booker details, the range checks, and family registration with the new fields. It needs a **local** Supabase (`npx supabase start`) and is skipped otherwise. **It has not been run yet:** Docker was not available on the machine this was built on.

---

## 6. Open questions

1. **Families cannot edit a warga emas after registering them.** Only admin has an edit form, and RLS gives anak users insert, not update. People added before this change therefore get language, weight and height only when admin edits them. Should families get an edit form, and should it cover everything or only these fields?
2. **Admin-created anak accounts** (*Daftar akaun Anak sekali* on *Daftar Penerima Servis*) still only take name, email, phone and password. The family is prompted to complete the rest on first login. Should admin be able to enter IC and emergency contact there?
3. **Relationship direction.** The dropdown values (Anak, Suami, Isteri, Datuk, …) are stored as one free-text value, and older records hold values like "Ibu" / "Ayah" (the elderly person *to* the anak). The family form now asks for the family member's relationship *to* the recipient, following the issue. Please confirm that is the intended meaning.
