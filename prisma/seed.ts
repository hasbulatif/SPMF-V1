import { db } from '../src/lib/db'
import { hashPin } from '../src/lib/auth'

async function main() {
  // Bersihkan data sedia ada
  await db.auditLog.deleteMany()
  await db.notifikasi.deleteMany()
  await db.shareLink.deleteMany()
  await db.dokumenBaca.deleteMany()
  await db.dokumen.deleteMany()
  await db.guardianStudent.deleteMany()
  await db.student.deleteMany()
  await db.kelas.deleteMany()
  await db.guardian.deleteMany()
  await db.staff.deleteMany()

  // ===== STAF =====
  const ustazAhmad = await db.staff.create({
    data: {
      nama: 'Ustaz Ahmad Faizal bin Hassan',
      emel: 'ahmad.fazil@alfurqan.edu.my',
      password: 'guru123',
      peranan: 'GURU',
      noPekerja: 'AF-S-001',
    },
  })

  const pnNoraini = await db.staff.create({
    data: {
      nama: 'Puan Noraini binti Yusof',
      emel: 'noraini.yusof@alfurqan.edu.my',
      password: 'pk123',
      peranan: 'PENOLONG_KANAN',
      noPekerja: 'AF-S-002',
    },
  })

  const pnSiti = await db.staff.create({
    data: {
      nama: 'Puan Siti Khadijah binti Ismail',
      emel: 'siti.ismail@alfurqan.edu.my',
      password: 'kerani123',
      peranan: 'KERANI',
      noPekerja: 'AF-S-003',
    },
  })

  const enZulkifli = await db.staff.create({
    data: {
      nama: 'Encik Zulkifli bin Rahman',
      emel: 'admin@alfurqan.edu.my',
      password: 'admin123',
      peranan: 'ADMIN',
      noPekerja: 'AF-S-004',
    },
  })

  // ===== KELAS =====
  const kelasData = [
    { nama: '1 Al Bukhari', tahun: 1, guruKelasId: ustazAhmad.id },
    { nama: '2 Al Ghazali', tahun: 2, guruKelasId: ustazAhmad.id },
    { nama: '3 Al Farabi', tahun: 3, guruKelasId: ustazAhmad.id },
    { nama: '4 Al Khawarizmi', tahun: 4, guruKelasId: pnNoraini.id },
    { nama: '5 Ibnu Sina', tahun: 5, guruKelasId: ustazAhmad.id },
    { nama: '6 Ibnu Rushd', tahun: 6, guruKelasId: pnNoraini.id },
  ]

  const kelas = await Promise.all(
    kelasData.map((k) => db.kelas.create({ data: k }))
  )
  const kelasByNama: Record<string, typeof kelas[number]> = {}
  kelas.forEach((k) => (kelasByNama[k.nama] = k))

  // ===== IBU BAPA / PENJAGA =====
  const guardiansData = [
    {
      nama: 'Aisyah binti Hamid',
      emel: 'aisyah.hamid@gmail.com',
      noTelefon: '0123456789',
      password: 'ibu123',
      hubungan: 'IBU',
    },
    {
      nama: 'Razif bin Othman',
      emel: 'razif.othman@gmail.com',
      noTelefon: '0129876543',
      password: 'bapa123',
      hubungan: 'BAPA',
    },
    {
      nama: 'Fatimah binti Abdullah',
      emel: 'fatimah.abdullah@gmail.com',
      noTelefon: '0135678901',
      password: 'ibu123',
      hubungan: 'IBU',
    },
    {
      nama: 'Hasni bin Mohamed',
      emel: 'hasni.mohamed@gmail.com',
      noTelefon: '0144567890',
      password: 'bapa123',
      hubungan: 'BAPA',
    },
    {
      nama: 'Norhayati binti Salleh',
      emel: 'norhayati.salleh@gmail.com',
      noTelefon: '0156789012',
      password: 'ibu123',
      hubungan: 'IBU',
    },
    {
      nama: 'Kamal bin Ismail',
      emel: 'kamal.ismail@gmail.com',
      noTelefon: '0167890123',
      password: 'bapa123',
      hubungan: 'BAPA',
    },
  ]

  const guardians = await Promise.all(
    guardiansData.map((g) => db.guardian.create({ data: g }))
  )
  const [aisyah, razif, fatimah, hasni, norhayati, kamal] = guardians

  // ===== MURID (10 murid merentas 6 kelas) =====
  const studentsData = [
    // Tahun 1 Al Bukhari
    { idMurid: 'AF2026001', nama: 'Ahmad Danish bin Razif', tahun: 1, kelasId: kelasByNama['1 Al Bukhari'].id, jantina: 'L', noKP: '200109-14-0123' },
    { idMurid: 'AF2026002', nama: 'Sofia Nur Aisyah binti Hasni', tahun: 1, kelasId: kelasByNama['1 Al Bukhari'].id, jantina: 'P', noKP: '200210-08-0345' },
    // Tahun 2 Al Ghazali
    { idMurid: 'AF2026003', nama: 'Yusuf bin Kamal', tahun: 2, kelasId: kelasByNama['2 Al Ghazali'].id, jantina: 'L', noKP: '190315-14-0567' },
    // Tahun 3 Al Farabi
    { idMurid: 'AF2026004', nama: 'Khadijah binti Mohd', tahun: 3, kelasId: kelasByNama['3 Al Farabi'].id, jantina: 'P', noKP: '180420-08-0789' },
    // Tahun 4 Al Khawarizmi
    { idMurid: 'AF2026005', nama: 'Muhammad Ali bin Saiful', tahun: 4, kelasId: kelasByNama['4 Al Khawarizmi'].id, jantina: 'L', noKP: '170525-14-0901' },
    // Tahun 5 Ibnu Sina
    { idMurid: 'AF2026006', nama: 'Aisyah Nur binti Razif', tahun: 5, kelasId: kelasByNama['5 Ibnu Sina'].id, jantina: 'P', noKP: '160630-08-1123' },
    { idMurid: 'AF2026007', nama: 'Hamzah bin Osman', tahun: 5, kelasId: kelasByNama['5 Ibnu Sina'].id, jantina: 'L', noKP: '160712-14-1345' },
    { idMurid: 'AF2026008', nama: 'Maryam binti Hasan', tahun: 5, kelasId: kelasByNama['5 Ibnu Sina'].id, jantina: 'P', noKP: '160801-08-1567' },
    // Tahun 6 Ibnu Rushd
    { idMurid: 'AF2026009', nama: 'Zayyan bin Yusof', tahun: 6, kelasId: kelasByNama['6 Ibnu Rushd'].id, jantina: 'L', noKP: '150915-14-1789' },
    { idMurid: 'AF2026010', nama: 'Hana Batrisyia binti Lan', tahun: 6, kelasId: kelasByNama['6 Ibnu Rushd'].id, jantina: 'P', noKP: '151022-08-2011' },
  ]

  const students = await Promise.all(
    studentsData.map((s) => db.student.create({ data: s }))
  )
  const sById: Record<string, typeof students[number]> = {}
  students.forEach((s) => (sById[s.idMurid] = s))

  // ===== Pautan Guardian-Student =====
  // Aisyah: 2 anak (Ahmad Danish T1 & Aisyah Nur T5) - FR-02 scenario
  await db.guardianStudent.create({ data: { guardianId: aisyah.id, studentId: sById['AF2026001'].id, isPrimary: true } })
  await db.guardianStudent.create({ data: { guardianId: aisyah.id, studentId: sById['AF2026006'].id, isPrimary: false } })

  // Razif (suami Aisyah): 1 anak sama (Aisyah Nur)
  await db.guardianStudent.create({ data: { guardianId: razif.id, studentId: sById['AF2026006'].id, isPrimary: true } })

  // Fatimah: 2 anak (Yusuf T2 & Khadijah T3) - FR-02 scenario
  await db.guardianStudent.create({ data: { guardianId: fatimah.id, studentId: sById['AF2026003'].id, isPrimary: true } })
  await db.guardianStudent.create({ data: { guardianId: fatimah.id, studentId: sById['AF2026004'].id, isPrimary: true } })

  // Hasni: 1 anak (Sofia T1)
  await db.guardianStudent.create({ data: { guardianId: hasni.id, studentId: sById['AF2026002'].id, isPrimary: true } })

  // Norhayati: 1 anak (Hamzah T5)
  await db.guardianStudent.create({ data: { guardianId: norhayati.id, studentId: sById['AF2026007'].id, isPrimary: true } })

  // Kamal: 2 anak (Muhammad Ali T4 & Zayyan T6) - FR-02 scenario
  await db.guardianStudent.create({ data: { guardianId: kamal.id, studentId: sById['AF2026005'].id, isPrimary: true } })
  await db.guardianStudent.create({ data: { guardianId: kamal.id, studentId: sById['AF2026009'].id, isPrimary: false } })

  // ===== DOKUMEN (40 dokumen) =====
  const kategoriList = [
    'LAPORAN_KEMAJUAN',
    'SLIP_KEPUTUSAN',
    'SURAT_PENGESAHAN',
    'SURAT_EDARAN',
    'RESIT_YURAN',
    'REKOD_KEHADIRAN',
    'SIJIL',
    'BORANG',
  ]
  const penggalList = ['1', '2', '3']
  const tahunSekolah = 2026

  // Templat kandungan
  const laporanKemajuan = (student: typeof students[number], penggal: string) => `
# LAPORAN KEMAJUAN MURID

**Sekolah Rendah Al Furqan Shah Alam**

| Butiran | Maklumat |
|---|---|
| Nama Murid | ${student.nama} |
| No. Pendaftaran | ${student.idMurid} |
| Tahun | ${student.tahun} |
| Penggal | ${penggal} |
| Tahun Sekolah | ${tahunSekolah} |

## Ulasan Akademik

Murid menunjukkan kemajuan yang memberansangkan sepanjang Penggal ${penggal}. Pencapaian dalam subjek utama (Bahasa Melayu, Bahasa Inggeris, Matematik dan Sains) berada pada tahap baik. Murid aktif menyertai aktiviti pembelajaran di dalam kelas.

## Ulasan Tahfiz & Jawi

Hafazan surah-surah pendek dan penulisan jawi menunjukkan peningkatan ketara. Disiplin murid dalam mengulang hafazan perlu diteruskan di rumah dengan bimbingan ibu bapa.

## Ulasan Sahsiah

Murid berdisiplin, hormat kepada guru dan mesra dengan rakan. Perlu ditingkatkan keyakinan diri semasa bersoal jawab di hadapan kelas.

## Cadangan

1. Galakkan murid membaca sekurang-kurangnya 15 minit sehari.
2. Latih tubi tambahan untuk matematik asas.
3. Sambutan positif terhadap usaha murid untuk mengekalkan momentum.

---

**Guru Kelas:** Ustaz Ahmad Faizal bin Hassan
**Tarikh Laporan:** ${new Date().toLocaleDateString('ms-MY')}
`.trim()

  const slipKeputusan = (student: typeof students[number], penggal: string) => `
# SLIP KEPUTUSAN PEPERIKSAAN

**Sekolah Rendah Al Furqan Shah Alam**

| Butiran | Maklumat |
|---|---|
| Nama Murid | ${student.nama} |
| No. Pendaftaran | ${student.idMurid} |
| Tahun / Penggal | ${student.tahun} / Penggal ${penggal} |

## Keputusan Peperiksaan Penggal ${penggal}

| Subjek | Markah | Gred |
|---|---|---|
| Bahasa Melayu | ${80 + Number(penggal) * 3} | A |
| Bahasa Inggeris | ${75 + Number(penggal) * 2} | A- |
| Matematik | ${78 + Number(penggal)} | A |
| Sains | ${82 + Number(penggal) * 2} | A |
| Pendidikan Islam | 88 | A |
| Bahasa Arab | 80 | A |
| Jawi & Tulisan | 85 | A |
| Tahfiz Al-Quran | 90 | A |

## Kedudukan Kelas: 3 / 28

---

**Disahkan oleh:** Puan Noraini binti Yusof
**Penolong Kanan**
`.trim()

  const suratPengesahan = (student: typeof students[number]) => `
# SURAT PENGESAHAN MURID

**SEKOLAH RENDAH AL FURQAN SHAH ALAM**
No. Rujukan: AF/${student.idMurid}/${tahunSekolah}

Sukacita dimaklumkan bahawa murid berikut adalah pelajar Sekolah Rendah Al Furqan Shah Alam:

| Butiran | Maklumat |
|---|---|
| Nama | ${student.nama} |
| No. Pendaftaran | ${student.idMurid} |
| Tahun | Tahun ${student.tahun} |
| Status | AKTIF |

Surat ini dikeluarkan untuk tujuan rujukan ibu bapa / penjaga.

Sekian, terima kasih.

**Pengetua**
Sekolah Rendah Al Furqan Shah Alam
`.trim()

  const suratEdaran = (tajuk: string, kelas: typeof kelas[number]) => `
# SURAT EDARAN SEKOLAH

**SEKOLAH RENDAH AL FURQAN SHAH ALAM**
Tahun Sekolah ${tahunSekolah}

## ${tajuk}

Kepada ibu bapa / penjaga murid **${kelas.nama}**, dimaklumkan perkara berikut:

1. Tarikh: seperti tertera.
2. Tempat: Sekolah Rendah Al Furqan Shah Alam.
3. Kehadiran murid dan waris adalah diwajibkan.

Sekiranya terdapat pertanyaan, sila hubungi pejabat sekolah di 03-5512 3456.

Terima kasih.

**Pihak Sekolah**
`.trim()

  const resitYuran = (student: typeof students[number], penggal: string) => `
# RESIT YURAN SEKOLAH

**SEKOLAH RENDAH AL FURQAN SHAH ALAM**
Resit No: Y/${student.idMurid}/${tahunSekolah}/P${penggal}

| Butiran | Maklumat |
|---|---|
| Nama Murid | ${student.nama} |
| No. Pendaftaran | ${student.idMurid} |
| Penggal | ${penggal} |

## Butiran Bayaran

| Perkara | Amaun (RM) |
|---|---|
| Yuran Penggal | 250.00 |
| Yuran PIBG | 50.00 |
| Yuran Majlis Tilawah | 20.00 |
| **Jumlah** | **320.00** |

Bayaran telah diterima dengan jelas.

**Kerani Pejabat:** Puan Siti Khadijah binti Ismail
`.trim()

  const rekodKehadiran = (student: typeof students[number], penggal: string) => `
# REKOD KEHADIRAN MURID

**SEKOLAH RENDAH AL FURQAN SHAH ALAM**

| Butiran | Maklumat |
|---|---|
| Nama Murid | ${student.nama} |
| No. Pendaftaran | ${student.idMurid} |
| Penggal | ${penggal} |

## Ringkasan Kehadiran

| Perkara | Hari |
|---|---|
| Hari Sekolah | 60 |
| Hadir | ${56 - Number(penggal)} |
| Tidak Hadir (Sah) | ${2 + Number(penggal)} |
| Tidak Hadir (Tidak Sah) | ${1 + Number(penggal)} |
| Peratus Kehadiran | ${Math.round((56 - Number(penggal)) / 60 * 100)}% |

---

**Guru Kelas:** Ustaz Ahmad Faizal bin Hassan
`.trim()

  const sijil = (student: typeof students[number], tajuk: string) => `
# SIJIL ${tajuk.toUpperCase()}

**SEKOLAH RENDAH AL FURQAN SHAH ALAM**

Dengan ini sesungguhnya mengurniakan Sijil ${tajuk} kepada:

## ${student.nama}

(No. Pendaftaran: ${student.idMurid})

atas pencapaian cemerlang dalam ${tajuk} anjuran Sekolah Rendah Al Furqan Shah Alam pada tahun ${tahunSekolah}.

Semoga usaha murni ini diteruskan dan menjadi penyemangat kepada rakan-rakan yang lain.

**Pengetua**
Sekolah Rendah Al Furqan Shah Alam
`.trim()

  const borang = (student: typeof students[number], tajuk: string) => `
# ${tajuk.toUpperCase()}

**SEKOLAH RENDAH AL FURQAN SHAH ALAM**

## Maklumat Murid

| Butiran | Maklumat |
|---|---|
| Nama | ${student.nama} |
| No. Pendaftaran | ${student.idMurid} |
| Tahun | ${student.tahun} |

Saya mengaku bahawa maklumat di atas adalah benar dan saya bersetuju mematuhi semua terma dan syarat yang ditetapkan oleh pihak sekolah.

**Tandatangan Ibu Bapa / Penjaga:** _______________________

**Tarikh:** _______________________
`.trim()

  // Jana ~40 dokumen dengan kategori dan status yang pelbagai
  const dokumenEntries: Array<{
    studentId: string
    kategori: string
    tajuk: string
    penggal: string
    tahun: number
    status: string
    kandungan: string
    diterbitOlehId: string
  }> = []

  // Helper to push document entries
  const addDoc = (
    student: typeof students[number],
    kategori: string,
    tajuk: string,
    penggal: string,
    status: string,
    kandungan: string,
    diterbitOlehId = pnNoraini.id,
    tarikh: Date = new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000)
  ) => {
    dokumenEntries.push({
      studentId: student.id,
      kategori,
      tajuk,
      penggal,
      tahun: tahunSekolah,
      status,
      kandungan,
      diterbitOlehId,
    })
  }

  // Setiap murid dapat ~4 dokumen
  for (const s of students) {
    addDoc(s, 'LAPORAN_KEMAJUAN', `Laporan Kemajuan Penggal 1 ${tahunSekolah}`, '1', 'DITERBITKAN', laporanKemajuan(s, '1'))
    addDoc(s, 'LAPORAN_KEMAJUAN', `Laporan Kemajuan Penggal 2 ${tahunSekolah}`, '2', 'DITERBITKAN', laporanKemajuan(s, '2'))
    addDoc(s, 'SLIP_KEPUTUSAN', `Slip Keputusan Penggal 1 ${tahunSekolah}`, '1', 'DITERBITKAN', slipKeputusan(s, '1'))
    addDoc(s, 'SLIP_KEPUTUSAN', `Slip Keputusan Penggal 2 ${tahunSekolah}`, '2', 'SEMAKAN', slipKeputusan(s, '2'))
  }

  // Dokumen tambahan
  addDoc(sById['AF2026001'], 'SURAT_PENGESAHAN', `Surat Pengesahan Murid ${tahunSekolah}`, '', 'DITERBITKAN', suratPengesahan(sById['AF2026001']))
  addDoc(sById['AF2026006'], 'SURAT_PENGESAHAN', `Surat Pengesahan Murid ${tahunSekolah}`, '', 'DITERBITKAN', suratPengesahan(sById['AF2026006']))
  addDoc(sById['AF2026001'], 'RESIT_YURAN', `Resit Yuran Penggal 1 ${tahunSekolah}`, '1', 'DITERBITKAN', resitYuran(sById['AF2026001'], '1'))
  addDoc(sById['AF2026001'], 'RESIT_YURAN', `Resit Yuran Penggal 2 ${tahunSekolah}`, '2', 'DITERBITKAN', resitYuran(sById['AF2026001'], '2'))
  addDoc(sById['AF2026006'], 'RESIT_YURAN', `Resit Yuran Penggal 1 ${tahunSekolah}`, '1', 'DITERBITKAN', resitYuran(sById['AF2026006'], '1'))
  addDoc(sById['AF2026003'], 'REKOD_KEHADIRAN', `Rekod Kehadiran Penggal 1 ${tahunSekolah}`, '1', 'DITERBITKAN', rekodKehadiran(sById['AF2026003'], '1'))
  addDoc(sById['AF2026003'], 'REKOD_KEHADIRAN', `Rekod Kehadiran Penggal 2 ${tahunSekolah}`, '2', 'DITERBITKAN', rekodKehadiran(sById['AF2026003'], '2'))
  addDoc(sById['AF2026005'], 'SIJIL', 'Sijil Pelajar Cemerlang', '', 'DITERBITKAN', sijil(sById['AF2026005'], 'Pelajar Cemerlang'))
  addDoc(sById['AF2026007'], 'SIJIL', 'Sijil Tahfiz', '', 'DITERBITKAN', sijil(sById['AF2026007'], 'Tahfiz Al-Quran'))
  addDoc(sById['AF2026006'], 'SIJIL', 'Sijil Penyertaan Pertandingan', '', 'DITERBITKAN', sijil(sById['AF2026006'], 'Penyertaan Khemah Ibadah'))
  addDoc(sById['AF2026001'], 'BORANG', 'Borang Kebenaran Aktiviti Kokurikulum', '', 'DITERBITKAN', borang(sById['AF2026001'], 'Borang Kebenaran Aktiviti Kokurikulum'))
  addDoc(sById['AF2026006'], 'BORANG', 'Borang Maklum Balas Ibu Bapa', '', 'DRAFT', borang(sById['AF2026006'], 'Borang Maklum Balas Ibu Bapa'), ustazAhmad.id)

  // Tambah dokumen kelas (surat edaran)
  const suratEdaran1 = await db.dokumen.create({
    data: {
      studentId: sById['AF2026001'].id, // anchor
      kategori: 'SURAT_EDARAN',
      tajuk: 'Surat Edaran: Sambutan Maulidur Rasul',
      penggal: '',
      tahun: tahunSekolah,
      status: 'DITERBITKAN',
      kandungan: suratEdaran('Sambutan Maulidur Rasul', kelasByNama['1 Al Bukhari']),
      diterbitOlehId: pnNoraini.id,
      kelasId: kelasByNama['1 Al Bukhari'].id,
    },
  })

  // Buat semua dokumenEntries (yang tidak kelas)
  const createdDocs = await Promise.all(
    dokumenEntries.map((d) =>
      db.dokumen.create({
        data: {
          ...d,
          tarikh: new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000),
        },
      })
    )
  )

  // ===== Notifikasi untuk ibu bapa =====
  for (const g of guardians) {
    const anakList = await db.guardianStudent.findMany({
      where: { guardianId: g.id },
      include: { student: { include: { dokumen: { where: { status: 'DITERBITKAN' }, take: 3 } } } },
    })
    for (const link of anakList) {
      for (const doc of link.student.dokumen) {
        await db.notifikasi.create({
          data: {
            guardianId: g.id,
            documentId: doc.id,
            jenis: 'DOKUMEN_BAHARU',
            mesej: `Dokumen baharu untuk ${link.student.nama}: ${doc.tajuk}`,
          },
        })
      }
    }
  }

  // ===== Tandakan beberapa dokumen telah dibaca (simulasi) =====
  await db.dokumenBaca.create({
    data: {
      documentId: createdDocs[0].id,
      guardianId: aisyah.id,
    },
  })

  // ===== Audit log permulaan =====
  await db.auditLog.create({
    data: {
      staffId: enZulkifli.id,
      userType: 'STAFF',
      namaUser: enZulkifli.nama,
      tindakan: 'SISTEM_INIT',
      metadata: 'Pangkalan data dummy SPMF dikemas kini dengan data sampel.',
    },
  })

  // ===== Share link contoh =====
  const sampleToken = 'spmf-sample-' + Math.random().toString(36).slice(2, 10)
  await db.shareLink.create({
    data: {
      documentId: createdDocs[0].id,
      guardianId: aisyah.id,
      token: sampleToken,
      pinHash: hashPin('123456'),
      tarikhLuput: new Date(Date.now() + 7 * 86400000),
      hadAkses: 20,
    },
  })

  console.log('Seeding selesai.')
  console.log(`- Staf: 4`)
  console.log(`- Kelas: ${kelas.length}`)
  console.log(`- Guardian: ${guardians.length}`)
  console.log(`- Murid: ${students.length}`)
  console.log(`- Dokumen: ${createdDocs.length + 1}`)
  console.log(`\nAkaun log masuk dummy:`)
  console.log(`  Ibu Bapa (2 anak): aisyah.hamid@gmail.com / ibu123`)
  console.log(`  Ibu Bapa (2 anak): fatimah.abdullah@gmail.com / ibu123`)
  console.log(`  Guru: ahmad.fazil@alfurqan.edu.my / guru123`)
  console.log(`  Penolong Kanan: noraini.yusof@alfurqan.edu.my / pk123`)
  console.log(`  Kerani: siti.ismail@alfurqan.edu.my / kerani123`)
  console.log(`  Admin: admin@alfurqan.edu.my / admin123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
