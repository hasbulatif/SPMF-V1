# Sistem Pengurusan Murid Al Furqan (SPMF)

Portal Akses Dokumen Murid untuk Ibu Bapa/Penjaga — **Sekolah Rendah Al Furqan Shah Alam**, Malaysia.

Dibangunkan mengikut Dokumen Keperluan Produk (PRD) v1.0.

## Penerangan

SPMF ialah aplikasi web yang membenarkan ibu bapa/penjaga mengakses semua dokumen anak mereka di satu tempat — laporan kemajuan, slip keputusan peperiksaan, surat rasmi, resit yuran, sijil, dan bahan kongsi guru — secara selamat, mudah, dan boleh dicetak/muat turun sebagai PDF.

### Pengguna & Peranan

| Peranan | Keupayaan |
|---|---|
| Ibu Bapa/Penjaga | Log masuk, lihat/cetak/muat turun dokumen anak, kongsi pautan selamat dengan PIN |
| Guru Kelas | Cipta & jana dokumen, kongsi bahan PDF/Google Drive terus kepada ibu bapa, hantar untuk semakan |
| Penolong Kanan / Guru Besar | Lulus/tolak & terbit dokumen, lihat dashboard ringkasan |
| Kerani Pejabat | CRUD murid & ibu bapa, import data |
| Pentadbir Sistem | Urus pengguna, peranan, log audit, tetapan |

### Ciri Utama

- Log masuk emel + kata laluan dengan kunci akaun selepas 5 cubaan gagal
- Kawalan akses berasaskan peranan (RBAC) — ibu bapa hanya lihat dokumen anak sendiri
- Portal dokumen dengan carian, penapis (kategori/tahun/penggal), lencana BAHARU
- Pratonton dokumen format A4 dengan pengepala sekolah
- Cetak & muat turun PDF dengan nama fail piawai
- Pautan perkongsian selamat: PIN 6 digit + tarikh luput (24 jam/7 hari/30 hari) + Kod QR
- **Kongsi Bahan Guru**: muat naik PDF atau tampal URL Google Drive terus kepada ibu bapa tertentu atau seluruh kelas — tanpa perlu key in laporan
- Aliran kerja dokumen: Draf → Semakan → Diluluskan → Diterbitkan → Ditarik
- Panel guru/admin dengan statistik, aliran kelulusan, dashboard ringkasan
- Log audit lengkap (siapa, bila, dokumen apa)
- Notifikasi dalam aplikasi
- UI Bahasa Malaysia, responsif mobile-first, sokongan tema gelap/terang
- Reka bentuk bento grid dengan warna rasmi sekolah (hijau emerald + emas)

## Teknologi

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Pangkalan Data**: Prisma ORM + SQLite (data dummy untuk prototaip)
- **State**: Zustand (client) + React Context
- **Cetakan/PDF**: CSS @media print + window.print()
- **Ikon**: Lucide React
- **Tema**: next-themes (light/dark)

## Pemasangan Tempatan

### Keperluan

- Node.js 20+ atau Bun 1.1+
- npm / bun

### Langkah

```bash
# 1. Clone repositori
git clone https://github.com/hasbulatif/SPMF-V1.git
cd SPMF-V1

# 2. Pasang dependencies
bun install
# atau: npm install

# 3. Jana Prisma Client & push schema ke pangkalan data
bun run db:generate
bun run db:push

# 4. (Pilihan) Isi data sampel
bun run prisma/seed.ts
bun run prisma/seed-shared-resources.ts

# 5. Jalankan pelayan pembangunan
bun run dev
# atau: npm run dev
```

Buka `http://localhost:3000` dalam pelayar.

### Fail `.env`

Fail `.env` sudah disertakan dengan konfigurasi SQLite relatif:

```
DATABASE_URL=file:./db/custom.db
```

Tiada perubahan diperlukan untuk pembangunan tempatan.

## Akaun Demo

Klik butang demo pada halaman log masuk untuk auto-isi, atau masukkan manually:

### Ibu Bapa/Penjaga

| Peranan | Emel | Kata Laluan | Catatan |
|---|---|---|---|
| Ibu Bapa (2 anak) | aisyah.hamid@gmail.com | ibu123 | Ahmad Danish (T1) & Aisyah Nur (T5) |
| Ibu Bapa (2 anak) | fatimah.abdullah@gmail.com | ibu123 | Yusuf (T2) & Khadijah (T3) |
| Ibu Bapa (2 anak) | kamal.ismail@gmail.com | bapa123 | Muhammad Ali (T4) & Zayyan (T6) |
| Ibu Bapa (1 anak) | razif.othman@gmail.com | bapa123 | Aisyah Nur (T5) |
| Ibu Bapa (1 anak) | hasni.mohamed@gmail.com | bapa123 | Sofia Nur (T1) |
| Ibu Bapa (1 anak) | norhayati.salleh@gmail.com | ibu123 | Hamzah (T5) |

### Staf Sekolah

| Peranan | Emel | Kata Laluan |
|---|---|---|
| Guru Kelas | ahmad.fazil@alfurqan.edu.my | guru123 |
| Penolong Kanan | noraini.yusof@alfurqan.edu.my | pk123 |
| Kerani Pejabat | siti.ismail@alfurqan.edu.my | kerani123 |
| Pentadbir Sistem | admin@alfurqan.edu.my | admin123 |

## Struktur Projek

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes (backend)
│   │   ├── auth/             # Login, logout, session
│   │   ├── guardian/         # Endpoint ibu bapa (dashboard, dokumen, notifikasi, bahan guru)
│   │   ├── documents/[id]/   # Butiran dokumen + mark-read + audit
│   │   ├── share/            # Pautan perkongsian (create, list, [token])
│   │   └── staff/            # Endpoint staf (dashboard, dokumen, murid, guardian, kelas, audit, share-resources)
│   ├── globals.css           # Tema warna SPMF + print styles + bento grid
│   ├── layout.tsx            # Root layout dengan ThemeProvider
│   └── page.tsx              # Entry point (routing client-side via Zustand)
├── components/
│   ├── shells/               # App shell, parent shell, staff shell
│   ├── views/                # Semua halaman aplikasi
│   │   ├── login-view.tsx
│   │   ├── parent-dashboard.tsx
│   │   ├── parent-documents-list.tsx
│   │   ├── parent-document-preview.tsx
│   │   ├── parent-share-links.tsx
│   │   ├── parent-notifications.tsx
│   │   ├── parent-bahan-guru.tsx       # Bahan daripada guru (PDF/Drive)
│   │   ├── parent-bahan-view.tsx       # Pratonton PDF/embed Drive
│   │   ├── staff-dashboard.tsx
│   │   ├── staff-documents.tsx
│   │   ├── staff-document-create.tsx
│   │   ├── staff-document-edit.tsx
│   │   ├── staff-document-preview.tsx
│   │   ├── staff-share-resources.tsx   # Guru kongsi PDF/Drive
│   │   ├── staff-students.tsx
│   │   ├── staff-guardians.tsx
│   │   ├── staff-classes.tsx
│   │   ├── staff-audit-logs.tsx
│   │   └── share-access-view.tsx       # Akses pautan kongsi dengan PIN
│   ├── ui/                   # Komponen shadcn/ui
│   ├── bento-card.tsx        # Kad bento grid reusable
│   ├── document-markdown.tsx # Renderer markdown → A4
│   ├── school-header.tsx     # Pengepala sekolah untuk dokumen
│   └── school-logo.tsx       # Logo sekolah
├── lib/
│   ├── api.ts                # API client + constants + helpers
│   ├── auth.ts               # Hash PIN, generate token, label mapping
│   ├── db.ts                 # Prisma client singleton
│   ├── session.ts            # Server-side session (cookie)
│   ├── store.ts              # Zustand: session + view router
│   └── utils.ts              # cn() helper
└── hooks/
    └── use-toast.ts

prisma/
├── schema.prisma             # Skema pangkalan data (8 model)
├── seed.ts                   # Data sampel (murid, guardian, staf, dokumen)
└── seed-shared-resources.ts  # Data sampel bahan kongsi guru

public/
├── logo-sekolah.png          # Logo rasmi sekolah
└── uploads/                  # Fail PDF yang dimuat naik guru
```

## Model Data

- **Staff** — staf sekolah (Guru / Penolong Kanan / Kerani / Admin)
- **Guardian** — ibu bapa/penjaga
- **Student** — murid (cth: AF2026001)
- **GuardianStudent** — pautan many-to-many guardian ↔ murid
- **Kelas** — kelas (cth: 5 Ibnu Sina)
- **Dokumen** — dokumen murid (laporan, slip, surat, resit, sijil, dll)
- **DokumenBaca** — rekod dokumen telah dibaca oleh guardian
- **ShareLink** — pautan perkongsian selamat dengan PIN
- **SharedResource** — bahan kongsi guru (PDF upload / Google Drive link)
- **Notifikasi** — notifikasi dalam aplikasi
- **AuditLog** — log audit semua tindakan

## Kategori Dokumen

1. Laporan Kemajuan Murid
2. Slip Keputusan Peperiksaan
3. Surat Pengesahan Murid
4. Surat Edaran Sekolah
5. Resit Yuran
6. Rekod Kehadiran
7. Sijil dan Anugerah
8. Borang Kebenaran/Maklum Balas

## Skrip npm/bun

| Skrip | Penerangan |
|---|---|
| `bun run dev` | Pelayan pembangunan (port 3000) |
| `bun run build` | Build produksi |
| `bun run start` | Pelayan produksi |
| `bun run lint` | Semakan ESLint |
| `bun run db:push` | Push skema Prisma ke pangkalan data |
| `bun run db:generate` | Jana Prisma Client |
| `bun run prisma/seed.ts` | Isi data sampel utama |
| `bun run prisma/seed-shared-resources.ts` | Isi bahan kongsi demo |

## Amaran Keselamatan (Prototaip)

Ini adalah **prototaip dengan pangkalan data dummy**. Untuk pengeluaran sebenar:

- Pengesahan WAJIB di sisi pelayan (bukan cookie client sahaja)
- OTP SMS sebenar (bukan simulasi)
- Pangkalan data pengeluaran (PostgreSQL/MySQL)
- Penyimpanan fail selamat (S3/cloud storage)
- HTTPS dengan sijil SSL
- Audit log dengan retention policy
- Mematuhi Akta Perlindungan Data Peribadi 2010 (PDPA) Malaysia

## Peta Jalan Selepas MVP

- **Fasa 2**: Backend sebenar (Node.js/NestJS + PostgreSQL), OTP SMS sebenar
- **Fasa 3**: Notifikasi WhatsApp/emel, pembayaran yuran dalam talian, PWA
- **Fasa 4**: Integrasi sistem sekolah sedia ada, analitik, pelbagai bahasa

## Lesen

© 2026 Sekolah Rendah Al Furqan Shah Alam. Hak cipta terpelihara.

Dibangunkan menggunakan z.ai (model GLM 5.2).
