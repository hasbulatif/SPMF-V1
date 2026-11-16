// Server-side auth helper untuk API routes
import { cookies } from 'next/headers'
import { db } from './db'
import type { SessionUser } from './auth'

const SESSION_COOKIE = 'spmf_session'
const SESSION_DURATION_DAYS = 30

export function getSessionCookieName() {
  return SESSION_COOKIE
}

export function getSessionDurationDays() {
  return SESSION_DURATION_DAYS
}

// Baca sesi daripada cookie
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SessionUser
    return parsed
  } catch {
    return null
  }
}

// Tetapkan sesi (dipanggil selepas log masuk berjaya)
export async function setSessionUser(user: SessionUser) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

// Padam sesi (log keluar)
export async function clearSessionUser() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// Catat audit log
export async function recordAudit(params: {
  staffId?: string | null
  guardianId?: string | null
  userType: string
  namaUser: string
  tindakan: string
  documentId?: string | null
  metadata?: string | null
  peranti?: string | null
  ip?: string | null
}) {
  try {
    await db.auditLog.create({
      data: {
        staffId: params.staffId ?? null,
        guardianId: params.guardianId ?? null,
        userType: params.userType,
        namaUser: params.namaUser,
        tindakan: params.tindakan,
        documentId: params.documentId ?? null,
        metadata: params.metadata ?? null,
        peranti: params.peranti ?? null,
        ip: params.ip ?? null,
      },
    })
  } catch (e) {
    console.error('Gagal mencatat audit log:', e)
  }
}

// Semakan akses guardian ke murid tertentu (RBAC - FR-06)
export async function guardianHasStudentAccess(
  guardianId: string,
  studentId: string
): Promise<boolean> {
  const link = await db.guardianStudent.findUnique({
    where: {
      guardianId_studentId: { guardianId, studentId },
    },
  })
  return !!link
}

// Semakan akses guardian ke dokumen (hanya boleh akses dokumen anak sendiri - UAT-02)
export async function guardianHasDocumentAccess(
  guardianId: string,
  documentId: string
): Promise<boolean> {
  const doc = await db.dokumen.findUnique({
    where: { id: documentId },
    select: { studentId: true, status: true },
  })
  if (!doc) return false
  if (doc.status !== 'DITERBITKAN') return false
  return guardianHasStudentAccess(guardianId, doc.studentId)
}
