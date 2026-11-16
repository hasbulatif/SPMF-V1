#!/bin/bash
# ============================================================
# SPMF - Skrip Setup Pangkalan Data Supabase
# Sekolah Rendah Al Furqan Shah Alam
# ============================================================
#
# Skrip ini akan:
# 1. Jana Prisma Client untuk PostgreSQL
# 2. Push skema ke Supabase (cipta semua jadual)
# 3. Isi data sampel (murid, ibu bapa, staf, dokumen)
#
# KEPERLUAN:
# - Bun atau Node.js terpasang
# - Akses internet ke Supabase (IPv4 atau IPv6)
# - .env dikonfigurasi dengan DATABASE_URL Supabase
#
# CARA GUNA:
#   chmod +x setup-supabase.sh
#   ./setup-supabase.sh
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "============================================================"
echo "  SPMF - Setup Pangkalan Data Supabase"
echo "  Sekolah Rendah Al Furqan Shah Alam"
echo "============================================================"
echo ""

# Semak .env
if [ ! -f .env ]; then
    echo "✗ Fail .env tidak dijumpai."
    echo "  Cipta .env dengan kandungan:"
    echo '  DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?schema=public'
    exit 1
fi

# Papar konfigurasi
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2-)
echo "Pangkalan Data: $(echo $DATABASE_URL | sed 's/.*@\(.*\):.*/\1/')"
echo ""

# Langkah 1: Pasang dependencies
echo "── Langkah 1/4: Pasang dependencies ──"
if command -v bun &> /dev/null; then
    bun install
elif command -v npm &> /dev/null; then
    npm install
else
    echo "✗ Bun atau npm tidak dijumpai."
    exit 1
fi
echo "✓ Dependencies terpasang"
echo ""

# Langkah 2: Jana Prisma Client
echo "── Langkah 2/4: Jana Prisma Client ──"
if command -v bun &> /dev/null; then
    bun run db:generate
else
    npx prisma generate
fi
echo "✓ Prisma Client dijana"
echo ""

# Langkah 3: Push skema ke Supabase
echo "── Langkah 3/4: Push skema ke Supabase ──"
echo "  (Ini akan cipta semua jadual dalam pangkalan data Supabase anda)"
if command -v bun &> /dev/null; then
    bun run db:push
else
    npx prisma db push --accept-data-loss
fi
echo "✓ Skema di-push ke Supabase"
echo ""

# Langkah 4: Isi data sampel
echo "── Langkah 4/4: Isi data sampel ──"
echo "  (4 staf, 6 kelas, 6 ibu bapa, 10 murid, 54 dokumen, 4 bahan kongsi)"
if command -v bun &> /dev/null; then
    bun run prisma/seed.ts
    bun run prisma/seed-shared-resources.ts
else
    npx tsx prisma/seed.ts
    npx tsx prisma/seed-shared-resources.ts
fi
echo "✓ Data sampel diisi"
echo ""

echo "============================================================"
echo "  ✓ SETUP SELESAI!"
echo "============================================================"
echo ""
echo "Pangkalan data Supabase anda kini mempunyai:"
echo "  • 4 akaun staf (Guru, PK, Kerani, Admin)"
echo "  • 6 akaun ibu bapa (3 dengan lebih seorang anak)"
echo "  • 10 murid merentas 6 kelas"
echo "  • 54 dokumen (laporan, slip keputusan, surat, resit, sijil)"
echo "  • 4 bahan kongsi guru (PDF + Google Drive)"
echo ""
echo "Akaun log masuk demo:"
echo "  Ibu Bapa: aisyah.hamid@gmail.com / IbuBapa@Furqan2026"
echo "  Guru:     ahmad.fazil@alfurqan.edu.my / GuruFurqan@2026"
echo "  PK:       noraini.yusof@alfurqan.edu.my / PKFurqan@2026"
echo "  Kerani:   siti.ismail@alfurqan.edu.my / KeraniFurqan@2026"
echo "  Admin:    admin@alfurqan.edu.my / AdminFurqan@2026"
echo ""
echo "Anda boleh jalankan aplikasi dengan: bun run dev (atau npm run dev)"
echo ""
