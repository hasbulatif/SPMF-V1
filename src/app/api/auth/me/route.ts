import { NextResponse } from 'next/server'
import { getSessionUser, clearSessionUser, recordAudit } from '@/lib/session'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ ok: false, user: null })
  }
  return NextResponse.json({ ok: true, user })
}

export async function POST() {
  const user = await getSessionUser()
  if (user) {
    await recordAudit({
      staffId: user.type === 'STAFF' ? user.id : null,
      guardianId: user.type === 'GUARDIAN' ? user.id : null,
      userType: user.type,
      namaUser: user.nama,
      tindakan: 'LOG_KELUAR',
    })
  }
  await clearSessionUser()
  return NextResponse.json({ ok: true })
}
