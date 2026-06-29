// Phase 1 in-memory dummy data. Replaced by Lovable Cloud queries in Phase 2.
export type Role = "admin" | "staff" | "anak";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "pending" | "rejected" | "inactive";
  phone?: string;
}

export interface Parent {
  id: string;
  fullName: string;
  ic: string;
  birthDate: string;
  gender: "L" | "P";
  address: string;
  phone: string;
  medicalCondition: string;
  medication: string;
  emergencyContact: string;
  relationship: string;
  anakIds: string[];
  staffId?: string;
  // Extended medical profile
  jenisDarah?: string;
  alahan?: string;
  namaDoktor?: string;
  telDoktor?: string;
  hospitalRujukan?: string;
  noInsurans?: string;
  statusMobiliti?: string;
  statusKognitif?: string;
  sekatanPemakanan?: string;
}

export type TrackerStatus = "normal" | "attention" | "critical";

export type WaktuVital = "pagi" | "tengahari" | "petang" | "malam";
export type WaktuUbatan =
  | "pagi"
  | "tengahari"
  | "petang"
  | "malam"
  | "prn"
  | "kecemasan";
export type WaktuMakanan =
  | "pagi"
  | "snekPagi"
  | "tengahari"
  | "minumPetang"
  | "makanMalam"
  | "snekMalam";
export type Kuantiti = "tidakMakan" | "suku" | "separuh" | "tigaSuku" | "penuh";

export interface VitalEntry {
  waktu?: WaktuVital; // legacy slot label (older records)
  masa?: string; // ISO timestamp recorded in real time
  suhu?: number;
  bpSistolik?: number;
  bpDiastolik?: number;
  nadi?: number;
  pernafasan?: number;
  gulaDarah?: number;
  oksigen?: number;
  status: TrackerStatus;
  pengesahan?: string; // staff/companion who recorded this entry
}

export type PrnType = "prn" | "kecemasan";

export interface UbatItem {
  namaUbat: string;
  dos: string;
  caraPengambilan: string;
  catatan?: string;
  prn?: boolean; // PRN / emergency medicine given manually
  prnType?: PrnType; // which kind, when prn is on
}

export interface UbatanEntry {
  waktu?: WaktuUbatan; // legacy slot label (older records)
  masa?: string; // ISO timestamp recorded in real time
  items: UbatItem[];
  catatan?: string; // optional note for this giving event
  pengesahan?: string; // staff/companion who recorded this entry
}

export interface MakananEntry {
  waktu?: WaktuMakanan; // legacy slot label (older records)
  masa?: string; // ISO timestamp recorded in real time
  jenisMakanan?: string;
  jenisMinum?: string;
  kuantiti?: Kuantiti;
  cecairMl?: number;
  catatan?: string;
  pengesahan?: string;
}

// A medicine in a resident's medication list (master list). Caregivers add a
// new entry here when the elderly is prescribed a new medicine; when giving
// medicine they tick which of these were taken (see UbatanEntry).
export interface Medication {
  id: string;
  parentId: string;
  namaUbat: string;
  dos: string;
  caraPengambilan: string; // cara makan / instructions
  kekerapan?: string; // jadual / berapa kerap
  catatan?: string; // nota tambahan
  prn?: boolean; // PRN / kecemasan — mesti dipilih manual bila diberi
  prnType?: PrnType; // PRN atau Kecemasan, bila prn dihidupkan
}

export const PRN_TYPE_LABEL: Record<PrnType, string> = {
  prn: "PRN",
  kecemasan: "Kecemasan",
};

export interface ChecklistItemData {
  id: string;
  label: string;
  done: boolean;
}

export interface TrackerRecord {
  id: string;
  parentId: string;
  staffId: string;
  date: string;
  status: TrackerStatus;
  // Legacy basic fields (kept for existing records)
  bpSystolic?: number;
  bpDiastolic?: number;
  bloodSugar?: number;
  meal?: string;
  notes?: string;
  // Comprehensive new fields
  vitalEntries?: VitalEntry[];
  ubatanEntries?: UbatanEntry[];
  makananEntries?: MakananEntry[];
  aktiviti?: string;
  aktivitiPengesahan?: string; // companion who confirmed the daily report
  gambar?: string[];
  checklist?: ChecklistItemData[];
  catatanKhas?: string;
  editedByAdmin?: boolean;
  editedAt?: string;
  editAllowed?: boolean;
}

export type ServiceType = "companion" | "care";
export type TransportMode = "sendiri" | "hantar" | "pickup";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "ongoing"
  | "completed"
  | "cancelled";
export type PaymentStatus = "belum_bayar" | "deposit" | "telah_bayar";

// Caregiver assigned to a booking by admin. Shown to the Anak user so they
// know who will attend the service.
export interface Caregiver {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  specialization: string;
  experienceYears: number;
  rating: number; // 0–5
  notes?: string;
}

export interface Booking {
  id: string;
  anakId: string;
  parentId?: string; // optional — anak may book without a registered elderly
  serviceType: ServiceType;
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // HH:mm
  transport: TransportMode;
  location: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  caregiverId?: string; // set by admin when a caregiver is assigned
  price?: number; // RM
  paymentStatus?: PaymentStatus;
}

export type ContentVisibility = "published" | "draft";

export interface Article {
  id: string;
  title: string;
  topic: string;
  subtopic: string;
  coverImage: string;
  body: string;
  pdfUrl?: string;
  pdfName?: string;
  youtubeUrl?: string; // optional supporting media
  visibility?: ContentVisibility;
  views?: number;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  topic: string;
  subtopic: string;
  url: string; // primary YouTube embed URL
  description: string;
  pdfUrl?: string; // optional supporting material
  pdfName?: string;
  visibility?: ContentVisibility;
  views?: number;
  createdAt: string;
}

export const VISIBILITY_LABEL: Record<ContentVisibility, string> = {
  published: "Diterbitkan",
  draft: "Draf",
};

// Extracts the YouTube video id from embed / watch / youtu.be / shorts / live URLs.
export function youtubeId(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|v\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/,
  );
  return m?.[1];
}

// Permissions a YouTube <iframe> needs. `encrypted-media` is required for
// DRM-protected videos (e.g. VEVO/music) — without it they show
// "Video unavailable". Note: DRM playback also needs a secure context
// (HTTPS or localhost), so such videos won't play when the app is served
// over a plain http:// LAN IP.
export const YT_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

// Thumbnail image for a YouTube URL (falls back to undefined if not parseable).
export function youtubeThumb(url?: string): string | undefined {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
}

// Normalises any YouTube URL into the embeddable form used by <iframe>.
export function youtubeEmbed(url?: string): string | undefined {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : url || undefined;
}

export const TOPICS = ["Kesihatan", "Pemakanan", "Senaman", "Mental"] as const;
export const SUBTOPICS: Record<string, string[]> = {
  Kesihatan: ["Darah Tinggi", "Diabetes", "Jantung"],
  Pemakanan: ["Diet Seimbang", "Suplemen"],
  Senaman: ["Ringan", "Pernafasan"],
  Mental: ["Demensia", "Kemurungan"],
};

export const users: User[] = [
  {
    id: "u-admin",
    name: "Siti Admin",
    email: "admin@care.my",
    role: "admin",
    status: "active",
  },
  {
    id: "u-staff-1",
    name: "Nurul Aisyah",
    email: "nurul@care.my",
    role: "staff",
    status: "active",
    phone: "012-3456789",
  },
  {
    id: "u-staff-2",
    name: "Ahmad Faiz",
    email: "faiz@care.my",
    role: "staff",
    status: "active",
    phone: "013-2223344",
  },
  {
    id: "u-staff-3",
    name: "Lim Wei Ming",
    email: "wei@care.my",
    role: "staff",
    status: "pending",
    phone: "017-9988776",
  },
  {
    id: "u-anak-1",
    name: "Aisha Rahman",
    email: "aisha@mail.my",
    role: "anak",
    status: "active",
    phone: "011-1112222",
  },
  {
    id: "u-anak-2",
    name: "Hafiz Zulkifli",
    email: "hafiz@mail.my",
    role: "anak",
    status: "active",
    phone: "019-3334444",
  },
];

export const parents: Parent[] = [
  {
    id: "p-1",
    fullName: "Puan Mariam binti Hassan",
    ic: "510304-08-5432",
    birthDate: "1951-03-04",
    gender: "P",
    address: "No. 12, Jalan Damai, 50480 Kuala Lumpur",
    phone: "03-2092 1122",
    medicalCondition: "Darah tinggi, diabetes jenis 2",
    medication: "Metformin 500mg pagi & malam, Amlodipine 5mg pagi",
    emergencyContact: "Aisha Rahman — 011-1112222",
    relationship: "Ibu",
    anakIds: ["u-anak-1"],
    staffId: "u-staff-1",
  },
  {
    id: "p-2",
    fullName: "Encik Rahman bin Yusof",
    ic: "480712-10-5677",
    birthDate: "1948-07-12",
    gender: "L",
    address: "No. 5, Taman Sentosa, 81300 Johor Bahru",
    phone: "07-555 6677",
    medicalCondition: "Sakit jantung",
    medication: "Aspirin 100mg, Atorvastatin 20mg",
    emergencyContact: "Aisha Rahman — 011-1112222",
    relationship: "Ayah",
    anakIds: ["u-anak-1"],
    staffId: "u-staff-2",
  },
  {
    id: "p-3",
    fullName: "Puan Zainab binti Omar",
    ic: "550220-14-3344",
    birthDate: "1955-02-20",
    gender: "P",
    address: "No. 88, Jalan Indah, 11900 Bayan Lepas",
    phone: "04-643 2211",
    medicalCondition: "Demensia ringan",
    medication: "Donepezil 10mg",
    emergencyContact: "Hafiz Zulkifli — 019-3334444",
    relationship: "Ibu",
    anakIds: ["u-anak-2"],
    staffId: "u-staff-1",
  },
  {
    id: "p-demo",
    fullName: "Puan Halimah binti Abdullah",
    ic: "490815-10-2244",
    birthDate: "1949-08-15",
    gender: "P",
    address: "No. 23, Jalan Seri Melati, 43000 Kajang, Selangor",
    phone: "03-8736 4521",
    medicalCondition: "Darah tinggi, diabetes jenis 2, arthritis",
    medication: "Metformin 500mg, Amlodipine 5mg, Paracetamol 500mg",
    emergencyContact: "Aisha Rahman — 011-1112222",
    relationship: "Nenek",
    anakIds: ["u-anak-1"],
    staffId: "u-staff-1",
    jenisDarah: "O+",
    alahan: "Penicillin, makanan laut",
    namaDoktor: "Dr. Tan Mei Ling",
    telDoktor: "03-8888 1234",
    hospitalRujukan: "Hospital Serdang",
    noInsurans: "PRU-998877",
    statusMobiliti: "Perlu Bantuan",
    statusKognitif: "Normal",
    sekatanPemakanan: "Rendah gula, rendah garam",
  },
];

// Per-resident medication list (master list). Mutable in-memory store — staff
// can add new medicines via "Tambah Ubat" on the daily-record page.
export const medications: Medication[] = [
  // Puan Mariam (p-1)
  {
    id: "m-p1-1",
    parentId: "p-1",
    namaUbat: "Metformin",
    dos: "500mg",
    caraPengambilan: "Oral / Mulut",
    kekerapan: "2x sehari (pagi & malam)",
    catatan: "Selepas makan",
  },
  {
    id: "m-p1-2",
    parentId: "p-1",
    namaUbat: "Amlodipine",
    dos: "5mg",
    caraPengambilan: "Oral / Mulut",
    kekerapan: "1x sehari (pagi)",
  },
  // Encik Rahman (p-2)
  {
    id: "m-p2-1",
    parentId: "p-2",
    namaUbat: "Aspirin",
    dos: "100mg",
    caraPengambilan: "Oral / Mulut",
    kekerapan: "1x sehari (pagi)",
  },
  {
    id: "m-p2-2",
    parentId: "p-2",
    namaUbat: "Atorvastatin",
    dos: "20mg",
    caraPengambilan: "Oral / Mulut",
    kekerapan: "1x sehari (malam)",
  },
  {
    id: "m-p2-3",
    parentId: "p-2",
    namaUbat: "GTN (Nitrogliserin)",
    dos: "0.5mg",
    caraPengambilan: "Bawah lidah",
    catatan: "Bila sakit dada",
    prn: true,
  },
  // Puan Zainab (p-3)
  {
    id: "m-p3-1",
    parentId: "p-3",
    namaUbat: "Donepezil",
    dos: "10mg",
    caraPengambilan: "Oral / Mulut",
    kekerapan: "1x sehari (malam)",
  },
  // Puan Halimah (p-demo)
  {
    id: "m-pd-1",
    parentId: "p-demo",
    namaUbat: "Metformin",
    dos: "500mg",
    caraPengambilan: "Oral / Mulut",
    kekerapan: "2x sehari (pagi & malam)",
    catatan: "Selepas makan",
  },
  {
    id: "m-pd-2",
    parentId: "p-demo",
    namaUbat: "Amlodipine",
    dos: "5mg",
    caraPengambilan: "Oral / Mulut",
    kekerapan: "1x sehari (pagi)",
  },
  {
    id: "m-pd-3",
    parentId: "p-demo",
    namaUbat: "Paracetamol",
    dos: "500mg",
    caraPengambilan: "Oral / Mulut",
    catatan: "Sakit lutut / arthritis",
    prn: true,
  },
];

export function medsForParent(parentId: string): Medication[] {
  return medications.filter((m) => m.parentId === parentId);
}

// Display clock time (HH:mm) for a record entry. Real-time entries carry an
// exact `masa` timestamp; legacy entries fall back to a waktu-slot time.
export function entryTime(masa?: string, fallback?: string): string {
  if (masa) {
    const d = new Date(masa);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return fallback ?? "—";
}

const today = new Date();
const daysAgo = (n: number) =>
  new Date(today.getTime() - n * 86400000).toISOString();

// Compact builders for the structured records below (every elderly gets a full daily flow).
function vital(
  waktu: WaktuVital,
  suhu: number,
  sys: number,
  dia: number,
  nadi: number,
  pernafasan: number,
  gulaDarah: number,
  oksigen: number,
  status: TrackerStatus,
  pengesahan = "Nurul Aisyah",
): VitalEntry {
  return {
    waktu,
    suhu,
    bpSistolik: sys,
    bpDiastolik: dia,
    nadi,
    pernafasan,
    gulaDarah,
    oksigen,
    status,
    pengesahan,
  };
}
function makan(
  waktu: WaktuMakanan,
  jenisMakanan: string,
  jenisMinum: string,
  kuantiti: Kuantiti,
  cecairMl: number,
): MakananEntry {
  return {
    waktu,
    jenisMakanan,
    jenisMinum,
    kuantiti,
    cecairMl,
    pengesahan: "Nurul Aisyah",
  };
}
function ubat(waktu: WaktuUbatan, items: UbatItem[]): UbatanEntry {
  return { waktu, items, pengesahan: "Nurul Aisyah" };
}
function doneChecklist(): ChecklistItemData[] {
  return [
    { id: "c1", label: "Mandi / kebersihan diri", done: true },
    { id: "c2", label: "Tukar pakaian", done: true },
    { id: "c3", label: "Ambil ubat mengikut jadual", done: true },
    { id: "c4", label: "Sarapan / makan mengikut waktu", done: true },
    { id: "c5", label: "Senaman ringan / pergerakan", done: true },
    { id: "c6", label: "Pantau tanda vital", done: true },
    { id: "c7", label: "Minum air mencukupi", done: true },
    { id: "c8", label: "Rehat / tidur secukupnya", done: true },
  ];
}

export const trackers: TrackerRecord[] = [
  // ===== Puan Mariam (p-1) — darah tinggi & diabetes, 3 hari penuh =====
  {
    id: "p1-d2",
    parentId: "p-1",
    staffId: "u-staff-1",
    date: daysAgo(2),
    status: "critical",
    bpSystolic: 134,
    bpDiastolic: 84,
    bloodSugar: 6.1,
    meal: "Bubur ayam",
    notes: "Gula & tekanan dipantau",
    vitalEntries: [
      vital("pagi", 36.6, 134, 84, 76, 17, 6.1, 99, "attention"),
      vital("tengahari", 37.0, 141, 89, 88, 19, 7.6, 98, "critical"),
      vital("petang", 36.8, 137, 86, 82, 18, 6.8, 98, "attention"),
      vital("malam", 36.5, 130, 82, 74, 16, 5.9, 99, "attention"),
    ],
    ubatanEntries: [
      ubat("pagi", [
        {
          namaUbat: "Metformin",
          dos: "500mg",
          caraPengambilan: "Oral / Mulut",
          catatan: "Selepas makan",
        },
        { namaUbat: "Amlodipine", dos: "5mg", caraPengambilan: "Oral / Mulut" },
      ]),
      ubat("malam", [
        {
          namaUbat: "Metformin",
          dos: "500mg",
          caraPengambilan: "Oral / Mulut",
        },
      ]),
    ],
    makananEntries: [
      makan("pagi", "Bubur ayam", "Teh tanpa gula", "penuh", 200),
      makan(
        "tengahari",
        "Nasi, ikan kukus, sayur",
        "Air kosong",
        "tigaSuku",
        250,
      ),
      makan("makanMalam", "Sup sayur, roti", "Air kosong", "separuh", 200),
    ],
    aktiviti:
      "Berjalan perlahan di taman pada waktu pagi. Berehat selepas tengah hari sambil mendengar radio.",
    aktivitiPengesahan: "Nurul Aisyah",
    gambar: [
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&q=80",
    ],
    checklist: doneChecklist(),
    catatanKhas: "Bacaan gula selepas makan tengah hari agak tinggi.",
  },
  {
    id: "p1-d1",
    parentId: "p-1",
    staffId: "u-staff-1",
    date: daysAgo(1),
    status: "attention",
    bpSystolic: 118,
    bpDiastolic: 78,
    bloodSugar: 5.3,
    meal: "Roti gandum, telur",
    vitalEntries: [
      vital("pagi", 36.6, 118, 78, 72, 16, 5.3, 99, "normal"),
      vital("tengahari", 36.9, 122, 80, 80, 18, 5.6, 98, "attention"),
      vital("petang", 36.7, 119, 79, 76, 17, 5.4, 99, "normal"),
    ],
    ubatanEntries: [
      ubat("pagi", [
        {
          namaUbat: "Metformin",
          dos: "500mg",
          caraPengambilan: "Oral / Mulut",
        },
        { namaUbat: "Amlodipine", dos: "5mg", caraPengambilan: "Oral / Mulut" },
      ]),
    ],
    makananEntries: [
      makan(
        "pagi",
        "Roti gandum, telur rebus",
        "Susu rendah lemak",
        "penuh",
        220,
      ),
      makan(
        "tengahari",
        "Nasi, ayam panggang, sayur",
        "Air kosong",
        "penuh",
        250,
      ),
    ],
    aktiviti:
      "Senaman regangan ringan pada waktu pagi. Mood ceria sepanjang hari.",
    aktivitiPengesahan: "Nurul Aisyah",
    checklist: doneChecklist(),
  },
  {
    id: "p1-d0",
    parentId: "p-1",
    staffId: "u-staff-1",
    date: daysAgo(0),
    status: "critical",
    editAllowed: true,
    bpSystolic: 136,
    bpDiastolic: 86,
    bloodSugar: 6.5,
    meal: "Bubur, telur",
    vitalEntries: [
      vital("pagi", 36.8, 136, 86, 80, 18, 6.5, 98, "attention"),
      vital("tengahari", 37.2, 144, 90, 92, 20, 8.0, 97, "critical"),
    ],
    ubatanEntries: [
      ubat("pagi", [
        {
          namaUbat: "Metformin",
          dos: "500mg",
          caraPengambilan: "Oral / Mulut",
        },
        { namaUbat: "Amlodipine", dos: "5mg", caraPengambilan: "Oral / Mulut" },
      ]),
    ],
    makananEntries: [
      makan("pagi", "Bubur, telur", "Air kosong", "penuh", 200),
      makan(
        "tengahari",
        "Nasi, sup ayam, sayur",
        "Air kosong",
        "tigaSuku",
        250,
      ),
    ],
    aktiviti:
      "Pagi: berjemur & senaman ringan. Tengah hari: berehat selepas makan.",
    aktivitiPengesahan: "Nurul Aisyah",
    checklist: doneChecklist(),
    catatanKhas: "Tekanan & gula tengah hari tinggi — pantau rapi.",
  },

  // ===== Encik Rahman (p-2) — sakit jantung, 3 hari penuh =====
  {
    id: "p2-d2",
    parentId: "p-2",
    staffId: "u-staff-2",
    date: daysAgo(2),
    status: "attention",
    bpSystolic: 124,
    bpDiastolic: 80,
    bloodSugar: 5.2,
    meal: "Bubur",
    vitalEntries: [
      vital("pagi", 36.5, 124, 80, 58, 17, 5.2, 98, "attention", "Ahmad Faiz"),
      vital(
        "tengahari",
        36.8,
        130,
        82,
        104,
        19,
        5.5,
        97,
        "attention",
        "Ahmad Faiz",
      ),
      vital(
        "petang",
        36.6,
        122,
        78,
        96,
        18,
        5.0,
        98,
        "attention",
        "Ahmad Faiz",
      ),
    ],
    ubatanEntries: [
      ubat("pagi", [
        { namaUbat: "Aspirin", dos: "100mg", caraPengambilan: "Oral / Mulut" },
        {
          namaUbat: "Atorvastatin",
          dos: "20mg",
          caraPengambilan: "Oral / Mulut",
        },
      ]),
    ],
    makananEntries: [
      makan("pagi", "Bubur ayam", "Air kosong", "penuh", 200),
      makan("tengahari", "Nasi, ikan, sayur", "Air kosong", "tigaSuku", 250),
    ],
    aktiviti: "Berjalan ringan di halaman. Berbual dengan jiran.",
    aktivitiPengesahan: "Ahmad Faiz",
    gambar: [
      "https://images.unsplash.com/photo-1447710441604-5bdc41bc6517?w=400&q=80",
    ],
    checklist: doneChecklist(),
  },
  {
    id: "p2-d1",
    parentId: "p-2",
    staffId: "u-staff-2",
    date: daysAgo(1),
    status: "critical",
    bpSystolic: 118,
    bpDiastolic: 76,
    bloodSugar: 4.8,
    meal: "Roti",
    vitalEntries: [
      vital("pagi", 36.4, 118, 76, 64, 16, 4.8, 99, "normal", "Ahmad Faiz"),
      vital(
        "tengahari",
        36.7,
        126,
        80,
        112,
        20,
        5.6,
        98,
        "critical",
        "Ahmad Faiz",
      ),
      vital(
        "petang",
        36.6,
        120,
        78,
        88,
        18,
        5.1,
        98,
        "attention",
        "Ahmad Faiz",
      ),
      vital("malam", 36.5, 116, 74, 70, 16, 4.9, 99, "normal", "Ahmad Faiz"),
    ],
    ubatanEntries: [
      ubat("pagi", [
        { namaUbat: "Aspirin", dos: "100mg", caraPengambilan: "Oral / Mulut" },
        {
          namaUbat: "Atorvastatin",
          dos: "20mg",
          caraPengambilan: "Oral / Mulut",
        },
      ]),
    ],
    makananEntries: [
      makan("pagi", "Roti, telur", "Air kosong", "penuh", 200),
      makan("tengahari", "Nasi, sup, sayur", "Air kosong", "penuh", 250),
      makan("makanMalam", "Sup sayur", "Air kosong", "separuh", 200),
    ],
    aktiviti:
      "Nadi sedikit laju selepas tengah hari, dipantau. Rehat secukupnya.",
    aktivitiPengesahan: "Ahmad Faiz",
    checklist: doneChecklist(),
    catatanKhas: "Nadi tengah hari melebihi 110 bpm — pantau jantung.",
  },
  {
    id: "p2-d0",
    parentId: "p-2",
    staffId: "u-staff-2",
    date: daysAgo(0),
    status: "critical",
    editAllowed: true,
    bpSystolic: 122,
    bpDiastolic: 80,
    bloodSugar: 5.0,
    meal: "Bubur",
    vitalEntries: [
      vital("pagi", 36.6, 122, 80, 48, 17, 5.0, 97, "critical", "Ahmad Faiz"),
      vital(
        "tengahari",
        36.8,
        128,
        82,
        90,
        18,
        5.4,
        98,
        "attention",
        "Ahmad Faiz",
      ),
    ],
    ubatanEntries: [
      ubat("pagi", [
        { namaUbat: "Aspirin", dos: "100mg", caraPengambilan: "Oral / Mulut" },
        {
          namaUbat: "Atorvastatin",
          dos: "20mg",
          caraPengambilan: "Oral / Mulut",
        },
      ]),
    ],
    makananEntries: [
      makan("pagi", "Bubur, telur", "Air kosong", "penuh", 200),
      makan("tengahari", "Nasi, ayam, sayur", "Air kosong", "tigaSuku", 250),
    ],
    aktiviti:
      "Pagi: rehat, nadi rendah dipantau. Tengah hari: berjalan ringan.",
    aktivitiPengesahan: "Ahmad Faiz",
    checklist: doneChecklist(),
    catatanKhas: "Nadi pagi 48 bpm — terlalu rendah, perhatikan.",
  },

  // ===== Puan Zainab (p-3) — demensia ringan, 3 hari penuh =====
  {
    id: "p3-d2",
    parentId: "p-3",
    staffId: "u-staff-1",
    date: daysAgo(2),
    status: "normal",
    bpSystolic: 116,
    bpDiastolic: 76,
    bloodSugar: 5.0,
    meal: "Roti gandum",
    vitalEntries: [
      vital("pagi", 36.6, 116, 76, 72, 16, 5.0, 99, "normal"),
      vital("tengahari", 36.8, 118, 78, 78, 17, 5.3, 98, "normal"),
      vital("petang", 36.7, 119, 79, 74, 16, 4.9, 99, "normal"),
    ],
    ubatanEntries: [
      ubat("pagi", [
        { namaUbat: "Donepezil", dos: "10mg", caraPengambilan: "Oral / Mulut" },
      ]),
    ],
    makananEntries: [
      makan("pagi", "Roti gandum, telur", "Susu", "penuh", 220),
      makan("tengahari", "Nasi, ikan, sayur", "Air kosong", "penuh", 250),
    ],
    aktiviti:
      "Aktiviti mewarna dan teka silang kata. Mengingati ahli keluarga dengan baik.",
    aktivitiPengesahan: "Nurul Aisyah",
    gambar: [
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
    ],
    checklist: doneChecklist(),
  },
  {
    id: "p3-d1",
    parentId: "p-3",
    staffId: "u-staff-1",
    date: daysAgo(1),
    status: "attention",
    bpSystolic: 117,
    bpDiastolic: 75,
    bloodSugar: 5.1,
    meal: "Bubur",
    vitalEntries: [
      vital("pagi", 36.5, 117, 75, 70, 16, 5.1, 99, "normal"),
      vital("tengahari", 36.9, 121, 80, 82, 18, 5.5, 98, "attention"),
      vital("petang", 36.6, 118, 77, 76, 17, 5.2, 99, "normal"),
    ],
    ubatanEntries: [
      ubat("pagi", [
        { namaUbat: "Donepezil", dos: "10mg", caraPengambilan: "Oral / Mulut" },
      ]),
    ],
    makananEntries: [
      makan("pagi", "Bubur ayam", "Teh tanpa gula", "penuh", 200),
      makan("tengahari", "Nasi, ayam, sayur", "Air kosong", "tigaSuku", 250),
    ],
    aktiviti: "Berjalan di taman pada waktu pagi. Mendengar muzik nostalgia.",
    aktivitiPengesahan: "Nurul Aisyah",
    checklist: doneChecklist(),
  },
  {
    id: "p3-d0",
    parentId: "p-3",
    staffId: "u-staff-1",
    date: daysAgo(0),
    status: "attention",
    editAllowed: true,
    bpSystolic: 120,
    bpDiastolic: 79,
    bloodSugar: 5.4,
    meal: "Roti",
    vitalEntries: [
      vital("pagi", 36.7, 120, 79, 80, 17, 5.4, 98, "attention"),
      vital("tengahari", 36.8, 116, 76, 78, 16, 5.0, 99, "normal"),
      vital("petang", 36.6, 119, 78, 74, 17, 5.1, 99, "normal"),
    ],
    ubatanEntries: [
      ubat("pagi", [
        { namaUbat: "Donepezil", dos: "10mg", caraPengambilan: "Oral / Mulut" },
      ]),
    ],
    makananEntries: [
      makan("pagi", "Roti, telur", "Susu", "penuh", 220),
      makan("tengahari", "Nasi, sup, sayur", "Air kosong", "penuh", 250),
    ],
    aktiviti: "Aktiviti seni dan berbual mesra. Tidur siang secukupnya.",
    aktivitiPengesahan: "Nurul Aisyah",
    checklist: doneChecklist(),
  },

  // ===== DEMO FLOW: Puan Halimah (p-demo) — full structured reports across 3 days =====
  // Day -2: complete day, all waktu confirmed by companion.
  {
    id: "td-2",
    parentId: "p-demo",
    staffId: "u-staff-1",
    date: daysAgo(2),
    status: "attention",
    vitalEntries: [
      {
        waktu: "pagi",
        suhu: 36.6,
        bpSistolik: 138,
        bpDiastolik: 86,
        nadi: 78,
        pernafasan: 18,
        gulaDarah: 6.8,
        oksigen: 98,
        status: "normal",
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "tengahari",
        suhu: 37.0,
        bpSistolik: 145,
        bpDiastolik: 90,
        nadi: 88,
        pernafasan: 20,
        gulaDarah: 8.1,
        oksigen: 97,
        status: "attention",
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "petang",
        suhu: 36.8,
        bpSistolik: 140,
        bpDiastolik: 88,
        nadi: 82,
        pernafasan: 19,
        gulaDarah: 7.2,
        oksigen: 98,
        status: "attention",
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "malam",
        suhu: 36.5,
        bpSistolik: 134,
        bpDiastolik: 84,
        nadi: 76,
        pernafasan: 17,
        gulaDarah: 6.4,
        oksigen: 99,
        status: "normal",
        pengesahan: "Nurul Aisyah",
      },
    ],
    ubatanEntries: [
      {
        waktu: "pagi",
        pengesahan: "Nurul Aisyah",
        items: [
          {
            namaUbat: "Metformin",
            dos: "500mg",
            caraPengambilan: "Oral / Mulut",
            catatan: "Selepas makan",
          },
          {
            namaUbat: "Amlodipine",
            dos: "5mg",
            caraPengambilan: "Oral / Mulut",
          },
        ],
      },
      {
        waktu: "malam",
        pengesahan: "Nurul Aisyah",
        items: [
          {
            namaUbat: "Metformin",
            dos: "500mg",
            caraPengambilan: "Oral / Mulut",
            catatan: "Selepas makan malam",
          },
        ],
      },
    ],
    makananEntries: [
      {
        waktu: "pagi",
        jenisMakanan: "Bubur ayam",
        jenisMinum: "Teh tanpa gula",
        kuantiti: "penuh",
        cecairMl: 200,
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "tengahari",
        jenisMakanan: "Nasi, ikan kukus, sayur",
        jenisMinum: "Air kosong",
        kuantiti: "tigaSuku",
        cecairMl: 250,
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "makanMalam",
        jenisMakanan: "Sup sayur, roti",
        jenisMinum: "Air kosong",
        kuantiti: "separuh",
        cecairMl: 200,
        catatan: "Kurang selera",
        pengesahan: "Nurul Aisyah",
      },
    ],
    aktiviti:
      "Berjalan perlahan di taman pada waktu pagi selama 15 minit. Bermain teka silang kata dan berbual mesra. Petang berehat sambil mendengar radio.",
    aktivitiPengesahan: "Nurul Aisyah",
    gambar: [
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&q=80",
      "https://images.unsplash.com/photo-1447710441604-5bdc41bc6517?w=400&q=80",
    ],
    checklist: [
      { id: "c1", label: "Mandi / kebersihan diri", done: true },
      { id: "c2", label: "Tukar pakaian", done: true },
      { id: "c3", label: "Ambil ubat mengikut jadual", done: true },
      { id: "c4", label: "Sarapan / makan mengikut waktu", done: true },
      { id: "c5", label: "Senaman ringan / pergerakan", done: true },
      { id: "c6", label: "Pantau tanda vital", done: true },
      { id: "c7", label: "Minum air mencukupi", done: true },
      { id: "c8", label: "Rehat / tidur secukupnya", done: true },
    ],
    catatanKhas:
      "Sila pantau bacaan gula selepas makan tengah hari, sedikit tinggi hari ini.",
  },
  // Day -1: complete day.
  {
    id: "td-1",
    parentId: "p-demo",
    staffId: "u-staff-1",
    date: daysAgo(1),
    status: "normal",
    vitalEntries: [
      {
        waktu: "pagi",
        suhu: 36.5,
        bpSistolik: 132,
        bpDiastolik: 82,
        nadi: 74,
        pernafasan: 17,
        gulaDarah: 6.2,
        oksigen: 99,
        status: "normal",
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "tengahari",
        suhu: 36.9,
        bpSistolik: 136,
        bpDiastolik: 85,
        nadi: 80,
        pernafasan: 18,
        gulaDarah: 7.0,
        oksigen: 98,
        status: "normal",
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "petang",
        suhu: 36.7,
        bpSistolik: 130,
        bpDiastolik: 80,
        nadi: 76,
        pernafasan: 17,
        gulaDarah: 6.0,
        oksigen: 99,
        status: "normal",
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "malam",
        suhu: 36.4,
        bpSistolik: 128,
        bpDiastolik: 78,
        nadi: 72,
        pernafasan: 16,
        gulaDarah: 5.8,
        oksigen: 99,
        status: "normal",
        pengesahan: "Nurul Aisyah",
      },
    ],
    ubatanEntries: [
      {
        waktu: "pagi",
        pengesahan: "Nurul Aisyah",
        items: [
          {
            namaUbat: "Metformin",
            dos: "500mg",
            caraPengambilan: "Oral / Mulut",
          },
          {
            namaUbat: "Amlodipine",
            dos: "5mg",
            caraPengambilan: "Oral / Mulut",
          },
        ],
      },
      {
        waktu: "prn",
        pengesahan: "Nurul Aisyah",
        items: [
          {
            namaUbat: "Paracetamol",
            dos: "500mg",
            caraPengambilan: "Oral / Mulut",
            catatan: "Sakit lutut (arthritis)",
          },
        ],
      },
    ],
    makananEntries: [
      {
        waktu: "pagi",
        jenisMakanan: "Roti gandum, telur rebus",
        jenisMinum: "Susu rendah lemak",
        kuantiti: "penuh",
        cecairMl: 220,
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "tengahari",
        jenisMakanan: "Nasi, ayam panggang, sayur",
        jenisMinum: "Air kosong",
        kuantiti: "penuh",
        cecairMl: 250,
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "minumPetang",
        jenisMakanan: "Biskut oat",
        jenisMinum: "Teh tanpa gula",
        kuantiti: "separuh",
        cecairMl: 150,
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "makanMalam",
        jenisMakanan: "Nasi, ikan, sayur",
        jenisMinum: "Air kosong",
        kuantiti: "tigaSuku",
        cecairMl: 200,
        pengesahan: "Nurul Aisyah",
      },
    ],
    aktiviti:
      "Senaman regangan ringan pada waktu pagi. Aktiviti mewarna bersama. Mood ceria sepanjang hari.",
    aktivitiPengesahan: "Nurul Aisyah",
    gambar: [
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
    ],
    checklist: [
      { id: "c1", label: "Mandi / kebersihan diri", done: true },
      { id: "c2", label: "Tukar pakaian", done: true },
      { id: "c3", label: "Ambil ubat mengikut jadual", done: true },
      { id: "c4", label: "Sarapan / makan mengikut waktu", done: true },
      { id: "c5", label: "Senaman ringan / pergerakan", done: true },
      { id: "c6", label: "Pantau tanda vital", done: true },
      { id: "c7", label: "Minum air mencukupi", done: true },
      { id: "c8", label: "Rehat / tidur secukupnya", done: true },
    ],
  },
  // Day 0 (today): in-progress — only pagi & tengah hari done & confirmed (within 24h, staff boleh tambah waktu lain).
  {
    id: "td-0",
    parentId: "p-demo",
    staffId: "u-staff-1",
    date: daysAgo(0),
    status: "normal",
    editAllowed: true,
    vitalEntries: [
      {
        waktu: "pagi",
        suhu: 36.6,
        bpSistolik: 130,
        bpDiastolik: 82,
        nadi: 75,
        pernafasan: 17,
        gulaDarah: 6.1,
        oksigen: 99,
        status: "normal",
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "tengahari",
        suhu: 36.8,
        bpSistolik: 134,
        bpDiastolik: 84,
        nadi: 79,
        pernafasan: 18,
        gulaDarah: 6.9,
        oksigen: 98,
        status: "normal",
        pengesahan: "Nurul Aisyah",
      },
    ],
    ubatanEntries: [
      {
        waktu: "pagi",
        pengesahan: "Nurul Aisyah",
        items: [
          {
            namaUbat: "Metformin",
            dos: "500mg",
            caraPengambilan: "Oral / Mulut",
          },
          {
            namaUbat: "Amlodipine",
            dos: "5mg",
            caraPengambilan: "Oral / Mulut",
          },
        ],
      },
    ],
    makananEntries: [
      {
        waktu: "pagi",
        jenisMakanan: "Bubur, telur",
        jenisMinum: "Air kosong",
        kuantiti: "penuh",
        cecairMl: 200,
        pengesahan: "Nurul Aisyah",
      },
      {
        waktu: "tengahari",
        jenisMakanan: "Nasi, sup ayam, sayur",
        jenisMinum: "Air kosong",
        kuantiti: "tigaSuku",
        cecairMl: 250,
        pengesahan: "Nurul Aisyah",
      },
    ],
    aktiviti:
      "Pagi: berjemur & senaman ringan. Tengah hari: berehat selepas makan.",
    aktivitiPengesahan: "Nurul Aisyah",
    gambar: [
      "https://images.unsplash.com/photo-1505455184862-554165e5f6ba?w=400&q=80",
    ],
    checklist: [
      { id: "c1", label: "Mandi / kebersihan diri", done: true },
      { id: "c2", label: "Tukar pakaian", done: true },
      { id: "c3", label: "Ambil ubat mengikut jadual", done: true },
      { id: "c4", label: "Sarapan / makan mengikut waktu", done: true },
      { id: "c5", label: "Senaman ringan / pergerakan", done: true },
      { id: "c6", label: "Pantau tanda vital", done: true },
      { id: "c7", label: "Minum air mencukupi", done: false },
      { id: "c8", label: "Rehat / tidur secukupnya", done: false },
    ],
  },
];

export const articles: Article[] = [
  {
    id: "a1",
    title: "Mengurus Tekanan Darah Tinggi pada Warga Emas",
    topic: "Kesihatan",
    subtopic: "Darah Tinggi",
    coverImage:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",
    body: "Tekanan darah tinggi adalah masalah biasa di kalangan warga emas. Pengambilan ubat secara konsisten, diet rendah garam, dan senaman ringan setiap hari dapat membantu mengawal tekanan darah dalam julat selamat.\n\nPantau bacaan setiap pagi dan rekodkan untuk perbincangan dengan doktor.",
    pdfUrl:
      "https://www.who.int/docs/default-source/searo/myanmar/blood-pressure.pdf",
    pdfName: "panduan-darah-tinggi.pdf",
    visibility: "published",
    views: 1240,
    createdAt: daysAgo(7),
  },
  {
    id: "a2",
    title: "Diet Seimbang untuk Pesakit Diabetes",
    topic: "Pemakanan",
    subtopic: "Diet Seimbang",
    coverImage:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
    body: "Pesakit diabetes perlu memilih karbohidrat kompleks, mengurangkan gula tambahan, dan memastikan saiz hidangan yang sederhana. Sayur-sayuran berdaun hijau dan protein tanpa lemak adalah pilihan terbaik.",
    youtubeUrl: "https://www.youtube.com/embed/inpok4MKVLM",
    visibility: "published",
    views: 860,
    createdAt: daysAgo(14),
  },
  {
    id: "a3",
    title: "Senaman Ringan di Rumah",
    topic: "Senaman",
    subtopic: "Ringan",
    coverImage:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    body: "Senaman ringan seperti berjalan di sekitar rumah, regangan kaki, dan latihan keseimbangan amat penting untuk menjaga kekuatan otot warga emas.",
    visibility: "draft",
    views: 312,
    createdAt: daysAgo(3),
  },
  {
    id: "a4",
    title: "Memahami Demensia: Tanda Awal",
    topic: "Mental",
    subtopic: "Demensia",
    coverImage:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
    body: "Tanda awal demensia termasuk kesukaran mengingati peristiwa baru, kekeliruan tentang masa atau tempat, dan perubahan personaliti. Pengesanan awal membantu pengurusan yang lebih baik.",
    visibility: "published",
    views: 540,
    createdAt: daysAgo(10),
  },
  {
    // Contoh artikel dengan PDF (kandungan utama) DAN video YouTube (sokongan).
    id: "a5",
    title: "Panduan Lengkap Penjagaan Diabetes di Rumah",
    topic: "Kesihatan",
    subtopic: "Diabetes",
    coverImage:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
    body: "Panduan ini menggabungkan dokumen rujukan PDF dan video tutorial. Baca dokumen PDF untuk maklumat terperinci, dan tonton video sokongan untuk demonstrasi praktikal pemantauan gula darah di rumah.",
    pdfUrl:
      "https://www.who.int/docs/default-source/searo/myanmar/blood-pressure.pdf",
    pdfName: "panduan-penjagaan-diabetes.pdf",
    youtubeUrl: "https://www.youtube.com/embed/inpok4MKVLM",
    visibility: "published",
    views: 975,
    createdAt: daysAgo(2),
  },
];

export const videos: Video[] = [
  {
    id: "v1",
    title: "Latihan Pernafasan untuk Warga Emas",
    topic: "Senaman",
    subtopic: "Pernafasan",
    url: "https://www.youtube.com/embed/aXItOY0sLRY",
    description:
      "Latihan pernafasan 5 minit untuk menenangkan minda dan badan.",
    visibility: "published",
    views: 2100,
    createdAt: daysAgo(5),
  },
  {
    id: "v2",
    title: "Resepi Makanan Sihat",
    topic: "Pemakanan",
    subtopic: "Diet Seimbang",
    url: "https://www.youtube.com/embed/inpok4MKVLM",
    description: "Cadangan resepi sihat untuk warga emas.",
    pdfUrl:
      "https://www.who.int/docs/default-source/searo/myanmar/blood-pressure.pdf",
    pdfName: "senarai-resepi-sihat.pdf",
    visibility: "published",
    views: 1430,
    createdAt: daysAgo(8),
  },
];

// Caregivers that admin can assign to a booking.
export const caregivers: Caregiver[] = [
  {
    id: "cg-1",
    name: "Nurul Aisyah",
    phone: "012-345 6789",
    avatar:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&q=80",
    specialization: "Penjagaan Warga Emas & Pemantauan Vital",
    experienceYears: 6,
    rating: 4.8,
    notes: "Berpengalaman menjaga pesakit diabetes & darah tinggi.",
  },
  {
    id: "cg-2",
    name: "Ahmad Faiz bin Rosli",
    phone: "013-222 3344",
    avatar:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80",
    specialization: "Fisioterapi & Bantuan Mobiliti",
    experienceYears: 4,
    rating: 4.5,
    notes: "Pakar bantuan pergerakan & senaman pemulihan.",
  },
  {
    id: "cg-3",
    name: "Siti Khadijah binti Omar",
    phone: "017-998 8776",
    avatar:
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&q=80",
    specialization: "Teman Harian (Companion)",
    experienceYears: 3,
    rating: 4.7,
    notes: "Mesra & sabar, mahir menemani aktiviti harian.",
  },
];

export function getCaregiver(id?: string): Caregiver | undefined {
  return id ? caregivers.find((c) => c.id === id) : undefined;
}

const bookingDate = (offset: number) =>
  new Date(today.getTime() + offset * 86400000).toISOString().slice(0, 10);

// Service bookings made by family (anak). Mutable in-memory store.
export const bookings: Booking[] = [
  // Akan Datang — caregiver sudah ditetapkan oleh admin.
  {
    id: "b1",
    anakId: "u-anak-1",
    parentId: "p-1",
    serviceType: "companion",
    date: bookingDate(2),
    time: "10:00",
    transport: "hantar",
    location: "No. 12, Jalan Damai, 50480 Kuala Lumpur",
    notes: "Tolong temankan ke klinik untuk pemeriksaan susulan.",
    status: "confirmed",
    createdAt: daysAgo(1),
    caregiverId: "cg-1",
    price: 120,
    paymentStatus: "deposit",
  },
  // Akan Datang — caregiver belum ditetapkan.
  {
    id: "b2",
    anakId: "u-anak-1",
    parentId: "p-2",
    serviceType: "care",
    date: bookingDate(5),
    time: "09:00",
    transport: "pickup",
    location: "No. 5, Taman Sentosa, 81300 Johor Bahru",
    notes: "Pemantauan tekanan darah & ubatan jantung.",
    status: "pending",
    createdAt: daysAgo(0),
    price: 180,
    paymentStatus: "belum_bayar",
  },
  // Sedang Berlangsung — servis sedang dijalankan hari ini.
  {
    id: "b3",
    anakId: "u-anak-1",
    parentId: "p-demo",
    serviceType: "care",
    date: bookingDate(0),
    time: "08:30",
    transport: "hantar",
    location: "No. 23, Jalan Seri Melati, 43000 Kajang, Selangor",
    notes: "Penjagaan harian penuh termasuk pemantauan vital.",
    status: "ongoing",
    createdAt: daysAgo(2),
    caregiverId: "cg-3",
    price: 200,
    paymentStatus: "telah_bayar",
  },
  // Selesai — tempahan lepas.
  {
    id: "b4",
    anakId: "u-anak-1",
    parentId: "p-1",
    serviceType: "companion",
    date: bookingDate(-7),
    time: "14:00",
    transport: "hantar",
    location: "No. 12, Jalan Damai, 50480 Kuala Lumpur",
    notes: "Teman ke taman & aktiviti senaman ringan.",
    status: "completed",
    createdAt: daysAgo(9),
    caregiverId: "cg-2",
    price: 120,
    paymentStatus: "telah_bayar",
  },
  // Dibatalkan.
  {
    id: "b5",
    anakId: "u-anak-1",
    parentId: "p-2",
    serviceType: "care",
    date: bookingDate(-3),
    time: "11:00",
    transport: "sendiri",
    location: "No. 5, Taman Sentosa, 81300 Johor Bahru",
    notes: "Dibatalkan kerana warga emas dimasukkan ke hospital.",
    status: "cancelled",
    createdAt: daysAgo(5),
    price: 180,
    paymentStatus: "belum_bayar",
  },
];

export const SERVICE_TYPES: {
  key: ServiceType;
  label: string;
  desc: string;
}[] = [
  {
    key: "companion",
    label: "Companion",
    desc: "Teman & sokongan harian tanpa penjagaan perubatan.",
  },
  {
    key: "care",
    label: "Care",
    desc: "Penjagaan termasuk pemantauan kesihatan & ubatan.",
  },
];

export const TRANSPORT_MODES: { key: TransportMode; label: string }[] = [
  { key: "sendiri", label: "Sediakan kenderaan sendiri" },
  { key: "hantar", label: "Hantar ke lokasi" },
  { key: "pickup", label: "Ambil di lokasi (pickup)" },
];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Menunggu",
  confirmed: "Disahkan",
  ongoing: "Sedang Berlangsung",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  belum_bayar: "Belum Bayar",
  deposit: "Deposit Dibayar",
  telah_bayar: "Telah Dibayar",
};

export function computeStatus(bp?: number, sugar?: number): TrackerStatus {
  if (!bp && !sugar) return "normal";
  if ((bp && bp >= 150) || (sugar && sugar >= 9)) return "critical";
  if ((bp && bp >= 140) || (sugar && sugar >= 7.5)) return "attention";
  return "normal";
}

// Compute status from a full set of vital signs.
export function computeVitalStatus(v: {
  suhu?: number;
  bpSistolik?: number;
  nadi?: number;
  pernafasan?: number;
  gulaDarah?: number;
  oksigen?: number;
}): TrackerStatus {
  const { suhu, bpSistolik, nadi, pernafasan, gulaDarah, oksigen } = v;
  // Critical thresholds
  if (
    (suhu && (suhu >= 39 || suhu < 35)) ||
    (bpSistolik && bpSistolik >= 150) ||
    (nadi && (nadi >= 120 || nadi < 50)) ||
    (pernafasan && (pernafasan >= 25 || pernafasan < 10)) ||
    (gulaDarah && (gulaDarah >= 9 || gulaDarah < 3.5)) ||
    (oksigen && oksigen < 92)
  )
    return "critical";
  // Attention thresholds
  if (
    (suhu && suhu >= 37.8) ||
    (bpSistolik && bpSistolik >= 140) ||
    (nadi && nadi >= 100) ||
    (pernafasan && pernafasan >= 22) ||
    (gulaDarah && gulaDarah >= 7.5) ||
    (oksigen && oksigen < 95)
  )
    return "attention";
  return "normal";
}

// ===== Per-vital-sign validation =====
// Each vital sign is validated independently and shows ONLY its own status
// (Normal / Amaran / Bahaya). No overall health status is derived from these.
export type VitalStatus = "normal" | "amaran" | "bahaya";

export const VITAL_STATUS_LABEL: Record<VitalStatus, string> = {
  normal: "Normal",
  amaran: "Amaran",
  bahaya: "Bahaya",
};

// Suhu badan (°C): Normal 36.5–37.5 · Amaran 37.6–38.0 · Bahaya ≥38.0
export function statusSuhu(v?: number): VitalStatus | undefined {
  if (v == null) return undefined;
  if (v >= 38.0) return "bahaya";
  if (v >= 37.6) return "amaran";
  return "normal";
}

// Tekanan darah (mmHg): Normal <120/80 · Amaran 120–139/80–89 · Bahaya ≥140/90 atau <90/60
export function statusTekanan(
  sys?: number,
  dia?: number,
): VitalStatus | undefined {
  if (sys == null || dia == null) return undefined;
  if (sys >= 140 || dia >= 90 || sys < 90 || dia < 60) return "bahaya";
  if ((sys >= 120 && sys <= 139) || (dia >= 80 && dia <= 89)) return "amaran";
  return "normal";
}

// Nadi (bpm): Normal 60–100 · Amaran 50–59 atau 101–110 · Bahaya <50 atau >110
export function statusNadi(v?: number): VitalStatus | undefined {
  if (v == null) return undefined;
  if (v < 50 || v > 110) return "bahaya";
  if ((v >= 50 && v <= 59) || (v >= 101 && v <= 110)) return "amaran";
  return "normal";
}

// Pernafasan (/min): Normal 12–20 · Amaran 21–24 · Bahaya <10 atau >24
export function statusPernafasan(v?: number): VitalStatus | undefined {
  if (v == null) return undefined;
  if (v < 10 || v > 24) return "bahaya";
  if (v >= 21 && v <= 24) return "amaran";
  return "normal";
}

// Gula darah puasa (mmol/L): Normal 3.9–5.5 · Amaran 5.6–6.9 · Bahaya ≥7.0 atau <3.9
export function statusGulaDarah(v?: number): VitalStatus | undefined {
  if (v == null) return undefined;
  if (v >= 7.0 || v < 3.9) return "bahaya";
  if (v >= 5.6 && v <= 6.9) return "amaran";
  return "normal";
}

// Oksigen SpO₂ (%): Normal 95–100 · Amaran 91–94 · Bahaya ≤90
export function statusOksigen(v?: number): VitalStatus | undefined {
  if (v == null) return undefined;
  if (v <= 90) return "bahaya";
  if (v >= 91 && v <= 94) return "amaran";
  return "normal";
}

// Maps a vital report's waktu to a representative time-of-day, used for the
// time-based graph x-axis (one elderly can have several reports in a day).
export const WAKTU_TIME: Record<WaktuVital, string> = {
  pagi: "08:00",
  tengahari: "12:00",
  petang: "16:00",
  malam: "20:00",
};

// Waktu options used across the daily report form.
export const WAKTU_VITAL: { key: WaktuVital; label: string }[] = [
  { key: "pagi", label: "Pagi" },
  { key: "tengahari", label: "Tengah Hari" },
  { key: "petang", label: "Petang" },
  { key: "malam", label: "Malam" },
];

export const WAKTU_UBATAN: { key: WaktuUbatan; label: string }[] = [
  { key: "pagi", label: "Pagi" },
  { key: "tengahari", label: "Tengah Hari" },
  { key: "petang", label: "Petang" },
  { key: "malam", label: "Malam" },
  { key: "prn", label: "PRN (Bila Perlu)" },
  { key: "kecemasan", label: "Kecemasan" },
];

export const WAKTU_MAKANAN: { key: WaktuMakanan; label: string }[] = [
  { key: "pagi", label: "Sarapan Pagi" },
  { key: "snekPagi", label: "Snek Pagi / Brunch" },
  { key: "tengahari", label: "Makan Tengah Hari" },
  { key: "minumPetang", label: "Minum Petang" },
  { key: "makanMalam", label: "Makan Malam" },
  { key: "snekMalam", label: "Snek Malam" },
];

export const KUANTITI_OPTIONS: { key: Kuantiti; label: string }[] = [
  { key: "tidakMakan", label: "Tidak Makan" },
  { key: "suku", label: "Suku" },
  { key: "separuh", label: "Separuh" },
  { key: "tigaSuku", label: "3 Suku" },
  { key: "penuh", label: "Penuh" },
];

export const CARA_PENGAMBILAN = [
  "Oral / Mulut",
  "Suntikan",
  "Topikal / Sapu",
  "Titisan",
  "Sedutan / Inhaler",
  "Lain-lain",
];

// Records stay editable by staff for 24 hours after the record time
// (so they can add other waktu later in the day). After that an admin
// must explicitly grant edit access.
export const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isWithin24h(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < EDIT_WINDOW_MS;
}

export function canStaffEdit(
  r: Pick<TrackerRecord, "date" | "editAllowed">,
): boolean {
  return isWithin24h(r.date) || (r.editAllowed ?? false);
}

// Default daily care checklist for staff to tick.
export const DEFAULT_CHECKLIST: { id: string; label: string }[] = [
  { id: "c1", label: "Mandi / kebersihan diri" },
  { id: "c2", label: "Tukar pakaian" },
  { id: "c3", label: "Ambil ubat mengikut jadual" },
  { id: "c4", label: "Sarapan / makan mengikut waktu" },
  { id: "c5", label: "Senaman ringan / pergerakan" },
  { id: "c6", label: "Pantau tanda vital" },
  { id: "c7", label: "Minum air mencukupi" },
  { id: "c8", label: "Rehat / tidur secukupnya" },
];
