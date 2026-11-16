import { db } from '../src/lib/db'

async function main() {
  // Cari staf admin/guru untuk dijadikan pemilik bahan demo
  const ustaz = await db.staff.findFirst({ where: { peranan: 'GURU' } })
  if (!ustaz) {
    console.log('Tiada staf guru dijumpai')
    return
  }

  // Cari beberapa murid dan kelas untuk sasaran
  const students = await db.student.findMany({ take: 5, include: { kelas: true } })
  const kelas5IbnuSina = await db.kelas.findFirst({ where: { nama: '5 Ibnu Sina' } })
  const kelas1Bukhari = await db.kelas.findFirst({ where: { nama: '1 Al Bukhari' } })

  if (students.length === 0) {
    console.log('Tiada murid dijumpai')
    return
  }

  // Padam bahan demo sedia ada
  await db.sharedResource.deleteMany({
    where: { tajuk: { contains: 'DEMO' } },
  })

  // 1. PDF demo untuk murid tertentu (Ahmad Danish - anak Aisyah)
  await db.sharedResource.create({
    data: {
      staffId: ustaz.id,
      tajuk: 'DEMO: Nota Panduan Solat Subuh',
      keterangan: 'Nota ringkas untuk ibu bapa membimbing anak solat Subuh di rumah.',
      jenis: 'PDF_UPLOAD',
      failUrl: '/uploads/demo-nota-solat.pdf',
      failName: 'nota-panduan-solat.pdf',
      studentId: students[0].id,
      kelasId: students[0].kelasId,
    },
  })

  // 2. PDF demo untuk seluruh kelas 1 Al Bukhari
  if (kelas1Bukhari) {
    await db.sharedResource.create({
      data: {
        staffId: ustaz.id,
        tajuk: 'DEMO: Jadual Waktu Sekolah Kelas 1 Al Bukhari',
        keterangan: 'Jadual waktu persekolahan untuk Penggal 2 2026.',
        jenis: 'PDF_UPLOAD',
        failUrl: '/uploads/demo-nota-solat.pdf',
        failName: 'jadual-waktu-1-bukhari.pdf',
        studentId: null,
        kelasId: kelas1Bukhari.id,
      },
    })
  }

  // 3. Google Drive link demo untuk kelas 5 Ibnu Sina
  if (kelas5IbnuSina) {
    await db.sharedResource.create({
      data: {
        staffId: ustaz.id,
        tajuk: 'DEMO: Video Panduan Hafazan Surah Al-Mulk',
        keterangan: 'Video panduan hafazan yang disimpan di Google Drive. Sila klik untuk menonton.',
        jenis: 'GOOGLE_DRIVE',
        googleUrl: 'https://drive.google.com/file/d/1bvXjMsC9w5WGPpCPYKqCpTk5YJ2m0WQT/view',
        googlePreviewUrl: 'https://drive.google.com/file/d/1bvXjMsC9w5WGPpCPYKqCpTk5YJ2m0WQT/preview',
        studentId: null,
        kelasId: kelas5IbnuSina.id,
      },
    })
  }

  // 4. PDF demo untuk murid Aisyah Nur (anak Aisyah & Razif)
  const aisyahNur = await db.student.findUnique({ where: { idMurid: 'AF2026006' } })
  if (aisyahNur) {
    await db.sharedResource.create({
      data: {
        staffId: ustaz.id,
        tajuk: 'DEMO: Latihan Tambahan Matematik Tahun 5',
        keterangan: 'Set latihan tambahan untuk persiapan peperiksaan akhir tahun.',
        jenis: 'PDF_UPLOAD',
        failUrl: '/uploads/demo-nota-solat.pdf',
        failName: 'latihan-matematik-tahun5.pdf',
        studentId: aisyahNur.id,
        kelasId: aisyahNur.kelasId,
      },
    })
  }

  // Jana notifikasi untuk guardian berkaitan
  const allResources = await db.sharedResource.findMany({ where: { tajuk: { contains: 'DEMO' } } })
  for (const r of allResources) {
    const links = r.studentId
      ? await db.guardianStudent.findMany({ where: { studentId: r.studentId }, select: { guardianId: true }, distinct: ['guardianId'] })
      : r.kelasId
      ? await db.guardianStudent.findMany({ where: { student: { kelasId: r.kelasId } }, select: { guardianId: true }, distinct: ['guardianId'] })
      : []
    for (const l of links) {
      await db.notifikasi.create({
        data: {
          guardianId: l.guardianId,
          documentId: null,
          jenis: 'DOKUMEN_BAHARU',
          mesej: `Bahan baharu daripada guru: ${r.tajuk.replace('DEMO: ', '')}`,
        },
      })
    }
  }

  console.log('Bahan demo berjaya ditambah:')
  console.log(`- ${allResources.length} bahan kongsi`)
  console.log('\nIbu bapa boleh lihat bahan ini di bahagian "Bahan Guru".')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
