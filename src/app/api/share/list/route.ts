import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'

// GET /api/share/list - senarai pautan aktif guardian
export async function GET() {
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  const links = await db.shareLink.findMany({
    where: { guardianId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      dokumen: {
        select: {
          id: true,
          tajuk: true,
          kategori: true,
          student: { select: { nama: true } },
        },
      },
    },
  })

  return NextResponse.json({
    ok: true,
    links: links.map((l) => ({
      id: l.id,
      token: l.token,
      tarikhLuput: l.tarikhLuput,
      dibatalkan: l.dibatalkan,
      bilanganAkses: l.bilanganAkses,
      hadAkses: l.hadAkses,
      createdAt: l.createdAt,
      url: `/?share=${l.token}`,
      dokumen: l.dokumen,
      isExpired: l.tarikhLuput < new Date(),
    })),
  })
}
