import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'
import { KATEGORI_LABEL } from '@/lib/auth'

// GET /api/guardian/dashboard - bento grid data untuk ibu bapa
export async function GET() {
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  // Ambil semua anak
  const links = await db.guardianStudent.findMany({
    where: { guardianId: user.id },
    include: {
      student: {
        include: {
          kelas: true,
          dokumen: {
            where: { status: 'DITERBITKAN' },
            orderBy: { tarikh: 'desc' },
          },
        },
      },
    },
  })

  const anak = links.map((l) => ({
    id: l.student.id,
    idMurid: l.student.idMurid,
    nama: l.student.nama,
    tahun: l.student.tahun,
    kelas: l.student.kelas.nama,
    jantina: l.student.jantina,
    isPrimary: l.isPrimary,
    jumlahDokumen: l.student.dokumen.length,
    dokumenTerkini: l.student.dokumen.slice(0, 4).map((d) => ({
      id: d.id,
      tajuk: d.tajuk,
      kategori: d.kategori,
      kategoriLabel: KATEGORI_LABEL[d.kategori] ?? d.kategori,
      tarikh: d.tarikh,
      penggal: d.penggal,
    })),
    // dokumen belum dibaca
    baharuCount: 0, // diisi di bawah
  }))

  // Kira dokumen belum dibaca per anak
  for (const a of anak) {
    const readDocs = await db.dokumenBaca.findMany({
      where: { guardianId: user.id },
      select: { documentId: true },
    })
    const readSet = new Set(readDocs.map((r) => r.documentId))
    const anakFull = links.find((l) => l.student.id === a.id)
    if (anakFull) {
      a.baharuCount = anakFull.student.dokumen.filter(
        (d) => !readSet.has(d.id)
      ).length
    }
  }

  // Notifikasi belum dibaca
  const notifikasiBelum = await db.notifikasi.count({
    where: { guardianId: user.id, dibaca: false },
  })

  const notifikasiTerbaru = await db.notifikasi.findMany({
    where: { guardianId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Statistik keseluruhan
  const totalDokumen = anak.reduce((s, a) => s + a.jumlahDokumen, 0)
  const totalBaharu = anak.reduce((s, a) => s + a.baharuCount, 0)

  return NextResponse.json({
    ok: true,
    user: {
      nama: user.nama,
      hubungan: user.hubungan,
    },
    anak,
    notifikasi: {
      belumDibaca: notifikasiBelum,
      terbaru: notifikasiTerbaru.map((n) => ({
        id: n.id,
        jenis: n.jenis,
        mesej: n.mesej,
        dibaca: n.dibaca,
        createdAt: n.createdAt,
        documentId: n.documentId,
      })),
    },
    statistik: {
      jumlahAnak: anak.length,
      jumlahDokumen: totalDokumen,
      jumlahBaharu: totalBaharu,
    },
  })
}
