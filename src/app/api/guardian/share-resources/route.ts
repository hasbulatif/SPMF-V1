import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'

// GET /api/guardian/share-resources?studentId=
// Senarai bahan kongsi yang boleh diakses oleh guardian ini:
// - Bahan untuk anak tertentu (studentId match)
// - Bahan untuk seluruh kelas anak-anak guardian
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  // Dapatkan senarai anak + kelas mereka
  const links = await db.guardianStudent.findMany({
    where: { guardianId: user.id },
    include: {
      student: {
        select: {
          id: true,
          idMurid: true,
          nama: true,
          tahun: true,
          kelas: { select: { id: true, nama: true } },
        },
      },
    },
  })

  const studentIds = links.map((l) => l.student.id)
  const kelasIds = Array.from(new Set(links.map((l) => l.student.kelas.id)))

  if (studentIds.length === 0) {
    return NextResponse.json({ ok: true, resources: [], anakLabels: [] })
  }

  const { searchParams } = new URL(req.url)
  const filterStudentId = searchParams.get('studentId')

  // Bahan yang boleh diakses: studentId IN anak-anak ATAU kelasId IN kelas anak-anak
  const resources = await db.sharedResource.findMany({
    where: {
      OR: [
        { studentId: { in: studentIds } },
        { kelasId: { in: kelasIds } },
      ],
      ...(filterStudentId
        ? {
            OR: [
              { studentId: filterStudentId },
              {
                kelasId: {
                  in: links
                    .filter((l) => l.student.id === filterStudentId)
                    .map((l) => l.student.kelas.id),
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      staff: { select: { nama: true, peranan: true } },
      student: { select: { id: true, nama: true, idMurid: true, kelas: { select: { id: true, nama: true } } } },
    },
  })

  // Dapatkan nama kelas untuk bahan seluruh kelas
  const allKelasIds = Array.from(
    new Set(resources.map((r) => r.kelasId).filter(Boolean))
  ) as string[]
  const kelasList = await db.kelas.findMany({
    where: { id: { in: allKelasIds } },
    select: { id: true, nama: true },
  })
  const kelasMap = new Map(kelasList.map((k) => [k.id, k.nama]))

  // Tandakan yang telah dibaca oleh guardian (menggunakan notifikasi sebagai proxy)
  // Untuk prototaip, kita kira berapa bahan belum dibaca berdasarkan created time

  const result = resources.map((r) => {
    const isForMyChild = r.studentId && studentIds.includes(r.studentId)
    const isForMyClass = r.kelasId && kelasIds.includes(r.kelasId)
    // Tentukan untuk anak mana (jika kelas, kaitkan dengan anak yang ada di kelas itu)
    let relatedStudentId: string | null = null
    let relatedStudentName: string | null = null
    if (r.studentId && studentIds.includes(r.studentId)) {
      const link = links.find((l) => l.student.id === r.studentId)
      if (link) {
        relatedStudentId = link.student.id
        relatedStudentName = link.student.nama
      }
    } else if (r.kelasId) {
      // Cari anak guardian yang berada dalam kelas ini
      const link = links.find((l) => l.student.kelas.id === r.kelasId)
      if (link) {
        relatedStudentId = link.student.id
        relatedStudentName = link.student.nama
      }
    }
    return {
      id: r.id,
      tajuk: r.tajuk,
      keterangan: r.keterangan,
      jenis: r.jenis,
      failUrl: r.failUrl,
      failName: r.failName,
      googleUrl: r.googleUrl,
      googlePreviewUrl: r.googlePreviewUrl,
      createdAt: r.createdAt,
      staff: r.staff?.nama ?? 'Tidak diketahui',
      // Untuk anak mana bahan ini berkaitan
      relatedStudentId,
      relatedStudentName,
      // Skop asal (untuk maklumat)
      sasaranAsalLabel: r.student
        ? `${r.student.nama} (${r.student.kelas.nama})`
        : r.kelasId
        ? `Seluruh Kelas ${kelasMap.get(r.kelasId) ?? ''}`
        : 'Tiada sasaran',
      isForMyChild,
      isForMyClass,
    }
  })

  // Senarai anak untuk filter
  const anakLabels = links.map((l) => ({
    id: l.student.id,
    nama: l.student.nama,
    idMurid: l.student.idMurid,
    kelas: l.student.kelas.nama,
    tahun: l.student.tahun,
  }))

  return NextResponse.json({
    ok: true,
    resources: result,
    anakLabels,
  })
}
