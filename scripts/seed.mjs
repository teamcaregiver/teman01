// Seed demo accounts + a little relational data into Supabase.
// Run AFTER applying supabase/migrations/0001_init.sql:
//   node scripts/seed.mjs
// Idempotent: re-running won't duplicate users or elderly.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(join(__dirname, "..", ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env file */
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY || env.secret_key;
if (!url || !secret) {
  console.error("Missing VITE_SUPABASE_URL / SUPABASE_SECRET_KEY in .env");
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false } });

const USERS = [
  { key: "admin", name: "Siti Admin", email: "admin@care.my", password: "admin123", role: "admin", status: "active", phone: null },
  { key: "nurul", name: "Nurul Aisyah", email: "nurul@care.my", password: "staff123", role: "staff", status: "active", phone: "012-3456789" },
  { key: "faiz", name: "Ahmad Faiz", email: "faiz@care.my", password: "staff123", role: "staff", status: "active", phone: "013-2223344" },
  { key: "wei", name: "Lim Wei Ming", email: "wei@care.my", password: "staff123", role: "staff", status: "pending", phone: "017-9988776" },
  { key: "aisha", name: "Aisha Rahman", email: "aisha@mail.my", password: "anak123", role: "anak", status: "active", phone: "011-1112222" },
  { key: "hafiz", name: "Hafiz Zulkifli", email: "hafiz@mail.my", password: "anak123", role: "anak", status: "active", phone: "019-3334444" },
];

async function existingUsersByEmail() {
  const map = {};
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) map[u.email] = u.id;
    if (data.users.length < 1000) break;
  }
  return map;
}

async function seedUsers() {
  const existing = await existingUsersByEmail();
  const id = {};
  for (const u of USERS) {
    let uid = existing[u.email];
    if (!uid) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, phone: u.phone ?? "" },
        app_metadata: { role: u.role },
      });
      if (error) {
        console.error("  createUser failed:", u.email, error.message);
        continue;
      }
      uid = data.user.id;
      console.log("  created", u.email);
    } else {
      // Existing user: keep app_metadata.role in sync. Accounts created before
      // this field was set (or created outside the seed) can have it unset, which
      // makes the handle_new_user trigger fall back to 'anak' and leaves any
      // server-side authorization that reads app_metadata role-less.
      const { error: mErr } = await admin.auth.admin.updateUserById(uid, {
        app_metadata: { role: u.role },
      });
      if (mErr) console.error("  app_metadata sync failed:", u.email, mErr.message);
      console.log("  exists ", u.email, mErr ? "" : "(role synced)");
    }
    id[u.key] = uid;
    const { error: pErr } = await admin.from("profiles").upsert({
      id: uid, name: u.name, email: u.email, role: u.role, status: u.status, phone: u.phone,
    });
    if (pErr) console.error("  profile upsert failed:", u.email, pErr.message);
  }
  return id;
}

async function seedParents(id) {
  const PARENTS = [
    { ic: "510304-08-5432", full_name: "Puan Mariam binti Hassan", birth_date: "1951-03-04", gender: "P",
      address: "No. 12, Jalan Damai, 50480 Kuala Lumpur", phone: "03-2092 1122",
      medical_condition: "Darah tinggi, diabetes jenis 2", medication: "Metformin 500mg pagi & malam, Amlodipine 5mg pagi",
      emergency_contact: "Aisha Rahman — 011-1112222", relationship: "Ibu", staff: "nurul", anak: "aisha" },
    { ic: "480712-10-5677", full_name: "Encik Rahman bin Yusof", birth_date: "1948-07-12", gender: "L",
      address: "No. 5, Taman Sentosa, 81300 Johor Bahru", phone: "07-555 6677",
      medical_condition: "Sakit jantung", medication: "Aspirin 100mg, Atorvastatin 20mg",
      emergency_contact: "Aisha Rahman — 011-1112222", relationship: "Ayah", staff: "faiz", anak: "aisha" },
    { ic: "550220-14-3344", full_name: "Puan Zainab binti Omar", birth_date: "1955-02-20", gender: "P",
      address: "No. 88, Jalan Indah, 11900 Bayan Lepas", phone: "04-643 2211",
      medical_condition: "Demensia ringan", medication: "Donepezil 10mg",
      emergency_contact: "Hafiz Zulkifli — 019-3334444", relationship: "Ibu", staff: "nurul", anak: "hafiz" },
  ];

  for (const p of PARENTS) {
    const { data: found } = await admin.from("parents").select("id").eq("ic", p.ic).maybeSingle();
    if (found) {
      console.log("  parent exists", p.full_name);
      continue;
    }
    const { data: inserted, error } = await admin
      .from("parents")
      .insert({
        full_name: p.full_name, ic: p.ic, birth_date: p.birth_date, gender: p.gender,
        address: p.address, phone: p.phone, medical_condition: p.medical_condition,
        medication: p.medication, emergency_contact: p.emergency_contact,
        relationship: p.relationship, staff_id: id[p.staff] ?? null,
      })
      .select("id")
      .single();
    if (error) {
      console.error("  parent insert failed:", p.full_name, error.message);
      continue;
    }
    console.log("  created parent", p.full_name);
    if (id[p.anak]) {
      await admin.from("parent_anak").insert({ parent_id: inserted.id, anak_id: id[p.anak] });
    }
  }
}

async function seedCaregivers() {
  const CAREGIVERS = [
    { name: "Nurul Aisyah", phone: "012-345 6789", specialization: "Penjagaan Warga Emas & Pemantauan Vital", experience_years: 6, rating: 4.8, notes: "Berpengalaman menjaga pesakit diabetes & darah tinggi." },
    { name: "Ahmad Faiz", phone: "013-222 3344", specialization: "Fisioterapi & Mobiliti", experience_years: 4, rating: 4.6, notes: "Pakar bantuan pergerakan & senaman ringan." },
  ];
  for (const c of CAREGIVERS) {
    const { data: found } = await admin.from("caregivers").select("id").eq("name", c.name).maybeSingle();
    if (found) {
      console.log("  caregiver exists", c.name);
      continue;
    }
    const { error } = await admin.from("caregivers").insert(c);
    if (error) console.error("  caregiver insert failed:", c.name, error.message);
    else console.log("  created caregiver", c.name);
  }
}

async function main() {
  console.log("Seeding users...");
  const id = await seedUsers();
  console.log("Seeding parents...");
  await seedParents(id);
  console.log("Seeding caregivers...");
  await seedCaregivers();
  console.log("Done.");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
