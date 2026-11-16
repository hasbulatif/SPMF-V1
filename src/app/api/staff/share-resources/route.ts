import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, recordAudit } from '@/lib/session'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10 MB

// Tukar URL Google Drive share kepada URL embed /preview
function toGooglePreviewUrl(url: string): { previewUrl: string | null; isValid: boolean } {
  try {
    const u = new URL(url)
    // Format: https://drive.google.com/file/d/FILE_ID/view?...
    const fileMatch = u.pathname.match(/\/file\/d\/([^/]+)/)
    if (fileMatch && fileMatch[1]) {
      const fileId = fileMatch[1]
      return {
        previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        isValid: true,
      }
    }
    // Format: https://drive.google.com/open?id=FILE_ID
    if (u.pathname === '/open' && u.searchParams.get('id')) {
      const fileId = u.searchParams.get('id')!
      return {
        previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        isValid: true,
      }
    }
    // Format lain - terima sahaja, guna URL asal dalam iframe (mungkin gagal embed)
    if (u.hostname.includes('drive.google.com') || u.hostname.includes('docs.google.com')) {
      return { previewUrl: url, isValid: true }
    }
    return { previewUrl: null, isValid: false }
  } catch {
    return { previewUrl: null, isValid: false }
  }
}

// GET - senarai semua bahan kongsi (staff view)
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.toLowerCase().trim()

  const resources = await db.sharedResource.findMany({
    where: q
      ? { OR: [{ tajuk: { contains: q } }, { keterangan: { contains: q } }] }
      : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      staff: { select: { nama: true } },
      student: { select: { id: true, nama: true, idMurid: true, tahun: true, kelas: { select: { id: true, nama: true } } } },
    },
  })

  // Untuk bahan kelas, dapatkan nama kelas berasingan (kerana kelasId tiada relasi langsung)
  const kelasIds = Array.from(new Set(resources.map((r) => r.kelasId).filter(Boolean))) as string[]
  const kelasList = await db.kelas.findMany({
    where: { id: { in: kelasIds } },
    select: { id: true, nama: true, tahun: true },
  })
  const kelasMap = new Map(kelasList.map((k) => [k.id, k]))

  return NextResponse.json({
    ok: true,
    resources: resources.map((r) => ({
      id: r.id,
      tajuk: r.tajuk,
      keterangan: r.keterangan,
      jenis: r.jenis,
      failUrl: r.failUrl,
      failName: r.failName,
      googleUrl: r.googleUrl,
      googlePreviewUrl: r.googlePreviewUrl,
      studentId: r.studentId,
      kelasId: r.kelasId,
      createdAt: r.createdAt,
      staff: r.staff?.nama ?? 'Tidak diketahui',
      student: r.student
        ? {
            id: r.student.id,
            nama: r.student.nama,
            idMurid: r.student.idMurid,
            kelas: r.student.kelas.nama,
          }
        : null,
      kelas: r.kelasId ? kelasMap.get(r.kelasId) : null,
      // label sasaran mudah papar
      sasaranLabel: r.studentId
        ? `${r.student?.nama ?? 'Murid'} (${r.student?.kelas.nama ?? ''})`
        : r.kelasId
        ? `Seluruh Kelas ${kelasMap.get(r.kelasId)?.nama ?? ''}`
        : 'Tiada sasaran',
    })),
  })
}

// POST - cipta bahan kongsi baru (PDF upload atau Google Drive link)
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.type !== 'STAFF') {
    return NextResponse.json({ ok: false, error: 'Tidak dibenarkan' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Format data tidak sah' }, { status: 400 })
  }

  const tajuk = String(formData.get('tajuk') ?? '').trim()
  const keterangan = String(formData.get('keterangan') ?? '').trim() || null
  const jenis = String(formData.get('jenis') ?? '')
  const target = String(formData.get('target') ?? 'student') // 'student' | 'class'
  const studentId = String(formData.get('studentId') ?? '') || null
  const kelasId = String(formData.get('kelasId') ?? '') || null
  const googleUrl = String(formData.get('googleUrl') ?? '').trim()

  if (!tajuk) {
    return NextResponse.json({ ok: false, error: 'Tajuk diperlukan.' }, { status: 400 })
  }
  if (!['PDF_UPLOAD', 'GOOGLE_DRIVE'].includes(jenis)) {
    return NextResponse.json({ ok: false, error: 'Jenis bahan tidak sah.' }, { status: 400 })
  }
  if (target === 'student' && !studentId) {
    return NextResponse.json({ ok: false, error: 'Pilih murid terlebih dahulu.' }, { status: 400 })
  }
  if (target === 'class' && !kelasId) {
    return NextResponse.json({ ok: false, error: 'Pilih kelas terlebih dahulu.' }, { status: 400 })
  }

  // Jika studentId diberi, dapatkan kelasId murid tersebut (denormalized untuk filter pantas)
  let finalKelasId = kelasId
  let finalStudentId = target === 'student' ? studentId : null
  if (finalStudentId) {
    const student = await db.student.findUnique({
      where: { id: finalStudentId },
      select: { kelasId: true },
    })
    if (!student) {
      return NextResponse.json({ ok: false, error: 'Murid tidak dijumpai.' }, { status: 404 })
    }
    finalKelasId = student.kelasId
  }

  let failUrl: string | null = null
  let failName: string | null = null
  let resolvedGoogleUrl: string | null = null
  let googlePreviewUrl: string | null = null

  if (jenis === 'PDF_UPLOAD') {
    const file = formData.get('fail') as File | null
    if (!file) {
      return NextResponse.json({ ok: false, error: 'Fail PDF diperlukan.' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ ok: false, error: 'Hanya fail PDF sahaja yang dibenarkan.' }, { status: 400 })
    }
    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { ok: false, error: `Saiz fail melebihi ${MAX_PDF_SIZE / 1024 / 1024} MB.` },
        { status: 400 }
      )
    }

    // Pastikan folder uploads wujud
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Nama fail unik: <timestamp>-<random>.pdf
    const safeExt = '.pdf'
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`
    const filePath = path.join(UPLOAD_DIR, uniqueName)
    const arrayBuffer = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(arrayBuffer))

    failUrl = `/uploads/${uniqueName}`
    failName = file.name
  } else if (jenis === 'GOOGLE_DRIVE') {
    if (!googleUrl) {
      return NextResponse.json({ ok: false, error: 'URL Google Drive diperlukan.' }, { status: 400 })
    }
    const result = toGooglePreviewUrl(googleUrl)
    if (!result.isValid) {
      return NextResponse.json(
        { ok: false, error: 'URL Google Drive tidak sah. Pastikan format seperti https://drive.google.com/file/d/.../view' },
        { status: 400 }
      )
    }
    resolvedGoogleUrl = googleUrl
    googlePreviewUrl = result.previewUrl
  }

  const resource = await db.sharedResource.create({
    data: {
      staffId: user.id,
      tajuk,
      keterangan,
      jenis,
      failUrl,
      failName,
      googleUrl: resolvedGoogleUrl,
      googlePreviewUrl,
      studentId: finalStudentId,
      kelasId: finalKelasId ?? null,
    },
  })

  // Jana notifikasi untuk ibu bapa yang terlibat
  const guardianFilter = finalStudentId
    ? { studentId: finalStudentId }
    : finalKelasId
    ? { student: { kelasId: finalKelasId } }
    : null

  if (guardianFilter) {
    const links = await db.guardianStudent.findMany({
      where: guardianFilter,
      select: { guardianId: true },
      distinct: ['guardianId'],
    })
    await Promise.all(
      links.map((l) =>
        db.notifikasi.create({
          data: {
            guardianId: l.guardianId,
            documentId: null,
            jenis: 'DOKUMEN_BAHARU',
            mesej: `Bahan baharu daripada guru: ${tajuk}`,
          },
        })
      )
    )
  }

  await recordAudit({
    staffId: user.id,
    userType: user.type,
    namaUser: user.nama,
    tindakan: 'KONGSI',
    metadata: `Bahan kongsi: ${tajuk} (${jenis})`,
  })

  return NextResponse.json({ ok: true, resourceId: resource.id })
}
