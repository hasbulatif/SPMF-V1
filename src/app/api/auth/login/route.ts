import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSessionUser, recordAudit } from '@/lib/session'
import type { StaffRole } from '@/lib/auth'

// Had cubaan log masuk gagal (FR-04)
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 15

interface AttemptRecord {
  count: number
  lockedUntil: number | null
}
const attempts = new Map<string, AttemptRecord>()

export async function POST(req: NextRequest) {
  try {
    const { emel, password } = await req.json()
    if (!emel || !password) {
      return NextResponse.json(
        { ok: false, error: 'Emel dan kata laluan diperlukan.' },
        { status: 400 }
      )
    }

    const emelLower = String(emel).toLowerCase().trim()
    const key = emelLower

    // Semak kunci akaun sementara
    const record = attempts.get(key)
    if (record?.lockedUntil && record.lockedUntil > Date.now()) {
      const mins = Math.ceil((record.lockedUntil - Date.now()) / 60000)
      return NextResponse.json(
        {
          ok: false,
          error: `Akaun dikunci sementara. Cuba lagi selepas ${mins} minit.`,
          locked: true,
        },
        { status: 429 }
      )
    }

    // Cari guardian dahulu
    const guardian = await db.guardian.findUnique({
      where: { emel: emelLower },
    })

    if (guardian) {
      if (guardian.status === 'DISEKAT') {
        return NextResponse.json(
          { ok: false, error: 'Akaun ini telah disekat. Sila hubungi pejabat sekolah.' },
          { status: 403 }
        )
      }
      if (guardian.password !== password) {
        const rec = attempts.get(key) ?? { count: 0, lockedUntil: null }
        rec.count += 1
        if (rec.count >= MAX_FAILED_ATTEMPTS) {
          rec.lockedUntil = Date.now() + LOCK_DURATION_MINUTES * 60_000
          attempts.set(key, rec)
          return NextResponse.json(
            {
              ok: false,
              error: `Akaun dikunci selama ${LOCK_DURATION_MINUTES} minit selepas ${MAX_FAILED_ATTEMPTS} cubaan gagal.`,
              locked: true,
            },
            { status: 429 }
          )
        }
        attempts.set(key, rec)
        const remaining = MAX_FAILED_ATTEMPTS - rec.count
        return NextResponse.json(
          {
            ok: false,
            error: `Kata laluan salah. ${remaining} cubaan lagi sebelum akaun dikunci.`,
          },
          { status: 401 }
        )
      }

      // Berjaya - reset attempts
      attempts.delete(key)

      const user = {
        id: guardian.id,
        type: 'GUARDIAN' as const,
        nama: guardian.nama,
        emel: guardian.emel,
        hubungan: guardian.hubungan,
      }
      await setSessionUser(user)
      await recordAudit({
        guardianId: guardian.id,
        userType: 'GUARDIAN',
        namaUser: guardian.nama,
        tindakan: 'LOG_MASUK',
      })
      return NextResponse.json({ ok: true, user })
    }

    // Cari staff
    const staff = await db.staff.findUnique({
      where: { emel: emelLower },
    })

    if (staff) {
      if (staff.password !== password) {
        const rec = attempts.get(key) ?? { count: 0, lockedUntil: null }
        rec.count += 1
        if (rec.count >= MAX_FAILED_ATTEMPTS) {
          rec.lockedUntil = Date.now() + LOCK_DURATION_MINUTES * 60_000
          attempts.set(key, rec)
          return NextResponse.json(
            {
              ok: false,
              error: `Akaun dikunci selama ${LOCK_DURATION_MINUTES} minit selepas ${MAX_FAILED_ATTEMPTS} cubaan gagal.`,
              locked: true,
            },
            { status: 429 }
          )
        }
        attempts.set(key, rec)
        const remaining = MAX_FAILED_ATTEMPTS - rec.count
        return NextResponse.json(
          {
            ok: false,
            error: `Kata laluan salah. ${remaining} cubaan lagi sebelum akaun dikunci.`,
          },
          { status: 401 }
        )
      }

      attempts.delete(key)
      const user = {
        id: staff.id,
        type: 'STAFF' as const,
        nama: staff.nama,
        emel: staff.emel,
        peranan: staff.peranan as StaffRole,
      }
      await setSessionUser(user)
      await recordAudit({
        staffId: staff.id,
        userType: 'STAFF',
        namaUser: staff.nama,
        tindakan: 'LOG_MASUK',
      })
      return NextResponse.json({ ok: true, user })
    }

    // Tidak ditemui
    return NextResponse.json(
      {
        ok: false,
        error: 'Emel tidak didaftarkan. Sila hubungi pejabat sekolah.',
      },
      { status: 404 }
    )
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json(
      { ok: false, error: 'Ralat pelayan. Sila cuba lagi.' },
      { status: 500 }
    )
  }
}
