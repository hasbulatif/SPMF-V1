import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'
import { KATEGORI_LABEL } from '@/lib/auth'

// GET /api/guardian/documents?studentId=...&kategori=...&penggal=...&tahun=...&q=...
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'GUARDIAN') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const kategori = searchParams.get('kategori')
  const penggal = searchParams.get('penggal')
  const tahun = searchParams.get('tahun')
  const q = searchParams.get('q')?.toLowerCase().trim()

  // Senarai anak yang sah
  const links = await db.guardianStudent.findMany({
    where: { guardianId: user.id },
    select: { studentId: true },
  })
  const allowedStudentIds = links.map((l) => l.studentId)

  if (studentId && !allowedStudentIds.includes(studentId)) {
    return NextResponse.json(
      { ok: false, error: 'Akses ditolak. Anda tidak mempunyai akses kepada murid ini.' },
      { status: 403 }
    )
  }

  const targetStudentIds = studentId ? [studentId] : allowedStudentIds

  const docs = await db.dokumen.findMany({
    where: {
      studentId: { in: targetStudentIds },
      status: 'DITERBITKAN',
      ...(kategori && kategori !== 'ALL' ? { kategori } : {}),
      ...(penggal && penggal !== 'ALL' ? { penggal } : {}),
      ...(tahun && tahun !== 'ALL' ? { tahun: Number(tahun) } : {}),
      ...(q
        ? { tajuk: { contains: q } }
        : {}),
    },
    orderBy: { tarikh: 'desc' },
    include: {
      student: { select: { id: true, nama: true, idMurid: true, tahun: true, kelas: { select: { nama: true } } } },
    },
  })

  // Senarai dokumen yang telah dibaca oleh guardian ini
  const readDocs = await db.dokumenBaca.findMany({
    where: { guardianId: user.id },
    select: { documentId: true },
  })
  const readSet = new Set(readDocs.map((r) => r.documentId))

  const result = docs.map((d) => ({
    id: d.id,
    tajuk: d.tajuk,
    kategori: d.kategori,
    kategoriLabel: KATEGORI_LABEL[d.kategori] ?? d.kategori,
    penggal: d.penggal,
    tahun: d.tahun,
    tarikh: d.tarikh,
    status: d.status,
    dibaca: readSet.has(d.id),
    baharu: !readSet.has(d.id),
    student: {
      id: d.student.id,
      nama: d.student.nama,
      idMurid: d.student.idMurid,
      tahun: d.student.tahun,
      kelas: d.student.kelas.nama,
    },
  }))

  // Senarai nilai penapis yang tersedia
  const kategoriOptions = Array.from(new Set(docs.map((d) => d.kategori)))
  const penggalOptions = Array.from(new Set(docs.map((d) => d.penggal).filter(Boolean))) as string[]
  const tahunOptions = Array.from(new Set(docs.map((d) => d.tahun)))

  return NextResponse.json({
    ok: true,
    documents: result,
    filters: {
      kategori: kategoriOptions.map((k) => ({ value: k, label: KATEGORI_LABEL[k] ?? k })),
      penggal: penggalOptions,
      tahun: tahunOptions,
    },
  })
}
