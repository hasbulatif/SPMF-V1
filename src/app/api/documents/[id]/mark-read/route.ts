import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, guardianHasDocumentAccess, recordAudit } from '@/lib/session'

// POST /api/documents/[id]/mark-read
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  const allowed = await guardianHasDocumentAccess(user.id, id)
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'Akses ditolak' }, { status: 403 })
  }

  await db.dokumenBaca.upsert({
    where: {
      documentId_guardianId: { documentId: id, guardianId: user.id },
    },
    update: { readAt: new Date() },
    create: { documentId: id, guardianId: user.id },
  })

  // Tandakan notifikasi berkaitan sebagai dibaca
  await db.notifikasi.updateMany({
    where: { guardianId: user.id, documentId: id, dibaca: false },
    data: { dibaca: true },
  })

  return NextResponse.json({ ok: true })
}

// POST /api/documents/[id]/audit - catat tindakan muat turun/cetak
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sesi tamat' }, { status: 401 })
  }
  const { tindakan } = await req.json()
  if (!['MUAT_TURUN', 'CETAK'].includes(tindakan)) {
    return NextResponse.json({ ok: false, error: 'Tindakan tidak sah' }, { status: 400 })
  }

  await recordAudit({
    staffId: user.type === 'STAFF' ? user.id : null,
    guardianId: user.type === 'GUARDIAN' ? user.id : null,
    userType: user.type,
    namaUser: user.nama,
    tindakan,
    documentId: id,
  })
  return NextResponse.json({ ok: true })
}
