import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, recordAudit } from '@/lib/session'
import { verifyPin } from '@/lib/auth'

const MAX_PIN_ATTEMPTS = 5
const PIN_LOCK_MINUTES = 15

// GET /api/share/[token] - dapatkan info pautan (untuk paparan PIN entry)
// POST /api/share/[token] - sahkan PIN dan lihat dokumen
// DELETE /api/share/[token] - batalkan pautan

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const link = await db.shareLink.findUnique({
    where: { token },
    include: {
      dokumen: {
        select: {
          id: true,
          tajuk: true,
          kategori: true,
          tahun: true,
          tarikh: true,
          student: { select: { nama: true, idMurid: true, tahun: true, kelas: { select: { nama: true } } } },
        },
      },
    },
  })

  if (!link) {
    return NextResponse.json(
      { ok: false, error: 'Pautan tidak sah atau telah dipadam.' },
      { status: 404 }
    )
  }

  if (link.dibatalkan) {
    return NextResponse.json(
      { ok: false, error: 'Pautan ini telah dibatalkan oleh pemilik.' },
      { status: 403 }
    )
  }

  if (link.tarikhLuput < new Date()) {
    return NextResponse.json(
      { ok: false, error: 'Pautan ini telah tamat tempoh.' },
      { status: 410 }
    )
  }

  if (link.dikunci && link.dikunciHingga && link.dikunciHingga > new Date()) {
    const mins = Math.ceil((link.dikunciHingga.getTime() - Date.now()) / 60000)
    return NextResponse.json(
      {
        ok: false,
        error: `Pautan dikunci sementara selepas ${MAX_PIN_ATTEMPTS} cubaan salah. Cuba lagi selepas ${mins} minit.`,
        locked: true,
      },
      { status: 429 }
    )
  }

  return NextResponse.json({
    ok: true,
    preview: {
      tajuk: link.dokumen.tajuk,
      kategori: link.dokumen.kategori,
      tarikh: link.dokumen.tarikh,
      student: link.dokumen.student,
      tarikhLuput: link.tarikhLuput,
      cubaanGagal: link.cubaanGagal,
      hadCubaan: MAX_PIN_ATTEMPTS,
    },
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { pin } = await req.json()

  const link = await db.shareLink.findUnique({
    where: { token },
    include: {
      dokumen: {
        include: {
          student: { include: { kelas: true } },
          diterbitOleh: { select: { nama: true } },
        },
      },
    },
  })

  if (!link) {
    return NextResponse.json({ ok: false, error: 'Pautan tidak sah.' }, { status: 404 })
  }

  if (link.dibatalkan) {
    return NextResponse.json({ ok: false, error: 'Pautan dibatalkan.' }, { status: 403 })
  }

  if (link.tarikhLuput < new Date()) {
    return NextResponse.json({ ok: false, error: 'Pautan tamat tempoh.' }, { status: 410 })
  }

  if (link.dikunci && link.dikunciHingga && link.dikunciHingga > new Date()) {
    const mins = Math.ceil((link.dikunciHingga.getTime() - Date.now()) / 60000)
    return NextResponse.json(
      { ok: false, error: `Pautan dikunci. Cuba lagi selepas ${mins} minit.`, locked: true },
      { status: 429 }
    )
  }

  if (!verifyPin(pin, link.pinHash)) {
    const newFailCount = link.cubaanGagal + 1
    if (newFailCount >= MAX_PIN_ATTEMPTS) {
      await db.shareLink.update({
        where: { id: link.id },
        data: {
          cubaanGagal: newFailCount,
          dikunci: true,
          dikunciHingga: new Date(Date.now() + PIN_LOCK_MINUTES * 60_000),
        },
      })
      return NextResponse.json(
        {
          ok: false,
          error: `PIN salah ${newFailCount} kali. Pautan dikunci selama ${PIN_LOCK_MINUTES} minit.`,
          locked: true,
        },
        { status: 429 }
      )
    }
    await db.shareLink.update({
      where: { id: link.id },
      data: { cubaanGagal: newFailCount },
    })
    const remaining = MAX_PIN_ATTEMPTS - newFailCount
    return NextResponse.json(
      { ok: false, error: `PIN salah. ${remaining} cubaan lagi.`, cubaanGagal: newFailCount },
      { status: 401 }
    )
  }

  // PIN betul - reset dan kira akses
  await db.shareLink.update({
    where: { id: link.id },
    data: {
      cubaanGagal: 0,
      dikunci: false,
      dikunciHingga: null,
      bilanganAkses: { increment: 1 },
    },
  })

  await recordAudit({
    userType: 'UMUM',
    namaUser: 'Penerima Pautan',
    tindakan: 'LIHAT_DOKUMEN',
    documentId: link.dokumen.id,
    metadata: `Akses melalui pautan ${token}`,
  })

  return NextResponse.json({
    ok: true,
    document: {
      id: link.dokumen.id,
      tajuk: link.dokumen.tajuk,
      kategori: link.dokumen.kategori,
      penggal: link.dokumen.penggal,
      tahun: link.dokumen.tahun,
      tarikh: link.dokumen.tarikh,
      kandungan: link.dokumen.kandungan,
      student: link.dokumen.student,
      diterbitOleh: link.dokumen.diterbitOleh?.nama ?? null,
    },
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const { token } = await params
  const link = await db.shareLink.findUnique({ where: { token } })
  if (!link || link.guardianId !== user.id) {
    return NextResponse.json({ ok: false, error: 'Pautan tidak dijumpai' }, { status: 404 })
  }
  await db.shareLink.update({
    where: { id: link.id },
    data: { dibatalkan: true },
  })
  await recordAudit({
    guardianId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'KONGSI',
    documentId: link.documentId,
    metadata: `Pautan ${token} dibatalkan`,
  })
  return NextResponse.json({ ok: true })
}
