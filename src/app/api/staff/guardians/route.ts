import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, recordAudit } from '@/lib/session'

// GET - senarai guardian
export async function GET() {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const guardians = await db.guardian.findMany({
    orderBy: { nama: 'asc' },
    include: {
      students: { include: { student: { select: { id: true, nama: true, idMurid: true, tahun: true, kelas: { select: { nama: true } } } } } },
    },
  })
  return NextResponse.json({
    ok: true,
    guardians: guardians.map((g) => ({
      id: g.id,
      nama: g.nama,
      emel: g.emel,
      noTelefon: g.noTelefon,
      hubungan: g.hubungan,
      status: g.status,
      students: g.students.map((s) => ({ ...s.student, isPrimary: s.isPrimary })),
    })),
  })
}

// POST - cipta guardian baru (dan pautkan ke murid)
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF' || !['KERANI', 'ADMIN'].includes(user.peranan ?? '')) {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const body = await req.json()
  const { nama, emel, noTelefon, hubungan, password, studentIds } = body
  if (!nama || !emel || !noTelefon || !hubungan || !password) {
    return NextResponse.json({ ok: false, error: 'Medan wajib tidak lengkap' }, { status: 400 })
  }

  const existing = await db.guardian.findUnique({ where: { emel: String(emel).toLowerCase() } })
  if (existing) {
    return NextResponse.json({ ok: false, error: 'Emel telah didaftarkan' }, { status: 400 })
  }

  const guardian = await db.guardian.create({
    data: {
      nama,
      emel: String(emel).toLowerCase(),
      noTelefon,
      hubungan,
      password,
      students: studentIds?.length
        ? { create: studentIds.map((sid: string, i: number) => ({ studentId: sid, isPrimary: i === 0 })) }
        : undefined,
    },
  })

  await recordAudit({
    staffId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'CRUD_GUARDIAN',
    metadata: `Cipta guardian ${nama}`,
  })
  return NextResponse.json({ ok: true, guardianId: guardian.id })
}

// PATCH - kemaskini guardian (atau set semula kata laluan)
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF' || !['KERANI', 'ADMIN'].includes(user.peranan ?? '')) {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const body = await req.json()
  const { id, nama, emel, noTelefon, hubungan, status, password, studentIds } = body
  if (!id) return NextResponse.json({ ok: false, error: 'ID diperlukan' }, { status: 400 })

  if (Array.isArray(studentIds)) {
    await db.guardianStudent.deleteMany({ where: { guardianId: id } })
    if (studentIds.length > 0) {
      await db.guardianStudent.createMany({
        data: studentIds.map((sid: string, i: number) => ({
          guardianId: id,
          studentId: sid,
          isPrimary: i === 0,
        })),
      })
    }
  }

  await db.guardian.update({
    where: { id },
    data: {
      ...(nama ? { nama } : {}),
      ...(emel ? { emel: String(emel).toLowerCase() } : {}),
      ...(noTelefon ? { noTelefon } : {}),
      ...(hubungan ? { hubungan } : {}),
      ...(status ? { status } : {}),
      ...(password ? { password } : {}),
    },
  })

  await recordAudit({
    staffId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'CRUD_GUARDIAN',
    metadata: `Kemaskini guardian ${id}${password ? ' (set semula kata laluan)' : ''}`,
  })
  return NextResponse.json({ ok: true })
}

// DELETE - padam guardian
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF' || user.peranan !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Hanya admin boleh memadam guardian' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'ID diperlukan' }, { status: 400 })
  await db.guardian.delete({ where: { id } })
  await recordAudit({
    staffId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'CRUD_GUARDIAN',
    metadata: `Padam guardian ${id}`,
  })
  return NextResponse.json({ ok: true })
}
