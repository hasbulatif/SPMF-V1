import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, recordAudit } from '@/lib/session'
import { KATEGORI_LABEL, STATUS_LABEL } from '@/lib/auth'

// GET /api/staff/documents - senarai dokumen untuk pengurusan staff
// POST /api/staff/documents - cipta dokumen baru (jana dari templat)
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const kategori = searchParams.get('kategori')
  const studentId = searchParams.get('studentId')
  const q = searchParams.get('q')?.toLowerCase().trim()

  const docs = await db.dokumen.findMany({
    where: {
      ...(status && status !== 'ALL' ? { status } : {}),
      ...(kategori && kategori !== 'ALL' ? { kategori } : {}),
      ...(studentId ? { studentId } : {}),
      ...(q ? { tajuk: { contains: q } } : {}),
    },
    orderBy: { createdAt: 'desc' },
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
    take: 100,
  })

  return NextResponse.json({
    ok: true,
    documents: docs.map((d) => ({
      id: d.id,
      tajuk: d.tajuk,
      kategori: d.kategori,
      kategoriLabel: KATEGORI_LABEL[d.kategori] ?? d.kategori,
      penggal: d.penggal,
      tahun: d.tahun,
      tarikh: d.tarikh,
      status: d.status,
      statusLabel: STATUS_LABEL[d.status] ?? d.status,
      createdAt: d.createdAt,
      student: d.student,
      diterbitOleh: d.diterbitOleh?.nama ?? null,
    })),
  })
}

// Templat kandungan ringkas
function buildTemplateContent(
  kategori: string,
  tajuk: string,
  student: { nama: string; idMurid: string; tahun: number },
  penggal?: string
): string {
  const base = `# ${tajuk}\n\n**Sekolah Rendah Al Furqan Shah Alam**\n`
  const meta = `\n| Butiran | Maklumat |\n|---|---|\n| Nama Murid | ${student.nama} |\n| No. Pendaftaran | ${student.idMurid} |\n| Tahun | ${student.tahun} |\n${penggal ? `| Penggal | ${penggal} |\n` : ''}\n_Kandungan dokumen ini dijana sebagai draf dan boleh disunting sebelum diterbitkan._\n`
  return base + meta
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  const body = await req.json()
  const { studentId, kategori, tajuk, penggal, kandungan, status, target } = body as {
    studentId?: string
    kategori: string
    tajuk: string
    penggal?: string
    kandungan?: string
    status?: string
    target?: 'student' | 'class' | 'year'
  }

  if (!kategori || !tajuk) {
    return NextResponse.json({ ok: false, error: 'Kategori dan tajuk diperlukan.' }, { status: 400 })
  }

  const initialStatus = status ?? 'DRAFT'
  const tahun = new Date().getFullYear()
  const penggalValue = penggal || null

  // Jika target student - buat satu dokumen
  if (target === 'student' || !target) {
    if (!studentId) {
      return NextResponse.json({ ok: false, error: 'Pilih murid terlebih dahulu.' }, { status: 400 })
    }
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { kelas: true },
    })
    if (!student) {
      return NextResponse.json({ ok: false, error: 'Murid tidak dijumpai.' }, { status: 404 })
    }
    const content =
      kandungan ?? buildTemplateContent(kategori, tajuk, student, penggalValue ?? undefined)

    const doc = await db.dokumen.create({
      data: {
        studentId: student.id,
        kategori,
        tajuk,
        penggal: penggalValue,
        tahun,
        status: initialStatus,
        kandungan: content,
        diterbitOlehId: user.id,
      },
    })
    await recordAudit({
      staffId: user.id,
      userType: user.type,
      namaUser: user.nama,
      tindakan: 'TERBIT',
      documentId: doc.id,
      metadata: `Cipta dokumen ${tajuk} untuk ${student.nama}`,
    })
    return NextResponse.json({ ok: true, documentId: doc.id })
  }

  // Target class atau year
  const { kelasId, tahunYear } = body as { kelasId?: string; tahunYear?: number }
  let studentFilter: { kelasId?: string; tahun?: number } = {}
  if (target === 'class') {
    if (!kelasId) return NextResponse.json({ ok: false, error: 'Pilih kelas.' }, { status: 400 })
    studentFilter = { kelasId }
  } else if (target === 'year') {
    if (!tahunYear) return NextResponse.json({ ok: false, error: 'Pilih tahun.' }, { status: 400 })
    studentFilter = { tahun: tahunYear }
  }

  const students = await db.student.findMany({ where: studentFilter })
  if (students.length === 0) {
    return NextResponse.json({ ok: false, error: 'Tiada murid dalam pilihan.' }, { status: 400 })
  }

  const created = await Promise.all(
    students.map((s) =>
      db.dokumen.create({
        data: {
          studentId: s.id,
          kategori,
          tajuk,
          penggal: penggalValue,
          tahun,
          status: initialStatus,
          kandungan:
            kandungan ??
            buildTemplateContent(kategori, tajuk, s, penggalValue ?? undefined),
          diterbitOlehId: user.id,
        },
      })
    )
  )

  await recordAudit({
    staffId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'TERBIT',
    metadata: `Cipta ${created.length} dokumen ${tajuk} (${target})`,
  })

  return NextResponse.json({ ok: true, count: created.length })
}

// PATCH - kemaskini status dokumen (aliran kerja)
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const { id, status, kandungan } = await req.json()
  if (!id) return NextResponse.json({ ok: false, error: 'ID diperlukan' }, { status: 400 })

  // Hanya PK/Admin boleh lulus/tolak/terbit
  const flowActions = ['DILULUSKAN', 'DITARIK', 'DITERBITKAN', 'SEMAKAN']
  if (flowActions.includes(status) && !['PENOLONG_KANAN', 'ADMIN'].includes(user.peranan ?? '')) {
    // Guru boleh hantar ke SEMAKAN sahaja
    if (status === 'SEMAKAN' && user.peranan === 'GURU') {
      // ok
    } else {
      return NextResponse.json(
        { ok: false, error: 'Anda tidak mempunyai kebenaran untuk tindakan ini.' },
        { status: 403 }
      )
    }
  }

  const updated = await db.dokumen.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(kandungan !== undefined ? { kandungan } : {}),
    },
  })

  const tindakan =
    status === 'DITERBITKAN'
      ? 'TERBIT'
      : status === 'DILULUSKAN'
      ? 'LULUS'
      : status === 'DITARIK'
      ? 'TOLAK'
      : 'TERBIT'

  await recordAudit({
    staffId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan,
    documentId: id,
    metadata: `Status: ${status}`,
  })

  // Jika diterbitkan, jana notifikasi untuk guardian
  if (status === 'DITERBITKAN') {
    const guardians = await db.guardianStudent.findMany({
      where: { studentId: updated.studentId },
      select: { guardianId: true },
    })
    await Promise.all(
      guardians.map((g) =>
        db.notifikasi.create({
          data: {
            guardianId: g.guardianId,
            documentId: updated.id,
            jenis: 'DOKUMEN_BAHARU',
            mesej: `Dokumen baharu: ${updated.tajuk}`,
          },
        })
      )
    )
  }

  return NextResponse.json({ ok: true, document: { id: updated.id, status: updated.status } })
}
