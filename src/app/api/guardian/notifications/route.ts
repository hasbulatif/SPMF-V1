import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'

// GET /api/guardian/notifications
// PATCH /api/guardian/notifications?id=... - tandakan dibaca
export async function GET() {
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  const notifikasi = await db.notifikasi.findMany({
    where: { guardianId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    ok: true,
    notifikasi,
    belumDibaca: notifikasi.filter((n) => !n.dibaca).length,
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action') // 'read' | 'readAll'

  if (action === 'readAll') {
    await db.notifikasi.updateMany({
      where: { guardianId: user.id, dibaca: false },
      data: { dibaca: true },
    })
    return NextResponse.json({ ok: true })
  }

  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID diperlukan' }, { status: 400 })
  }

  await db.notifikasi.update({
    where: { id },
    data: { dibaca: true },
  })
  return NextResponse.json({ ok: true })
}
