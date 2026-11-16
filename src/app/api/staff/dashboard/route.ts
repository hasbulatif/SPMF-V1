import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'
import { KATEGORI_LABEL, STATUS_LABEL } from '@/lib/auth'

// GET /api/staff/dashboard - bento grid data untuk staff
export async function GET() {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  // Statistik keseluruhan
  const totalMurid = await db.student.count()
  const totalGuardian = await db.guardian.count()
  const totalKelas = await db.kelas.count()
  const totalDokumen = await db.dokumen.count()

  // Dokumen mengikut status (aliran kerja)
  const statusCounts = await db.dokumen.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  // Dokumen mengikut kategori
  const kategoriCounts = await db.dokumen.groupBy({
    by: ['kategori'],
    _count: { _all: true },
  })

  // Kadar dibuka oleh ibu bapa
  const diterbitkan = await db.dokumen.count({ where: { status: 'DITERBITKAN' } })
  const dibacaRecords = await db.dokumenBaca.findMany({
    select: { documentId: true },
    distinct: ['documentId'],
  })
  const kadarBaca = diterbitkan > 0 ? Math.round((dibacaRecords.length / diterbitkan) * 100) : 0

  // Dokumen terkini (5)
  const dokumenTerkini = await db.dokumen.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { nama: true, idMurid: true, tahun: true, kelas: { select: { nama: true } } } },
      diterbitOleh: { select: { nama: true } },
    },
  })

  // Audit log terkini (10)
  const auditTerkini = await db.auditLog.findMany({
    take: 8,
    orderBy: { masa: 'desc' },
    include: { dokumen: { select: { tajuk: true } } },
  })

  // Aktiviti yang memerlukan tindakan (untuk PK)
  const dokumenMenunggu = await db.dokumen.findMany({
    where: { status: 'SEMAKAN' },
    include: {
      student: { select: { nama: true, idMurid: true, kelas: { select: { nama: true } } } },
    },
    orderBy: { updatedAt: 'asc' },
    take: 5,
  })

  return NextResponse.json({
    ok: true,
    user: {
      nama: user.nama,
      peranan: user.peranan,
    },
    statistik: {
      totalMurid,
      totalGuardian,
      totalKelas,
      totalDokumen,
      kadarBaca,
      dokumenMenungguSemakan: statusCounts.find((s) => s.status === 'SEMAKAN')?._count._all ?? 0,
    },
    aliranStatus: statusCounts.map((s) => ({
      status: s.status,
      label: STATUS_LABEL[s.status] ?? s.status,
      count: s._count._all,
    })),
    kategoriBreakdown: kategoriCounts.map((k) => ({
      kategori: k.kategori,
      label: KATEGORI_LABEL[k.kategori] ?? k.kategori,
      count: k._count._all,
    })),
    dokumenTerkini: dokumenTerkini.map((d) => ({
      id: d.id,
      tajuk: d.tajuk,
      kategori: d.kategori,
      kategoriLabel: KATEGORI_LABEL[d.kategori] ?? d.kategori,
      status: d.status,
      statusLabel: STATUS_LABEL[d.status] ?? d.status,
      createdAt: d.createdAt,
      student: d.student,
      diterbitOleh: d.diterbitOleh?.nama ?? null,
    })),
    auditTerkini: auditTerkini.map((a) => ({
      id: a.id,
      tindakan: a.tindakan,
      namaUser: a.namaUser,
      userType: a.userType,
      masa: a.masa,
      dokumen: a.dokumen?.tajuk ?? null,
      metadata: a.metadata,
    })),
    dokumenMenunggu: dokumenMenunggu.map((d) => ({
      id: d.id,
      tajuk: d.tajuk,
      kategori: d.kategori,
      kategoriLabel: KATEGORI_LABEL[d.kategori] ?? d.kategori,
      updatedAt: d.updatedAt,
      student: d.student,
    })),
  })
}
