import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'

// GET /api/staff/audit-logs?tindakan=&userType=&q=&limit=
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF' || !['ADMIN', 'PENOLONG_KANAN'].includes(user.peranan ?? '')) {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const tindakan = searchParams.get('tindakan')
  const userType = searchParams.get('userType')
  const q = searchParams.get('q')?.toLowerCase().trim()
  const limit = Number(searchParams.get('limit') ?? '100')

  const logs = await db.auditLog.findMany({
    where: {
      ...(tindakan && tindakan !== 'ALL' ? { tindakan } : {}),
      ...(userType && userType !== 'ALL' ? { userType } : {}),
      ...(q ? { OR: [{ namaUser: { contains: q } }, { metadata: { contains: q } }] } : {}),
    },
    orderBy: { masa: 'desc' },
    take: limit,
    include: { dokumen: { select: { id: true, tajuk: true } } },
  })

  // Pilihan tindakan yang tersedia
  const tindakanOptions = await db.auditLog.findMany({
    distinct: ['tindakan'],
    select: { tindakan: true },
  })

  return NextResponse.json({
    ok: true,
    logs: logs.map((l) => ({
      id: l.id,
      masa: l.masa,
      namaUser: l.namaUser,
      userType: l.userType,
      tindakan: l.tindakan,
      documentId: l.documentId,
      dokumen: l.dokumen?.tajuk ?? null,
      metadata: l.metadata,
      peranti: l.peranti,
    })),
    tindakanOptions: tindakanOptions.map((t) => t.tindakan),
  })
}
