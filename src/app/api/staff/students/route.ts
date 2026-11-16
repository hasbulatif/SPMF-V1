import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, recordAudit } from '@/lib/session'

// GET /api/staff/students - senarai semua murid
export async function GET() {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  const students = await db.student.findMany({
    orderBy: [{ tahun: 'asc' }, { nama: 'asc' }],
    include: {
      kelas: { select: { id: true, nama: true } },
      guardians: { include: { guardian: { select: { id: true, nama: true, emel: true, noTelefon: true, hubungan: true } } } },
    },
  })

  return NextResponse.json({
    ok: true,
    students: students.map((s) => ({
      id: s.id,
      idMurid: s.idMurid,
      nama: s.nama,
      tahun: s.tahun,
      jantina: s.jantina,
      status: s.status,
      noKP: s.noKP,
      kelas: s.kelas,
      guardians: s.guardians.map((g) => ({
        ...g.guardian,
        isPrimary: g.isPrimary,
      })),
    })),
  })
}

// POST - cipta murid baru
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF' || !['KERANI', 'ADMIN', 'PENOLONG_KANAN'].includes(user.peranan ?? '')) {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const body = await req.json()
  const { idMurid, nama, tahun, kelasId, jantina, noKP, guardianIds } = body

  if (!idMurid || !nama || !tahun || !kelasId || !jantina) {
    return NextResponse.json({ ok: false, error: 'Medan wajib tidak lengkap' }, { status: 400 })
  }

  const existing = await db.student.findUnique({ where: { idMurid } })
  if (existing) {
    return NextResponse.json({ ok: false, error: 'ID Murid telah wujud' }, { status: 400 })
  }

  const student = await db.student.create({
    data: {
      idMurid,
      nama,
      tahun: Number(tahun),
      kelasId,
      jantina,
      noKP: noKP || null,
      guardians: guardianIds?.length
        ? { create: guardianIds.map((gid: string, i: number) => ({ guardianId: gid, isPrimary: i === 0 })) }
        : undefined,
    },
  })

  await recordAudit({
    staffId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'CRUD_MURID',
    metadata: `Cipta murid ${nama} (${idMurid})`,
  })

  return NextResponse.json({ ok: true, studentId: student.id })
}

// PATCH - kemaskini murid
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF' || !['KERANI', 'ADMIN', 'PENOLONG_KANAN'].includes(user.peranan ?? '')) {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const body = await req.json()
  const { id, nama, tahun, kelasId, jantina, status, noKP, guardianIds } = body
  if (!id) return NextResponse.json({ ok: false, error: 'ID diperlukan' }, { status: 400 })

  // Jika guardianIds diberi - sync relasi
  if (Array.isArray(guardianIds)) {
    await db.guardianStudent.deleteMany({ where: { studentId: id } })
    if (guardianIds.length > 0) {
      await db.guardianStudent.createMany({
        data: guardianIds.map((gid: string, i: number) => ({
          guardianId: gid,
          studentId: id,
          isPrimary: i === 0,
        })),
      })
    }
  }

  await db.student.update({
    where: { id },
    data: {
      ...(nama ? { nama } : {}),
      ...(tahun ? { tahun: Number(tahun) } : {}),
      ...(kelasId ? { kelasId } : {}),
      ...(jantina ? { jantina } : {}),
      ...(status ? { status } : {}),
      ...(noKP !== undefined ? { noKP } : {}),
    },
  })

  await recordAudit({
    staffId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'CRUD_MURID',
    metadata: `Kemaskini murid ${id}`,
  })

  return NextResponse.json({ ok: true })
}

// DELETE - padam murid
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF' || user.peranan !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Hanya admin boleh memadam murid' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'ID diperlukan' }, { status: 400 })

  await db.student.delete({ where: { id } })
  await recordAudit({
    staffId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'CRUD_MURID',
    metadata: `Padam murid ${id}`,
  })
  return NextResponse.json({ ok: true })
}
