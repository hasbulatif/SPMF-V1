import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getSessionUser,
  guardianHasDocumentAccess,
  recordAudit,
} from '@/lib/session'
import { generateShareToken, generatePin, hashPin } from '@/lib/auth'

// POST /api/share/create - jana pautan perkongsian
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  const { documentId, tempohHari } = await req.json()
  if (!documentId || ![1, 7, 30].includes(Number(tempohHari))) {
    return NextResponse.json(
      { ok: false, error: 'Tempoh tidak sah. Pilih 1, 7 atau 30 hari.' },
      { status: 400 }
    )
  }

  const allowed = await guardianHasDocumentAccess(user.id, documentId)
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'Anda tidak boleh berkongsi dokumen ini.' },
      { status: 403 }
    )
  }

  const pin = generatePin()
  const token = generateShareToken()
  const tarikhLuput = new Date(Date.now() + Number(tempohHari) * 86400000)

  const link = await db.shareLink.create({
    data: {
      documentId,
      guardianId: user.id,
      token,
      pinHash: hashPin(pin),
      tarikhLuput,
      hadAkses: 20,
    },
  })

  await recordAudit({
    guardianId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'KONGSI',
    documentId,
    metadata: `Pautan ${tempohHari} hari, token ${token}`,
  })

  // URL relatif - klien tukar dengan window.location.origin
  return NextResponse.json({
    ok: true,
    shareLink: {
      id: link.id,
      token: link.token,
      pin,
      tarikhLuput: link.tarikhLuput,
      url: `/?share=${link.token}`,
    },
  })
}
