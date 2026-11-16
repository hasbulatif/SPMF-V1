import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, recordAudit } from '@/lib/session'

// POST /api/guardian/share-resources/[id]/view - catat audit bahawa guardian telah melihat bahan
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const { id } = await params
  const resource = await db.sharedResource.findUnique({
    where: { id },
    select: { tajuk: true, jenis: true },
  })
  if (!resource) {
    return NextResponse.json({ ok: false, error: 'Bahan tidak dijumpai' }, { status: 404 })
  }

  await recordAudit({
    guardianId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'LIHAT_DOKUMEN',
    metadata: `Lihat bahan kongsi guru: ${resource.tajuk} (${resource.jenis})`,
  })

  return NextResponse.json({ ok: true })
}
