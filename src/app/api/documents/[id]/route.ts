import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getSessionUser,
  guardianHasDocumentAccess,
  recordAudit,
} from '@/lib/session'
import { KATEGORI_LABEL, STATUS_LABEL } from '@/lib/auth'

// GET /api/documents/[id] - butiran dokumen + kandungan
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sesi tamat' }, { status: 401 })
  }

  const doc = await db.dokumen.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          nama: true,
          idMurid: true,
          tahun: true,
          kelas: { select: { nama: true } },
        },
      },
      diterbitOleh: { select: { nama: true } },
    },
  })

  if (!doc) {
    return NextResponse.json({ ok: false, error: 'Dokumen tidak dijumpai' }, { status: 404 })
  }

  // Kebenaran akses
  let canAccess = false
  if (user.type === 'GUARDIAN') {
    canAccess = await guardianHasDocumentAccess(user.id, id)
  } else {
    // Staff boleh lihat semua dokumen
    canAccess = true
  }

  if (!canAccess) {
    return NextResponse.json(
      { ok: false, error: 'Akses ditolak. Anda tidak mempunyai kebenaran untuk dokumen ini.' },
      { status: 403 }
    )
  }

  // Catat audit (LIHAT_DOKUMEN)
  if (user.type === 'GUARDIAN') {
    await recordAudit({
      guardianId: user.id,
      userType: user.type,
      namaUser: user.nama,
      tindakan: 'LIHAT_DOKUMEN',
      documentId: doc.id,
    })
  }

  return NextResponse.json({
    ok: true,
    document: {
      id: doc.id,
      tajuk: doc.tajuk,
      kategori: doc.kategori,
      kategoriLabel: KATEGORI_LABEL[doc.kategori] ?? doc.kategori,
      penggal: doc.penggal,
      tahun: doc.tahun,
      tarikh: doc.tarikh,
      status: doc.status,
      statusLabel: STATUS_LABEL[doc.status] ?? doc.status,
      kandungan: doc.kandungan,
      ringkasan: doc.ringkasan,
      student: doc.student,
      diterbitOleh: doc.diterbitOleh?.nama ?? null,
      createdAt: doc.createdAt,
    },
  })
}
