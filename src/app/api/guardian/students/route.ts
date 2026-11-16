import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'

// GET /api/guardian/students - senarai anak guardian
export async function GET() {
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  const links = await db.guardianStudent.findMany({
    where: { guardianId: user.id },
    include: {
      student: {
        include: {
          kelas: { select: { nama: true } },
        },
      },
    },
    orderBy: { isPrimary: 'desc' },
  })

  return NextResponse.json({
    ok: true,
    students: links.map((l) => ({
      id: l.student.id,
      idMurid: l.student.idMurid,
      nama: l.student.nama,
      tahun: l.student.tahun,
      kelas: l.student.kelas.nama,
      jantina: l.student.jantina,
      isPrimary: l.isPrimary,
    })),
  })
}
