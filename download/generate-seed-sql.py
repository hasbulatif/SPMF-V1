"""
Jana fail SQL seed untuk Supabase dari data sampel SPMF.
Output: 02-supabase-seed.sql
"""
import json
from datetime import datetime, timedelta
import random
import hashlib

random.seed(42)

# Helper: escape SQL string
def sql_str(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''").replace("\n", "\\n").replace("\r", "") + "'"

# Helper: hash PIN (SHA-256)
def hash_pin(pin):
    return hashlib.sha256(pin.encode()).hexdigest()

# Helper: generate cuid-like ID
import time, secrets
id_counter = 0
def gen_id(prefix="c"):
    global id_counter
    id_counter += 1
    base = secrets.token_hex(12)
    return f"cm{base}{id_counter:06d}"

# ===== DATA =====

# Staff
staff = [
    ("s_staff_01", "Ustaz Ahmad Faizal bin Hassan", "ahmad.fazil@alfurqan.edu.my", "guru123", "GURU", "AF-S-001"),
    ("s_staff_02", "Puan Noraini binti Yusof", "noraini.yusof@alfurqan.edu.my", "pk123", "PENOLONG_KANAN", "AF-S-002"),
    ("s_staff_03", "Puan Siti Khadijah binti Ismail", "siti.ismail@alfurqan.edu.my", "kerani123", "KERANI", "AF-S-003"),
    ("s_staff_04", "Encik Zulkifli bin Rahman", "admin@alfurqan.edu.my", "admin123", "ADMIN", "AF-S-004"),
]

# Kelas
kelas_data = [
    ("c_kelas_01", "1 Al Bukhari", 1, "s_staff_01"),
    ("c_kelas_02", "2 Al Ghazali", 2, "s_staff_01"),
    ("c_kelas_03", "3 Al Farabi", 3, "s_staff_01"),
    ("c_kelas_04", "4 Al Khawarizmi", 4, "s_staff_02"),
    ("c_kelas_05", "5 Ibnu Sina", 5, "s_staff_01"),
    ("c_kelas_06", "6 Ibnu Rushd", 6, "s_staff_02"),
]
kelas_by_nama = {k[1]: k[0] for k in kelas_data}

# Guardians
guardians = [
    ("g_guard_01", "Aisyah binti Hamid", "aisyah.hamid@gmail.com", "0123456789", "ibu123", "IBU"),
    ("g_guard_02", "Razif bin Othman", "razif.othman@gmail.com", "0129876543", "bapa123", "BAPA"),
    ("g_guard_03", "Fatimah binti Abdullah", "fatimah.abdullah@gmail.com", "0135678901", "ibu123", "IBU"),
    ("g_guard_04", "Hasni bin Mohamed", "hasni.mohamed@gmail.com", "0144567890", "bapa123", "BAPA"),
    ("g_guard_05", "Norhayati binti Salleh", "norhayati.salleh@gmail.com", "0156789012", "ibu123", "IBU"),
    ("g_guard_06", "Kamal bin Ismail", "kamal.ismail@gmail.com", "0167890123", "bapa123", "BAPA"),
]

# Students
students = [
    ("st_mur_01", "AF2026001", "Ahmad Danish bin Razif", 1, "c_kelas_01", "L", "200109-14-0123"),
    ("st_mur_02", "AF2026002", "Sofia Nur Aisyah binti Hasni", 1, "c_kelas_01", "P", "200210-08-0345"),
    ("st_mur_03", "AF2026003", "Yusuf bin Kamal", 2, "c_kelas_02", "L", "190315-14-0567"),
    ("st_mur_04", "AF2026004", "Khadijah binti Mohd", 3, "c_kelas_03", "P", "180420-08-0789"),
    ("st_mur_05", "AF2026005", "Muhammad Ali bin Saiful", 4, "c_kelas_04", "L", "170525-14-0901"),
    ("st_mur_06", "AF2026006", "Aisyah Nur binti Razif", 5, "c_kelas_05", "P", "160630-08-1123"),
    ("st_mur_07", "AF2026007", "Hamzah bin Osman", 5, "c_kelas_05", "L", "160712-14-1345"),
    ("st_mur_08", "AF2026008", "Maryam binti Hasan", 5, "c_kelas_05", "P", "160801-08-1567"),
    ("st_mur_09", "AF2026009", "Zayyan bin Yusof", 6, "c_kelas_06", "L", "150915-14-1789"),
    ("st_mur_10", "AF2026010", "Hana Batrisyia binti Lan", 6, "c_kelas_06", "P", "151022-08-2011"),
]
student_by_idmurid = {s[1]: s[0] for s in students}

# Guardian-Student links
gs_links = [
    ("g_guard_01", "st_mur_01", True),   # Aisyah -> Ahmad Danish
    ("g_guard_01", "st_mur_06", False),  # Aisyah -> Aisyah Nur
    ("g_guard_02", "st_mur_06", True),   # Razif -> Aisyah Nur
    ("g_guard_03", "st_mur_03", True),   # Fatimah -> Yusuf
    ("g_guard_03", "st_mur_04", True),   # Fatimah -> Khadijah
    ("g_guard_04", "st_mur_02", True),   # Hasni -> Sofia
    ("g_guard_05", "st_mur_07", True),   # Norhayati -> Hamzah
    ("g_guard_06", "st_mur_05", True),   # Kamal -> Muhammad Ali
    ("g_guard_06", "st_mur_09", False),  # Kamal -> Zayyan
]

# Document templates
TAHUN_SEKOLAH = 2026

def laporan_kemajuan(student, penggal):
    return f"""# LAPORAN KEMAJUAN MURID\\n\\n**Sekolah Rendah Al Furqan Shah Alam**\\n\\n| Butiran | Maklumat |\\n|---|---|\\n| Nama Murid | {student[2]} |\\n| No. Pendaftaran | {student[1]} |\\n| Tahun | {student[3]} |\\n| Penggal | {penggal} |\\n| Tahun Sekolah | {TAHUN_SEKOLAH} |\\n\\n## Ulasan Akademik\\n\\nMurid menunjukkan kemajuan yang memberansangkan sepanjang Penggal {penggal}. Pencapaian dalam subjek utama berada pada tahap baik.\\n\\n## Ulasan Tahfiz & Jawi\\n\\nHafazan surah-surah pendek dan penulisan jawi menunjukkan peningkatan ketara.\\n\\n## Ulasan Sahsiah\\n\\nMurid berdisiplin, hormat kepada guru dan mesra dengan rakan.\\n\\n## Cadangan\\n\\n1. Galakkan murid membaca sekurang-kurangnya 15 minit sehari.\\n2. Latih tubi tambahan untuk matematik asas.\\n\\n---\\n\\n**Guru Kelas:** Ustaz Ahmad Faizal bin Hassan\\n**Tarikh Laporan:** {datetime.now().strftime('%d/%m/%Y')}"""

def slip_keputusan(student, penggal):
    bm = 80 + int(penggal) * 3
    bi = 75 + int(penggal) * 2
    mt = 78 + int(penggal)
    sn = 82 + int(penggal) * 2
    return f"""# SLIP KEPUTUSAN PEPERIKSAAN\\n\\n**Sekolah Rendah Al Furqan Shah Alam**\\n\\n| Butiran | Maklumat |\\n|---|---|\\n| Nama Murid | {student[2]} |\\n| No. Pendaftaran | {student[1]} |\\n| Tahun / Penggal | {student[3]} / Penggal {penggal} |\\n\\n## Keputusan Peperiksaan Penggal {penggal}\\n\\n| Subjek | Markah | Gred |\\n|---|---|---|\\n| Bahasa Melayu | {bm} | A |\\n| Bahasa Inggeris | {bi} | A- |\\n| Matematik | {mt} | A |\\n| Sains | {sn} | A |\\n| Pendidikan Islam | 88 | A |\\n| Bahasa Arab | 80 | A |\\n| Jawi & Tulisan | 85 | A |\\n| Tahfiz Al-Quran | 90 | A |\\n\\n## Kedudukan Kelas: 3 / 28\\n\\n---\\n\\n**Disahkan oleh:** Puan Noraini binti Yusof\\n**Penolong Kanan**"""

def surat_pengesahan(student):
    return f"""# SURAT PENGESAHAN MURID\\n\\n**SEKOLAH RENDAH AL FURQAN SHAH ALAM**\\nNo. Rujukan: AF/{student[1]}/{TAHUN_SEKOLAH}\\n\\nSukacita dimaklumkan bahawa murid berikut adalah pelajar Sekolah Rendah Al Furqan Shah Alam:\\n\\n| Butiran | Maklumat |\\n|---|---|\\n| Nama | {student[2]} |\\n| No. Pendaftaran | {student[1]} |\\n| Tahun | Tahun {student[3]} |\\n| Status | AKTIF |\\n\\nSurat ini dikeluarkan untuk tujuan rujukan ibu bapa / penjaga.\\n\\nSekian, terima kasih.\\n\\n**Pengetua**\\nSekolah Rendah Al Furqan Shah Alam"""

def resit_yuran(student, penggal):
    return f"""# RESIT YURAN SEKOLAH\\n\\n**SEKOLAH RENDAH AL FURQAN SHAH ALAM**\\nResit No: Y/{student[1]}/{TAHUN_SEKOLAH}/P{penggal}\\n\\n| Butiran | Maklumat |\\n|---|---|\\n| Nama Murid | {student[2]} |\\n| No. Pendaftaran | {student[1]} |\\n| Penggal | {penggal} |\\n\\n## Butiran Bayaran\\n\\n| Perkara | Amaun (RM) |\\n|---|---|\\n| Yuran Penggal | 250.00 |\\n| Yuran PIBG | 50.00 |\\n| Yuran Majlis Tilawah | 20.00 |\\n| **Jumlah** | **320.00** |\\n\\nBayaran telah diterima dengan jelas.\\n\\n**Kerani Pejabat:** Puan Siti Khadijah binti Ismail"""

def rekod_kehadiran(student, penggal):
    hadir = 56 - int(penggal)
    total = 60
    return f"""# REKOD KEHADIRAN MURID\\n\\n**SEKOLAH RENDAH AL FURQAN SHAH ALAM**\\n\\n| Butiran | Maklumat |\\n|---|---|\\n| Nama Murid | {student[2]} |\\n| No. Pendaftaran | {student[1]} |\\n| Penggal | {penggal} |\\n\\n## Ringkasan Kehadiran\\n\\n| Perkara | Hari |\\n|---|---|\\n| Hari Sekolah | {total} |\\n| Hadir | {hadir} |\\n| Tidak Hadir (Sah) | {2 + int(penggal)} |\\n| Tidak Hadir (Tidak Sah) | {1 + int(penggal)} |\\n| Peratus Kehadiran | {round(hadir/total*100)}% |\\n\\n---\\n\\n**Guru Kelas:** Ustaz Ahmad Faizal bin Hassan"""

def sijil(student, tajuk):
    return f"""# SIJIL {tajuk.upper()}\\n\\n**SEKOLAH RENDAH AL FURQAN SHAH ALAM**\\n\\nDengan ini sesungguhnya mengurniakan Sijil {tajuk} kepada:\\n\\n## {student[2]}\\n\\n(No. Pendaftaran: {student[1]})\\n\\natas pencapaian cemerlang dalam {tajuk} anjuran Sekolah Rendah Al Furqan Shah Alam pada tahun {TAHUN_SEKOLAH}.\\n\\n**Pengetua**\\nSekolah Rendah Al Furqan Shah Alam"""

def borang(student, tajuk):
    return f"""# {tajuk.upper()}\\n\\n**SEKOLAH RENDAH AL FURQAN SHAH ALAM**\\n\\n## Maklumat Murid\\n\\n| Butiran | Maklumat |\\n|---|---|\\n| Nama | {student[2]} |\\n| No. Pendaftaran | {student[1]} |\\n| Tahun | {student[3]} |\\n\\nSaya mengaku bahawa maklumat di atas adalah benar.\\n\\n**Tandatangan Ibu Bapa / Penjaga:** _______________________\\n\\n**Tarikh:** _______________________"""

def surat_edaran(tajuk, kelas_nama):
    return f"""# SURAT EDARAN SEKOLAH\\n\\n**SEKOLAH RENDAH AL FURQAN SHAH ALAM**\\nTahun Sekolah {TAHUN_SEKOLAH}\\n\\n## {tajuk}\\n\\nKepada ibu bapa / penjaga murid **{kelas_nama}**, dimaklumkan perkara berikut:\\n\\n1. Tarikh: seperti tertera.\\n2. Tempat: Sekolah Rendah Al Furqan Shah Alam.\\n3. Kehadiran murid dan waris adalah diwajibkan.\\n\\nSekiranya terdapat pertanyaan, sila hubungi pejabat sekolah di 03-5512 3456.\\n\\nTerima kasih.\\n\\n**Pihak Sekolah**"""

# Generate SQL
sql_lines = []
sql_lines.append("-- ============================================================")
sql_lines.append("-- SPMF Seed Data untuk Supabase PostgreSQL")
sql_lines.append("-- Sekolah Rendah Al Furqan Shah Alam")
sql_lines.append("-- ============================================================")
sql_lines.append("")
sql_lines.append("-- Bersihkan data sedia ada (ikut urutan dependency)")
sql_lines.append("DELETE FROM \"AuditLog\";")
sql_lines.append("DELETE FROM \"Notifikasi\";")
sql_lines.append("DELETE FROM \"ShareLink\";")
sql_lines.append("DELETE FROM \"DokumenBaca\";")
sql_lines.append("DELETE FROM \"SharedResource\";")
sql_lines.append("DELETE FROM \"Dokumen\";")
sql_lines.append("DELETE FROM \"GuardianStudent\";")
sql_lines.append("DELETE FROM \"Student\";")
sql_lines.append("DELETE FROM \"Kelas\";")
sql_lines.append("DELETE FROM \"Guardian\";")
sql_lines.append("DELETE FROM \"Staff\";")
sql_lines.append("DELETE FROM \"_KelasGuru\";")
sql_lines.append("")

# Staff
sql_lines.append("-- ===== STAF =====")
for s in staff:
    sql_lines.append(
        f'INSERT INTO "Staff" ("id","nama","emel","password","peranan","noPekerja","createdAt","updatedAt") '
        f'VALUES ({sql_str(s[0])},{sql_str(s[1])},{sql_str(s[2])},{sql_str(s[3])},{sql_str(s[4])},{sql_str(s[5])},NOW(),NOW());'
    )
sql_lines.append("")

# Kelas
sql_lines.append("-- ===== KELAS =====")
for k in kelas_data:
    sql_lines.append(
        f'INSERT INTO "Kelas" ("id","nama","tahun","guruKelasId") '
        f'VALUES ({sql_str(k[0])},{sql_str(k[1])},{k[2]},{sql_str(k[3])});'
    )
sql_lines.append("")

# Guardians
sql_lines.append("-- ===== IBU BAPA =====")
for g in guardians:
    sql_lines.append(
        f'INSERT INTO "Guardian" ("id","nama","emel","noTelefon","password","hubungan","status","createdAt","updatedAt") '
        f'VALUES ({sql_str(g[0])},{sql_str(g[1])},{sql_str(g[2])},{sql_str(g[3])},{sql_str(g[4])},{sql_str(g[5])},\'AKTIF\',NOW(),NOW());'
    )
sql_lines.append("")

# Students
sql_lines.append("-- ===== MURID =====")
for s in students:
    sql_lines.append(
        f'INSERT INTO "Student" ("id","idMurid","nama","tahun","kelasId","jantina","status","noKP","createdAt","updatedAt") '
        f'VALUES ({sql_str(s[0])},{sql_str(s[1])},{sql_str(s[2])},{s[3]},{sql_str(s[4])},{sql_str(s[5])},\'AKTIF\',{sql_str(s[6])},NOW(),NOW());'
    )
sql_lines.append("")

# GuardianStudent
sql_lines.append("-- ===== Pautan Guardian-Student =====")
for gs in gs_links:
    sql_lines.append(
        f'INSERT INTO "GuardianStudent" ("guardianId","studentId","isPrimary") '
        f'VALUES ({sql_str(gs[0])},{sql_str(gs[1])},{str(gs[2]).lower()});'
    )
sql_lines.append("")

# Documents
sql_lines.append("-- ===== DOKUMEN =====")
doc_id_counter = 0
doc_ids = []

for s in students:
    # Laporan kemajuan P1
    doc_id_counter += 1
    doc_id = f"d_doc_{doc_id_counter:03d}"
    doc_ids.append(doc_id)
    days_ago = random.randint(1, 60)
    sql_lines.append(
        f'INSERT INTO "Dokumen" ("id","studentId","kategori","tajuk","penggal","tahun","tarikh","status","kandungan","diterbitOlehId","createdAt","updatedAt") '
        f'VALUES ({sql_str(doc_id)},{sql_str(s[0])},\'LAPORAN_KEMAJUAN\',{sql_str(f"Laporan Kemajuan Penggal 1 {TAHUN_SEKOLAH}")},\'1\',{TAHUN_SEKOLAH},NOW() - INTERVAL \'{days_ago} days\',\'DITERBITKAN\',{sql_str(laporan_kemajuan(s, "1"))},{sql_str("s_staff_02")},NOW(),NOW());'
    )
    # Laporan kemajuan P2
    doc_id_counter += 1
    doc_id = f"d_doc_{doc_id_counter:03d}"
    doc_ids.append(doc_id)
    sql_lines.append(
        f'INSERT INTO "Dokumen" ("id","studentId","kategori","tajuk","penggal","tahun","tarikh","status","kandungan","diterbitOlehId","createdAt","updatedAt") '
        f'VALUES ({sql_str(doc_id)},{sql_str(s[0])},\'LAPORAN_KEMAJUAN\',{sql_str(f"Laporan Kemajuan Penggal 2 {TAHUN_SEKOLAH}")},\'2\',{TAHUN_SEKOLAH},NOW() - INTERVAL \'{random.randint(1,30)} days\',\'DITERBITKAN\',{sql_str(laporan_kemajuan(s, "2"))},{sql_str("s_staff_02")},NOW(),NOW());'
    )
    # Slip keputusan P1
    doc_id_counter += 1
    doc_id = f"d_doc_{doc_id_counter:03d}"
    doc_ids.append(doc_id)
    sql_lines.append(
        f'INSERT INTO "Dokumen" ("id","studentId","kategori","tajuk","penggal","tahun","tarikh","status","kandungan","diterbitOlehId","createdAt","updatedAt") '
        f'VALUES ({sql_str(doc_id)},{sql_str(s[0])},\'SLIP_KEPUTUSAN\',{sql_str(f"Slip Keputusan Penggal 1 {TAHUN_SEKOLAH}")},\'1\',{TAHUN_SEKOLAH},NOW() - INTERVAL \'{random.randint(1,30)} days\',\'DITERBITKAN\',{sql_str(slip_keputusan(s, "1"))},{sql_str("s_staff_02")},NOW(),NOW());'
    )
    # Slip keputusan P2 (SEMAKAN status)
    doc_id_counter += 1
    doc_id = f"d_doc_{doc_id_counter:03d}"
    doc_ids.append(doc_id)
    sql_lines.append(
        f'INSERT INTO "Dokumen" ("id","studentId","kategori","tajuk","penggal","tahun","tarikh","status","kandungan","diterbitOlehId","createdAt","updatedAt") '
        f'VALUES ({sql_str(doc_id)},{sql_str(s[0])},\'SLIP_KEPUTUSAN\',{sql_str(f"Slip Keputusan Penggal 2 {TAHUN_SEKOLAH}")},\'2\',{TAHUN_SEKOLAH},NOW() - INTERVAL \'{random.randint(1,15)} days\',\'SEMAKAN\',{sql_str(slip_keputusan(s, "2"))},{sql_str("s_staff_02")},NOW(),NOW());'
    )

# Additional documents
extra_docs = [
    # (studentId, kategori, tajuk, penggal, status, fn, fn_arg)
    ("st_mur_01", "SURAT_PENGESAHAN", f"Surat Pengesahan Murid {TAHUN_SEKOLAH}", None, "DITERBITKAN", surat_pengesahan, None),
    ("st_mur_06", "SURAT_PENGESAHAN", f"Surat Pengesahan Murid {TAHUN_SEKOLAH}", None, "DITERBITKAN", surat_pengesahan, None),
    ("st_mur_01", "RESIT_YURAN", f"Resit Yuran Penggal 1 {TAHUN_SEKOLAH}", "1", "DITERBITKAN", resit_yuran, "1"),
    ("st_mur_01", "RESIT_YURAN", f"Resit Yuran Penggal 2 {TAHUN_SEKOLAH}", "2", "DITERBITKAN", resit_yuran, "2"),
    ("st_mur_06", "RESIT_YURAN", f"Resit Yuran Penggal 1 {TAHUN_SEKOLAH}", "1", "DITERBITKAN", resit_yuran, "1"),
    ("st_mur_03", "REKOD_KEHADIRAN", f"Rekod Kehadiran Penggal 1 {TAHUN_SEKOLAH}", "1", "DITERBITKAN", rekod_kehadiran, "1"),
    ("st_mur_03", "REKOD_KEHADIRAN", f"Rekod Kehadiran Penggal 2 {TAHUN_SEKOLAH}", "2", "DITERBITKAN", rekod_kehadiran, "2"),
    ("st_mur_05", "SIJIL", "Sijil Pelajar Cemerlang", None, "DITERBITKAN", sijil, "Pelajar Cemerlang"),
    ("st_mur_07", "SIJIL", "Sijil Tahfiz", None, "DITERBITKAN", sijil, "Tahfiz Al-Quran"),
    ("st_mur_06", "SIJIL", "Sijil Penyertaan Pertandingan", None, "DITERBITKAN", sijil, "Penyertaan Khemah Ibadah"),
    ("st_mur_01", "BORANG", "Borang Kebenaran Aktiviti Kokurikulum", None, "DITERBITKAN", borang, "Borang Kebenaran Aktiviti Kokurikulum"),
    ("st_mur_06", "BORANG", "Borang Maklum Balas Ibu Bapa", None, "DRAFT", borang, "Borang Maklum Balas Ibu Bapa"),
]

for ed in extra_docs:
    doc_id_counter += 1
    doc_id = f"d_doc_{doc_id_counter:03d}"
    doc_ids.append(doc_id)
    student = next(s for s in students if s[0] == ed[0])
    fn = ed[5]
    fn_arg = ed[6]
    if fn_arg is not None:
        kandungan = fn(student, fn_arg)
    else:
        kandungan = fn(student)
    penggal_val = sql_str(ed[3]) if ed[3] else "NULL"
    sql_lines.append(
        f'INSERT INTO "Dokumen" ("id","studentId","kategori","tajuk","penggal","tahun","tarikh","status","kandungan","diterbitOlehId","createdAt","updatedAt") '
        f'VALUES ({sql_str(doc_id)},{sql_str(ed[0])},{sql_str(ed[1])},{sql_str(ed[2])},{penggal_val},{TAHUN_SEKOLAH},NOW() - INTERVAL \'{random.randint(1,30)} days\',{sql_str(ed[4])},{sql_str(kandungan)},{sql_str("s_staff_02")},NOW(),NOW());'
    )

# Surat edaran kelas
doc_id_counter += 1
doc_id = f"d_doc_{doc_id_counter:03d}"
doc_ids.append(doc_id)
sql_lines.append(
    f'INSERT INTO "Dokumen" ("id","studentId","kategori","tajuk","penggal","tahun","tarikh","status","kandungan","diterbitOlehId","kelasId","createdAt","updatedAt") '
    f'VALUES ({sql_str(doc_id)},{sql_str("st_mur_01")},\'SURAT_EDARAN\',{sql_str("Surat Edaran: Sambutan Maulidur Rasul")},NULL,{TAHUN_SEKOLAH},NOW() - INTERVAL \'5 days\',\'DITERBITKAN\',{sql_str(surat_edaran("Sambutan Maulidur Rasul", "1 Al Bukhari"))},{sql_str("s_staff_02")},{sql_str("c_kelas_01")},NOW(),NOW());'
)

sql_lines.append("")

# SharedResources
sql_lines.append("-- ===== BAHAN KONGSI GURU =====")
shared_resources = [
    ("Nota Panduan Solat Subuh", "Nota ringkas untuk ibu bapa membimbing anak solat Subuh di rumah.", "PDF_UPLOAD", "/uploads/demo-nota-solat.pdf", "nota-panduan-solat.pdf", None, None, "st_mur_01", "c_kelas_01"),
    ("Jadual Waktu Sekolah Kelas 1 Al Bukhari", "Jadual waktu persekolahan untuk Penggal 2 2026.", "PDF_UPLOAD", "/uploads/demo-nota-solat.pdf", "jadual-waktu-1-bukhari.pdf", None, None, None, "c_kelas_01"),
    ("Video Panduan Hafazan Surah Al-Mulk", "Video panduan hafazan yang disimpan di Google Drive.", "GOOGLE_DRIVE", None, None, "https://drive.google.com/file/d/1bvXjMsC9w5WGPpCPYKqCpTk5YJ2m0WQT/view", "https://drive.google.com/file/d/1bvXjMsC9w5WGPpCPYKqCpTk5YJ2m0WQT/preview", None, "c_kelas_05"),
    ("Latihan Tambahan Matematik Tahun 5", "Set latihan tambahan untuk persiapan peperiksaan akhir tahun.", "PDF_UPLOAD", "/uploads/demo-nota-solat.pdf", "latihan-matematik-tahun5.pdf", None, None, "st_mur_06", "c_kelas_05"),
]

for i, sr in enumerate(shared_resources):
    sr_id = f"sr_res_{i+1:03d}"
    fail_url = sql_str(sr[3]) if sr[3] else "NULL"
    fail_name = sql_str(sr[4]) if sr[4] else "NULL"
    google_url = sql_str(sr[5]) if sr[5] else "NULL"
    google_preview = sql_str(sr[6]) if sr[6] else "NULL"
    student_id = sql_str(sr[7]) if sr[7] else "NULL"
    kelas_id = sql_str(sr[8]) if sr[8] else "NULL"
    sql_lines.append(
        f'INSERT INTO "SharedResource" ("id","staffId","tajuk","keterangan","jenis","failUrl","failName","googleUrl","googlePreviewUrl","studentId","kelasId","createdAt","updatedAt") '
        f'VALUES ({sql_str(sr_id)},{sql_str("s_staff_01")},{sql_str(sr[0])},{sql_str(sr[1])},{sql_str(sr[2])},{fail_url},{fail_name},{google_url},{google_preview},{student_id},{kelas_id},NOW(),NOW());'
    )

sql_lines.append("")

# Notifications
sql_lines.append("-- ===== NOTIFIKASI =====")
notif_counter = 0
for g in guardians:
    # Find students for this guardian
    guardian_students = [gs for gs in gs_links if gs[0] == g[0]]
    for gs in guardian_students:
        student = next(s for s in students if s[0] == gs[1])
        # Get published docs for this student
        student_docs = [d for d in doc_ids[:40]]  # first 40 docs
        for doc_id in student_docs[:3]:
            notif_counter += 1
            sql_lines.append(
                f'INSERT INTO "Notifikasi" ("id","guardianId","documentId","jenis","mesej","dibaca","createdAt") '
                f'VALUES ({sql_str(f"n_notif_{notif_counter:03d}")},{sql_str(g[0])},{sql_str(doc_id)},\'DOKUMEN_BAHARU\',{sql_str(f"Dokumen baharu untuk {student[2]}")},false,NOW() - INTERVAL \'{random.randint(0,7)} days\');'
            )

sql_lines.append("")

# ShareLink (sample)
sql_lines.append("-- ===== SHARE LINK CONTOH =====")
sql_lines.append(
    f'INSERT INTO "ShareLink" ("id","documentId","guardianId","token","pinHash","tarikhLuput","bilanganAkses","hadAkses","dibatalkan","cubaanGagal","dikunci","createdAt") '
    f'VALUES ({sql_str("sl_link_001")},{sql_str(doc_ids[0])},{sql_str("g_guard_01")},{sql_str("spmf-sample-demo123")},{sql_str(hash_pin("123456"))},NOW() + INTERVAL \'7 days\',0,20,false,0,false,NOW());'
)

sql_lines.append("")

# AuditLog
sql_lines.append("-- ===== AUDIT LOG =====")
sql_lines.append(
    f'INSERT INTO "AuditLog" ("id","staffId","userType","namaUser","tindakan","metadata","masa") '
    f'VALUES ({sql_str("al_log_001")},{sql_str("s_staff_04")},\'STAFF\',{sql_str("Encik Zulkifli bin Rahman")},\'SISTEM_INIT\',{sql_str("Pangkalan data Supabase SPMF dikemas kini dengan data sampel.")},NOW());'
)

sql_lines.append("")
sql_lines.append("-- ===== SEED SELESAI =====")
sql_lines.append(f"-- Total: 4 staf, 6 kelas, 6 ibu bapa, 10 murid, {doc_id_counter+1} dokumen, 4 bahan kongsi")
sql_lines.append("-- Akaun demo:")
sql_lines.append("--   Ibu Bapa: aisyah.hamid@gmail.com / ibu123")
sql_lines.append("--   Guru: ahmad.fazil@alfurqan.edu.my / guru123")
sql_lines.append("--   Penolong Kanan: noraini.yusof@alfurqan.edu.my / pk123")
sql_lines.append("--   Kerani: siti.ismail@alfurqan.edu.my / kerani123")
sql_lines.append("--   Admin: admin@alfurqan.edu.my / admin123")

# Write to file
output_path = "/home/z/my-project/download/02-supabase-seed.sql"
with open(output_path, "w") as f:
    f.write("\n".join(sql_lines))

print(f"✓ SQL seed dijana: {output_path}")
print(f"  {len(sql_lines)} baris SQL")
print(f"  {doc_id_counter+1} dokumen")
