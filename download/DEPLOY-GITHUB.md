# Cara Deploy SPMF ke GitHub

Repo target: https://github.com/hasbulatif/SPMF-V1.git

## Pilihan 1: Push automatik dengan Personal Access Token (PAT)

### Langkah 1: Jana PAT di GitHub

1. Pergi ke **https://github.com/settings/tokens**
2. Klik **"Generate new token (classic)"**
3. Beri nama token (cth: "SPMF Deploy")
4. Tandai scope **"repo"** (penuh - termasuk sub-options)
5. Klik **"Generate token"** di bawah
6. **Salin token** (format: `ghp_xxxxxxxxxxxxxxxxxxxx`) - anda tidak akan nampak lagi selepas ini

### Langkah 2: Jalankan skrip push

```bash
cd /home/z/my-project/download
python3 push-to-github.py
```

Atau lulus token terus:

```bash
python3 push-to-github.py --token ghp_xxxxxxxxxxxxxxxxxxxx
```

Skrip akan push semua kod + git history ke branch `main` repo anda.

**Token TIDAK disimpan** - hanya digunakan sekali untuk push.

---

## Pilihan 2: Clone dari git bundle (offline)

Jika anda mahu push dari komputer anda sendiri:

### Langkah 1: Download fail bundle

Download fail `SPMF-V1.bundle` (696 KB) dari folder `download/`.

### Langkah 2: Clone dari bundle

```bash
git clone SPMF-V1.bundle SPMF-V1
cd SPMF-V1
```

### Langkah 3: Tukar remote ke GitHub & push

```bash
git remote remove origin
git remote add origin https://github.com/hasbulatif/SPMF-V1.git
git push -u origin main
```

Git akan minta username & password GitHub. 
- **Username**: username GitHub anda
- **Password**: Personal Access Token (PAT), BUKAN password biasa

---

## Pilihan 3: Download ZIP & push manual

### Langkah 1: Download ZIP projek

Download fail ZIP dari folder ini.

### Langkah 2: Extract & init git

```bash
unzip SPMF-V1.zip -d SPMF-V1
cd SPMF-V1
git init
git add -A
git commit -m "SPMF v1.0: Sistem Pengurusan Murid Al Furqan"
git branch -M main
git remote add origin https://github.com/hasbulatif/SPMF-V1.git
git push -u origin main
```

---

## Selepas Push

Selepas kod di GitHub, sesiapa sahaja boleh clone dan jalankan:

```bash
git clone https://github.com/hasbulatif/SPMF-V1.git
cd SPMF-V1
bun install        # atau npm install
bun run db:generate
bun run db:push
bun run prisma/seed.ts
bun run dev
```

Buka `http://localhost:3000` dalam pelayar.

Lihat `README.md` untuk akaun demo dan panduan penuh.
