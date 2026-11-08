-- =====================================================================
-- Issue #12 "improvement" — booker and care recipient details.
--
-- 1. Penempah servis (the family / anak account), on profiles:
--    ic, nama_majikan, no_pekerja, kecemasan_nama, kecemasan_telefon.
--    Name, phone and email already exist. The relationship to the care
--    recipient stays on parents.relationship and is asked when a person is
--    added. Only the user themself and admin can read these columns
--    (profiles_select); users edit their own through profiles_update_self,
--    which already stops them changing role / status.
-- 2. Penerima servis, on parents: bahasa_pilihan, berat_kg, tinggi_cm.
--    Age keeps coming from birth_date so it never goes stale.
--
-- Every column is nullable: rows from before this migration have none of it,
-- and the app asks for it the next time the record is edited. The app checks
-- what is required; the constraints below only stop nonsense values.
--
-- Safe to re-run: uses add column if not exists / duplicate_object guards.
-- =====================================================================

-- ---------- 1. booker details ----------
alter table public.profiles
  add column if not exists ic                text,
  add column if not exists nama_majikan      text,
  add column if not exists no_pekerja        text,
  add column if not exists kecemasan_nama    text,
  add column if not exists kecemasan_telefon text;

comment on column public.profiles.ic is
  'Booker (anak) MyKad or passport number. Issue #12.';
comment on column public.profiles.nama_majikan is
  'Booker employer (company) name. Optional. Issue #12.';
comment on column public.profiles.no_pekerja is
  'Booker staff / employee ID at that employer. Optional. Issue #12.';
comment on column public.profiles.kecemasan_nama is
  'Booker emergency contact person: name. Issue #12.';
comment on column public.profiles.kecemasan_telefon is
  'Booker emergency contact person: phone. Issue #12.';

-- Same limits as HAD_PENEMPAH in src/lib/penempah.ts.
do $$ begin
  alter table public.profiles
    add constraint profiles_penempah_panjang check (
      coalesce(char_length(ic), 0) <= 20
      and coalesce(char_length(nama_majikan), 0) <= 120 
      and coalesce(char_length(no_pekerja), 0) <= 40
      and coalesce(char_length(kecemasan_nama), 0) <= 120
      and coalesce(char_length(kecemasan_telefon), 0) <= 20
    );
exception when duplicate_object then null; end $$;

-- ---------- 2. care recipient details ----------
alter table public.parents
  add column if not exists bahasa_pilihan text,
  add column if not exists berat_kg       numeric(4,1),
  add column if not exists tinggi_cm      numeric(4,1);

comment on column public.parents.bahasa_pilihan is
  'Preferred language. One of BAHASA_OPTIONS in src/lib/profil-penerima.ts, or any typed language. Issue #12.';
comment on column public.parents.berat_kg is
  'Weight in kg, one decimal. Issue #12.';
comment on column public.parents.tinggi_cm is
  'Height in cm, one decimal. Issue #12.';

-- Same ranges as BERAT_KG / TINGGI_CM / HAD_BAHASA in src/lib/profil-penerima.ts.
do $$ begin
  alter table public.parents
    add constraint parents_bahasa_pilihan_panjang
    check (bahasa_pilihan is null or char_length(bahasa_pilihan) <= 60);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.parents
    add constraint parents_berat_kg_julat
    check (berat_kg is null or berat_kg between 10 and 300);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.parents
    add constraint parents_tinggi_cm_julat
    check (tinggi_cm is null or tinggi_cm between 50 and 250);
exception when duplicate_object then null; end $$;
