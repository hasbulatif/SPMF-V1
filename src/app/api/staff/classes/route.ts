import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'

// GET /api/staff/classes
export async function GET() {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const kelas = await db.kelas.findMany({
    orderBy: [{ tahun: 'asc' }, { nama: 'asc' }],
    include: {
      _count: { select: { students: true } },
      guruKelas: { select: { id: true, nama: true } },
    },
  })
  return NextResponse.json({
    ok: true,
    classes: kelas.map((k) => ({
      id: k.id,
      nama: k.nama,
      tahun: k.tahun,
      guruKelasId: k.guruKelasId,
      guruKelas: k.guruKelas.length ? k.guruKelas.map((g) => g.nama).join(', ') : null,
      jumlahMurid: k._count.students,
    })),
  })
}
