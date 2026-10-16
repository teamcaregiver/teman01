// Buku 3 — "Jadual Pemantauan Pesakit oleh Caregiver", transcribed from the
// first draft of Manual 3 (issue #9). Shown on the family "Buku" page, and
// each unit's general instructions (arahan am) are repeated on the matching
// staff form. Scales and charts live in src/lib/pemantauan.ts and the vital
// thresholds in src/lib/mock-data.ts, so the book and the forms never differ.
// Update the text here when the final manual is ready.

export const BUKU3_TAJUK = "Jadual Pemantauan Pesakit oleh Caregiver";

export const BUKU3_PENGENALAN =
  "Manual ini sebagai panduan praktikal kepada caregiver dalam melaksanakan tugas penjagaan harian " +
  "pesakit secara sistematik, selamat dan berkesan. Manual ini juga berfungsi sebagai alat pemantauan " +
  "yang membantu caregiver merekod, memerhati dan menilai keadaan kesihatan pesakit secara berterusan.";

export const BUKU3_PERANAN: { tajuk: string; huraian: string }[] = [
  {
    tajuk: "Membantu pemantauan kesihatan pesakit",
    huraian:
      "Manual ini menyediakan jadual pemantauan harian yang membolehkan caregiver memeriksa keadaan fizikal dan kesihatan pesakit secara berkala, termasuk tanda vital, pengambilan ubat, pemakanan, perkumuhan dan perubahan tingkah laku.",
  },
  {
    tajuk: "Meningkatkan kualiti penjagaan",
    huraian:
      "Dengan penggunaan rekod yang sistematik, caregiver dapat memastikan setiap aspek penjagaan dilaksanakan mengikut jadual dan keperluan pesakit, sekali gus meningkatkan kualiti penjagaan yang diberikan.",
  },
  {
    tajuk: "Mengesan perubahan kesihatan awal",
    huraian:
      "Maklumat yang direkodkan membantu caregiver mengenal pasti tanda-tanda awal kemerosotan kesihatan seperti demam, perubahan tekanan darah, kesukaran bernafas, perubahan emosi atau tingkah laku yang memerlukan tindakan segera.",
  },
  {
    tajuk: "Memudahkan komunikasi dengan profesional kesihatan",
    huraian:
      "Rekod yang lengkap membolehkan maklumat kesihatan pesakit dikongsi dengan doktor, jururawat atau ahli keluarga dengan lebih tepat bagi membantu proses rawatan dan pemantauan lanjut.",
  },
  {
    tajuk: "Menjadi bukti dokumentasi penjagaan",
    huraian:
      "Manual ini berfungsi sebagai dokumen rujukan yang merekodkan aktiviti penjagaan harian, sekali gus membantu caregiver menilai keberkesanan penjagaan dan membuat penambahbaikan yang diperlukan.",
  },
  {
    tajuk: "Mengurangkan risiko komplikasi pesakit",
    huraian:
      "Pemantauan yang konsisten terhadap tanda vital, pengambilan ubat, pemakanan dan penukaran posisi pesakit dapat membantu mengurangkan risiko komplikasi seperti luka tekanan, kekurangan nutrisi, dehidrasi dan jangkitan.",
  },
  {
    tajuk: "Meningkatkan keyakinan dan kompetensi caregiver",
    huraian:
      "Manual ini memberi panduan yang jelas kepada caregiver, terutamanya caregiver baharu dalam melaksanakan tugas penjagaan dengan lebih yakin, terancang dan profesional.",
  },
];

export const BUKU3_SASARAN = [
  "Caregiver keluarga (family caregiver).",
  "Caregiver komuniti.",
  "Pembantu penjagaan warga emas.",
  "Sukarelawan penjagaan.",
  "Pelatih dalam bidang penjagaan.",
  "Pengendali pusat jagaan warga emas dan pesakit kronik.",
];

export const BUKU3_PROFIL = {
  arahan: [
    "Sila kemas kini bahagian ini sekurang-kurangnya 6 bulan sekali (terutamanya berat badan).",
    "Tampal gambar terkini pesakit pada petak yang disediakan.",
  ],
  // [perkara, catatan tambahan]
  baris: [
    ["Nama penuh", "Nama panggilan"],
    ["No. kad pengenalan", "Umur"],
    ["Berat dan tinggi (kg / cm)", "Penting untuk pengiraan dos ubat"],
    ["Diagnosis utama", ""],
    [
      "Alergi (Ya — nyatakan / Tidak)",
      "Senaraikan ubat / makanan / persekitaran",
    ],
    ["Jenis diet", "Tekstur makanan pesakit"],
    ["Tahap penglihatan", "Baik / kabur / bercermin mata"],
    [
      "Tahap pendengaran",
      "Baik / kurang baik / memakai alat bantuan pendengaran",
    ],
    ["Klinik / hospital", "Tempat temu janji rutin"],
    ["Doktor merawat", "No. telefon"],
    ["Waris terdekat", "No. telefon"],
    ["Nama caregiver 1", "No. telefon"],
    ["Nama caregiver 2", "No. telefon"],
  ] as [string, string][],
};

export const BUKU3_PANDUAN = [
  "Semua jadual yang disediakan dalam manual 3 ini adalah contoh dan boleh diubah suai mengikut keperluan, keadaan kesihatan serta rutin harian pesakit. Caregiver digalakkan menambah, mengurangkan atau mengubah suai ruangan pemantauan yang bersesuaian.",
  "Sila gunakan helaian atau cetakan baharu bagi setiap minggu atau hari yang baharu. Salinan digital (softcopy) boleh diperoleh dengan mengimbas kod QR yang disediakan pada setiap hujung jadual.",
  "Gunakan pen berwarna hitam atau biru untuk merekod bacaan normal, manakala pen berwarna merah boleh digunakan untuk menandakan bacaan amaran dan tidak normal.",
  "Jangan biarkan petak kosong. Gunakan kod berikut sekiranya aktiviti tidak dapat direkodkan: TB — Tidak berkenaan; X — Pesakit enggan atau menolak; LU — Lupa atau terlepas merekod.",
  "Setiap kali pengisian dibuat, tulis nama ringkas anda pada ruangan 'Pengesahan' selepas tugasan selesai dilaksanakan.",
  "Jika perlu, bawa keseluruhan manual 3 ini semasa janji temu di klinik atau hospital untuk semakan doktor atau pegawai kesihatan.",
  "Manual ini boleh digunakan sebagai alat pemantauan dan rekod harian. Ia tidak menggantikan nasihat, diagnosis atau rawatan yang diberikan oleh doktor atau pegawai kesihatan.",
];

export type Buku3UnitId =
  | "rutin"
  | "vital"
  | "ubat"
  | "pemakanan"
  | "perkumuhan"
  | "tingkahLaku"
  | "posisi"
  | "kesakitan"
  | "risikoJatuh";

export interface Buku3Unit {
  id: Buku3UnitId;
  unit: number;
  tajuk: string;
  arahan: string[];
  sumber?: string;
}

export const BUKU3_UNIT: Buku3Unit[] = [
  {
    id: "rutin",
    unit: 1,
    tajuk: "Jadual Rutin Harian (Masa vs Aktiviti)",
    arahan: [
      "Jadual ini disediakan sebagai panduan dan boleh diubah suai mengikut keperluan pesakit serta rutin penjagaan harian.",
      "Aktiviti asas seperti pengambilan makanan, ubat-ubatan, kebersihan diri dan pemantauan kesihatan disarankan untuk dilaksanakan mengikut keperluan pesakit. Aktiviti lain seperti senaman ringan, fisioterapi atau aktiviti santai boleh disesuaikan mengikut keadaan dan tahap kesihatan pesakit.",
      "Tandakan (✓) pada ruangan Tindakan selepas sesuatu aktiviti selesai dilaksanakan.",
      "Catatkan masa sebenar aktiviti dijalankan pada ruangan masa. Masa yang dicatatkan tidak semestinya mengikut turutan jadual rutin yang dicadangkan.",
      "Sekiranya aktiviti tidak dapat dilaksanakan, tandakan [B] (Batal) pada ruangan Tindakan dan nyatakan sebab secara ringkas pada ruangan Catatan.",
      "Ruangan catatan boleh digunakan untuk merekodkan perubahan keadaan pesakit, simptom yang diperhatikan, masalah yang timbul atau perkara lain yang memerlukan perhatian.",
      "Jika penjagaan dilakukan secara bergilir-gilir, penjaga baharu hendaklah menyemak rekod terdahulu dan dapatkan pengesahan daripada penjaga sebelumnya sekiranya terdapat maklumat yang tidak lengkap, terutamanya bagi aktiviti penting seperti pemberian ubat, pemakanan dan pemantauan kesihatan.",
    ],
  },
  {
    id: "vital",
    unit: 2,
    tajuk: "Pemantauan Tanda Vital",
    arahan: [
      "Pastikan pesakit duduk atau berbaring dalam keadaan tenang sekurang-kurangnya 5 minit sebelum bacaan diambil.",
      "Jangan ambil bacaan sekiranya pesakit baru sahaja selesai mengambil hidangan utama (sarapan / makan tengah hari / makan malam), minuman panas atau sejuk, atau baru selesai mandi. Tunggu sekurang-kurangnya 30 minit sebelum mengambil bacaan.",
      "Jika bacaan pertama diragui atau tidak konsisten, rehatkan pesakit selama 2 minit, kemudian ambil bacaan sekali lagi.",
      "Rujuk jadual pemantauan yang disediakan dalam manual ini secara berkala.",
      "Gunakan pen berwarna hitam atau biru untuk mencatat bacaan normal. Gunakan pen berwarna merah bagi menandakan bacaan amaran atau bacaan tidak normal.",
      "Sekiranya bacaan berada pada tahap AMARAN, tingkatkan kekerapan pemantauan dan perhatikan sebarang perubahan keadaan pesakit. Sekiranya bacaan berada pada tahap BAHAYA, hentikan aktiviti rutin dan dapatkan bantuan perubatan atau ikuti pelan tindakan kecemasan dengan segera.",
    ],
  },
  {
    id: "ubat",
    unit: 3,
    tajuk: "Pemantauan Pengambilan Ubat",
    arahan: [
      "Pilih kategori ubat yang sesuai sama ada pagi, tengah hari, petang, malam, PRN (bila perlu) atau kecemasan (rujuk rajah waktu pengambilan ubat).",
      "Catat masa ubat diberikan kepada pesakit pada ruangan yang disediakan.",
      "Rekodkan nama ubat dan dos mengikut preskripsi atau arahan doktor, ahli farmasi atau pegawai kesihatan.",
      "Nyatakan cara pengambilan ubat contohnya sebelum makan, selepas makan atau mengikut arahan khas.",
      "Catatkan sebarang pemerhatian penting selepas pengambilan ubat, seperti kesan sampingan, reaksi luar biasa atau kesukaran mengambil ubat pada ruangan catatan.",
      "Semak dan kemas kini jadual ini setiap kali ubat diberikan bagi mengelakkan dos tertinggal atau berulang.",
    ],
    sumber: "Kementerian Kesihatan Malaysia (2014).",
  },
  {
    id: "pemakanan",
    unit: 4,
    tajuk: "Pemantauan Pemakanan dan Pengambilan Cecair (Input)",
    arahan: [
      "Catat masa setiap hidangan atau minuman diberikan kepada pesakit.",
      "Rekodkan jenis makanan atau minuman yang diambil oleh pesakit.",
      "Nyatakan kuantiti makanan atau minuman yang diambil, contohnya habis, separuh, suku atau jumlah tertentu.",
      "Rekodkan jumlah pengambilan cecair dalam unit mililiter (mL) atau liter (L), jika berkenaan.",
      "Catatkan sebarang pemerhatian penting berkaitan pemakanan seperti kurang selera makan, tidak menghabiskan makanan, tersedak, muntah, loya atau kesukaran menelan.",
      "Semak dan kemas kini jadual ini setiap hari bagi membantu pemantauan pemakanan, hidrasi dan keadaan kesihatan pesakit.",
    ],
  },
  {
    id: "perkumuhan",
    unit: 5,
    tajuk: "Pemantauan Perkumuhan (Output)",
    arahan: [
      "Rekod masa dan jenis output yang berlaku sama ada air kencing, najis atau muntah.",
      "Catatkan kekerapan atau jumlah kejadian sekiranya output berlaku lebih daripada sekali dalam tempoh pemantauan.",
      "Nilai dan rekodkan keadaan output berdasarkan warna, tekstur, bau atau ciri-ciri lain dengan merujuk kepada carta yang disediakan.",
      "Catatkan sebarang pemerhatian penting seperti cirit-birit, sembelit, darah dalam najis, air kencing keruh, perubahan warna yang ketara atau keadaan lain yang membimbangkan.",
      "Bagi muntah, rekodkan warna, kandungan dan kekerapan muntah jika berkenaan.",
      "Rujuk doktor atau pegawai kesihatan sekiranya terdapat perubahan luar biasa atau berterusan.",
      "Gunakan Carta Bristol Stool Chart dan Carta Warna Urin yang disediakan sebagai panduan untuk menilai keadaan tersebut.",
    ],
    sumber: "Kementerian Kesihatan Malaysia (2018, 2019).",
  },
  {
    id: "tingkahLaku",
    unit: 6,
    tajuk: "Pemerhatian Tingkah Laku dan Emosi",
    arahan: [
      "Pilih satu skor yang paling menggambarkan keadaan pesakit bagi setiap kategori pemerhatian.",
      "Nilai mood, interaksi, tingkah laku dan emosi berdasarkan pemerhatian sepanjang hari atau tempoh pemantauan.",
      "Catatkan sebarang perubahan, kejadian luar biasa atau faktor yang mungkin mempengaruhi keadaan pesakit pada ruangan catatan.",
      "Berikan perhatian sekiranya skor menunjukkan keadaan yang semakin membimbangkan atau berubah secara ketara daripada kebiasaan.",
      "Rujuk doktor atau pegawai kesihatan sekiranya perubahan tingkah laku atau emosi berterusan, semakin teruk atau menjejaskan keselamatan pesakit.",
    ],
  },
  {
    id: "posisi",
    unit: 7,
    tajuk: "Penukaran Posisi Pesakit Terlantar (Bedridden)",
    arahan: [
      "Tukar posisi pesakit sekurang-kurangnya setiap 2 jam atau mengikut nasihat doktor atau pegawai kesihatan bagi mengurangkan tekanan berpanjangan pada bahagian tubuh tertentu serta membantu mencegah luka tekanan (pressure injury atau bed sore).",
      "Catat masa dan posisi yang diberikan kepada pesakit pada setiap sesi penukaran posisi.",
      "Rujuk Carta Penukaran Posisi Berkala (Clock Turn Schedule) yang disediakan sebagai panduan penukaran posisi.",
      "Periksa keadaan kulit, terutamanya di bahagian yang menerima tekanan seperti tumit, pinggul, siku dan belakang badan semasa penukaran posisi.",
      "Catatkan sebarang perubahan atau pemerhatian seperti kemerahan, luka tekanan, ketidakselesaan atau aduan kesakitan pada ruangan catatan.",
      "Rujuk doktor atau pegawai kesihatan sekiranya terdapat tanda luka tekanan, kesakitan berterusan atau perubahan keadaan pesakit yang membimbangkan.",
    ],
    sumber: "Kementerian Kesihatan Malaysia (2022).",
  },
  {
    id: "kesakitan",
    unit: 8,
    tajuk: "Penilaian Tahap Kesakitan (Pain Score)",
    arahan: [
      "Minta pesakit menunjukkan tahap kesakitan yang dirasai berdasarkan skala atau carta yang disediakan.",
      "Gunakan Wong-Baker FACES Pain Rating Scale sebagai panduan untuk menilai tahap kesakitan.",
      "Rekod skor kesakitan yang dilaporkan oleh pesakit pada waktu pemantauan.",
      "Catatkan lokasi kesakitan dan sebarang faktor yang memburukkan atau mengurangkan kesakitan pada ruangan catatan.",
      "Berikan perhatian sekiranya skor kesakitan meningkat atau berterusan walaupun selepas rawatan diberikan.",
      "Rujuk doktor atau pegawai kesihatan sekiranya kesakitan teruk, berterusan atau semakin bertambah.",
    ],
    sumber: "Wong-Baker FACES Foundation (2016).",
  },
  {
    id: "risikoJatuh",
    unit: 9,
    tajuk: "Penilaian Risiko Jatuh",
    arahan: [
      "Nilai risiko jatuh pesakit sekurang-kurangnya sekali sehari atau apabila terdapat perubahan keadaan kesihatan.",
      "Tandakan (✓) pada faktor risiko yang berkaitan.",
      "Berikan perhatian tambahan sekiranya pesakit mempunyai sejarah jatuh, masalah keseimbangan atau memerlukan bantuan untuk bergerak.",
      "Pastikan laluan berjalan bebas daripada halangan dan mempunyai pencahayaan mencukupi.",
      "Gunakan alat bantuan berjalan seperti tongkat, walker atau kerusi roda jika diperlukan.",
      "Catat sebarang kejadian hampir jatuh, jatuh dengan kecederaan atau jatuh tanpa kecederaan pada ruangan catatan.",
      "Rujuk doktor atau pegawai kesihatan sekiranya risiko jatuh meningkat atau berlaku kejadian jatuh.",
    ],
  },
];

/** Unit 1: the suggested daily routine, in order through the day. */
export const RUTIN_HARIAN = [
  "Pemeriksaan tahap kesedaran dan keadaan umum pesakit",
  "Pemantauan tanda vital (tekanan darah, nadi, suhu, pernafasan atau SpO₂ jika berkaitan)",
  "Kebersihan diri (mandi, lap badan, kebersihan mulut, tukar lampin, dll.)",
  "Tukar pakaian",
  "Tukar lampin (jika perlu)",
  "Sarapan pagi",
  "Pengambilan ubat pagi (jika perlu)",
  "Pengambilan cecair yang mencukupi",
  "Senaman ringan atau fisioterapi",
  "Aktiviti kognitif atau sosial (berbual, membaca, permainan minda, dll.)",
  "Pemerhatian tingkah laku, keselesaan dan tanda kesakitan",
  "Makan tengah hari",
  "Pengambilan ubat tengah hari (jika ada)",
  "Rehat atau tidur seketika",
  "Penukaran posisi badan (jika perlu)",
  "Aktiviti santai atau riadah ringan",
  "Kebersihan diri (mandi, lap badan, tukar lampin, dll.)",
  "Makan malam",
  "Pengambilan ubat malam (jika perlu)",
  "Pemeriksaan semula tanda vital (jika perlu)",
  "Kebersihan diri sebelum tidur",
  "Persediaan tidur dan pemeriksaan keselesaan pesakit",
  "Penukaran posisi sebelum tidur (jika perlu)",
  "Pemantauan khas pada waktu malam (jika diarahkan oleh petugas kesihatan)",
];

/** Unit 2: reading interpretation, as printed in the manual. */
export const RUJUKAN_VITAL: {
  parameter: string;
  normal: string;
  amaran: string;
  bahaya: string;
  tindakan: string;
}[] = [
  {
    parameter: "Suhu badan",
    normal: "36.5 – 37.5°C",
    amaran: "37.6 – 38.0°C",
    bahaya: "≥ 38.0°C",
    tindakan: "Pantau dan rujuk jika berterusan",
  },
  {
    parameter: "Tekanan darah",
    normal: "< 120/80 mmHg",
    amaran: "120–139 / 80–89 mmHg",
    bahaya: "≥ 140/90 atau < 90/60 mmHg",
    tindakan: "Pantau rapi dan rujuk",
  },
  {
    parameter: "Nadi",
    normal: "60 – 100 bpm",
    amaran: "50–59 atau 101–110 bpm",
    bahaya: "< 50 atau > 110 bpm",
    tindakan: "Rujuk jika tidak normal",
  },
  {
    parameter: "Pernafasan",
    normal: "12 – 20 / min",
    amaran: "21 – 24 / min",
    bahaya: "< 10 atau > 24 / min",
    tindakan: "Rujuk segera",
  },
  {
    parameter: "Gula darah (puasa)",
    normal: "3.9 – 5.5 mmol/L",
    amaran: "5.6 – 6.9 mmol/L",
    bahaya: "≥ 7.0 atau < 3.9 mmol/L",
    tindakan: "Tindakan segera",
  },
  {
    parameter: "Oksigen (SpO₂)",
    normal: "95 – 100%",
    amaran: "91 – 94%",
    bahaya: "≤ 90%",
    tindakan:
      "Pantau rapat dan rujuk segera jika berterusan atau disertai sesak nafas",
  },
];

/** Unit 3: medicine categories and the dose-time chart. */
export const KATEGORI_UBAT = [
  "Pagi",
  "Tengah hari",
  "Petang",
  "Malam",
  "PRN (bila perlu) — contoh: ubat asma, tahan sakit",
  "Kecemasan — contoh: ubat panik",
];

export const NOTA_UBAT = [
  'Ubat PRN "bila perlu" ialah ubat yang hanya diambil apabila simptom tertentu berlaku dan tidak perlu diambil secara tetap setiap hari mengikut arahan doktor atau pegawai kesihatan.',
  "Ubat kecemasan digunakan dalam keadaan tertentu yang memerlukan tindakan segera mengikut arahan doktor atau pegawai kesihatan.",
];

export const WAKTU_DOS: { dos: string; waktu: string }[] = [
  { dos: "Dos sekali sehari", waktu: "Pagi" },
  { dos: "Dos 2 kali sehari", waktu: "Pagi, malam" },
  { dos: "Dos 3 kali sehari", waktu: "Pagi, petang, malam" },
  { dos: "Dos 4 kali sehari", waktu: "Pagi, tengah hari, petang, malam" },
];

/** Unit 4: meal times on the intake table. */
export const WAKTU_MAKAN_BUKU3 = [
  "Pagi",
  "Snek pagi / brunch",
  "Tengah hari",
  "Minum petang",
  "Makan malam",
  "Snek malam",
];

export function unitBuku3(id: Buku3UnitId): Buku3Unit {
  return BUKU3_UNIT.find((u) => u.id === id)!;
}
