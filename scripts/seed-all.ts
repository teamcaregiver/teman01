// Seed the remaining tables (medications, tracker_records, bookings, articles,
// videos, caregivers) from the original mock data, remapping the old string ids
// (p-1, u-staff-1, cg-1...) to the real UUIDs already created by seed.mjs.
//
// Run AFTER seed.mjs:  node scripts/seed-all.ts
// (Node 24 strips the TS types; mock-data.ts has no runtime imports.)
// Idempotent: a table that already has rows is skipped.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  users as mockUsers,
  parents as mockParents,
  caregivers as mockCaregivers,
  medications as mockMeds,
  trackers as mockTrackers,
  bookings as mockBookings,
  articles as mockArticles,
  videos as mockVideos,
} from "../src/lib/mock-data.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, "..", ".env"), "utf8");
const env: Record<string, string> = {};
for (const line of raw.split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#")) continue;
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const url = env.VITE_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing VITE_SUPABASE_URL / SUPABASE_SECRET_KEY in .env");
  process.exit(1);
}
const db = createClient(url, secret, { auth: { persistSession: false } });

async function count(table: string): Promise<number> {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function main() {
  // ---- build id remaps from what's already in the DB ----
  const { data: profiles } = await db.from("profiles").select("id,email");
  const emailToUid = new Map((profiles ?? []).map((p) => [p.email, p.id]));
  const mockUidToUid = new Map<string, string>();
  for (const u of mockUsers) {
    const real = emailToUid.get(u.email);
    if (real) mockUidToUid.set(u.id, real);
  }

  const { data: parentRows } = await db.from("parents").select("id,ic");
  const icToPid = new Map((parentRows ?? []).map((p) => [p.ic, p.id]));
  const mockPidToPid = new Map<string, string>();
  for (const p of mockParents) {
    const real = icToPid.get(p.ic);
    if (real) mockPidToPid.set(p.id, real);
  }

  // ---- caregivers: ensure all mock caregivers exist, map id -> uuid ----
  const { data: cgRows } = await db.from("caregivers").select("id,name");
  const nameToCg = new Map((cgRows ?? []).map((c) => [c.name, c.id]));
  const mockCgToCg = new Map<string, string>();
  for (const c of mockCaregivers) {
    let real = nameToCg.get(c.name);
    if (!real) {
      const { data, error } = await db
        .from("caregivers")
        .insert({
          name: c.name,
          phone: c.phone,
          avatar: c.avatar ?? null,
          specialization: c.specialization,
          experience_years: c.experienceYears,
          rating: c.rating,
          notes: c.notes ?? null,
        })
        .select("id")
        .single();
      if (error) { console.error("caregiver insert:", c.name, error.message); continue; }
      real = data.id;
      console.log("  + caregiver", c.name);
    }
    mockCgToCg.set(c.id, real);
  }

  // ---- medications ----
  if ((await count("medications")) === 0) {
    const rows = mockMeds
      .filter((m) => mockPidToPid.has(m.parentId))
      .map((m) => ({
        parent_id: mockPidToPid.get(m.parentId)!,
        nama_ubat: m.namaUbat,
        dos: m.dos ?? null,
        cara_pengambilan: m.caraPengambilan ?? null,
        kekerapan: m.kekerapan ?? null,
        catatan: m.catatan ?? null,
        prn: m.prn ?? false,
        prn_type: m.prnType ?? null,
      }));
    const { error } = await db.from("medications").insert(rows);
    console.log(error ? `medications ERROR: ${error.message}` : `medications: +${rows.length}`);
  } else console.log("medications: skip (already populated)");

  // ---- tracker_records ----
  if ((await count("tracker_records")) === 0) {
    const rows = mockTrackers
      .filter((t) => mockPidToPid.has(t.parentId))
      .map((t) => ({
        parent_id: mockPidToPid.get(t.parentId)!,
        staff_id: mockUidToUid.get(t.staffId) ?? null,
        date: t.date,
        status: t.status,
        vital_entries: t.vitalEntries ?? null,
        ubatan_entries: t.ubatanEntries ?? null,
        makanan_entries: t.makananEntries ?? null,
        aktiviti: t.aktiviti ?? null,
        aktiviti_pengesahan: t.aktivitiPengesahan ?? null,
        gambar: t.gambar ?? null,
        checklist: t.checklist ?? null,
        catatan_khas: t.catatanKhas ?? null,
        edited_by_admin: t.editedByAdmin ?? false,
        edited_at: t.editedAt ?? null,
        edit_allowed: t.editAllowed ?? false,
      }));
    const { error } = await db.from("tracker_records").insert(rows);
    console.log(error ? `tracker_records ERROR: ${error.message}` : `tracker_records: +${rows.length}`);
  } else console.log("tracker_records: skip (already populated)");

  // ---- bookings ----
  if ((await count("bookings")) === 0) {
    const rows = mockBookings
      .filter((b) => mockUidToUid.has(b.anakId))
      .map((b) => ({
        anak_id: mockUidToUid.get(b.anakId)!,
        parent_id: b.parentId ? mockPidToPid.get(b.parentId) ?? null : null,
        service_type: b.serviceType,
        date: b.date ?? null,
        time: b.time ?? null,
        transport: b.transport ?? null,
        location: b.location ?? null,
        notes: b.notes ?? null,
        status: b.status,
        created_at: b.createdAt,
        caregiver_id: b.caregiverId ? mockCgToCg.get(b.caregiverId) ?? null : null,
        price: b.price ?? null,
        payment_status: b.paymentStatus ?? null,
      }));
    const { error } = await db.from("bookings").insert(rows);
    console.log(error ? `bookings ERROR: ${error.message}` : `bookings: +${rows.length}`);
  } else console.log("bookings: skip (already populated)");

  // ---- articles ----
  if ((await count("articles")) === 0) {
    const rows = mockArticles.map((a) => ({
      title: a.title,
      topic: a.topic ?? null,
      subtopic: a.subtopic ?? null,
      cover_image: a.coverImage ?? null,
      body: a.body ?? null,
      pdf_url: a.pdfUrl ?? null,
      pdf_name: a.pdfName ?? null,
      youtube_url: a.youtubeUrl ?? null,
      visibility: a.visibility ?? "published",
      views: a.views ?? 0,
      created_at: a.createdAt,
    }));
    const { error } = await db.from("articles").insert(rows);
    console.log(error ? `articles ERROR: ${error.message}` : `articles: +${rows.length}`);
  } else console.log("articles: skip (already populated)");

  // ---- videos ----
  if ((await count("videos")) === 0) {
    const rows = mockVideos.map((v) => ({
      title: v.title,
      topic: v.topic ?? null,
      subtopic: v.subtopic ?? null,
      url: v.url ?? null,
      description: v.description ?? null,
      pdf_url: v.pdfUrl ?? null,
      pdf_name: v.pdfName ?? null,
      visibility: v.visibility ?? "published",
      views: v.views ?? 0,
      created_at: v.createdAt,
    }));
    const { error } = await db.from("videos").insert(rows);
    console.log(error ? `videos ERROR: ${error.message}` : `videos: +${rows.length}`);
  } else console.log("videos: skip (already populated)");

  console.log("Done.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
