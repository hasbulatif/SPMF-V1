import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, recordAudit } from '@/lib/session'
import { unlink } from 'fs/promises'
import path from 'path'

// DELETE /api/staff/share-resources/[id] - padam bahan kongsi
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const { id } = await params

  const resource = await db.sharedResource.findUnique({ where: { id } })
  if (!resource) {
    return NextResponse.json({ ok: false, error: 'Bahan tidak dijumpai' }, { status: 404 })
  }

  // Hanya pemilik, PK, atau admin boleh memadam
  const canDelete =
    resource.staffId === user.id ||
    ['PENOLONG_KANAN', 'ADMIN'].includes(user.peranan ?? '')

  if (!canDelete) {
    return NextResponse.json(
      { ok: false, error: 'Anda hanya boleh memadam bahan yang anda kongsikan sendiri.' },
      { status: 403 }
    )
  }

  // Padam fail PDF dari disk jika ada
  if (resource.failUrl) {
    try {
      const filePath = path.join(process.cwd(), 'public', resource.failUrl)
      await unlink(filePath)
    } catch (e) {
      // fail mungkin sudah tiada - abaikan
      console.warn('Gagal memadam fail:', e)
    }
  }

  await db.sharedResource.delete({ where: { id } })
  await recordAudit({
    staffId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'KONGSI',
    metadata: `Padam bahan kongsi: ${resource.tajuk}`,
  })
  return NextResponse.json({ ok: true })
}
