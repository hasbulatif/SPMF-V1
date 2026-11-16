import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSessionUser, recordAudit } from '@/lib/session'
import type { StaffRole } from '@/lib/auth'

// POST /api/auth/signup
// Pendaftaran akaun baharu untuk ibu bapa atau guru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      jenis, // 'GUARDIAN' | 'STAFF'
      nama,
      emel,
      password,
      confirmPassword,
      // Guardian fields
      noTelefon,
      hubungan, // IBU | BAPA | PENJAGA
      // Staff fields
      noPekerja,
    } = body

    // ===== Validasi asas =====
    if (!jenis || !['GUARDIAN', 'STAFF'].includes(jenis)) {
      return NextResponse.json(
        { ok: false, error: 'Jenis akaun tidak sah. Pilih Ibu Bapa atau Guru.' },
        { status: 400 }
      )
    }
    if (!nama || !nama.trim()) {
      return NextResponse.json({ ok: false, error: 'Nama diperlukan.' }, { status: 400 })
    }
    if (!emel || !emel.trim()) {
      return NextResponse.json({ ok: false, error: 'Emel diperlukan.' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'Kata laluan mesti sekurang-kurangnya 8 aksara.' },
        { status: 400 }
      )
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { ok: false, error: 'Kata laluan dan pengesahan tidak sepadan.' },
        { status: 400 }
      )
    }

    const emelLower = String(emel).toLowerCase().trim()

    // Validasi format emel
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emelLower)) {
      return NextResponse.json(
        { ok: false, error: 'Format emel tidak sah.' },
        { status: 400 }
      )
    }

    // ===== Pendaftaran Ibu Bapa =====
    if (jenis === 'GUARDIAN') {
      if (!noTelefon || !noTelefon.trim()) {
        return NextResponse.json({ ok: false, error: 'No. telefon diperlukan.' }, { status: 400 })
      }
      if (!hubungan || !['IBU', 'BAPA', 'PENJAGA'].includes(hubungan)) {
        return NextResponse.json(
          { ok: false, error: 'Hubungan tidak sah. Pilih Ibu, Bapa atau Penjaga.' },
          { status: 400 }
        )
      }

      // Semak emel telah wujud (dalam Guardian dan Staff)
      const existingGuardian = await db.guardian.findUnique({ where: { emel: emelLower } })
      if (existingGuardian) {
        return NextResponse.json(
          { ok: false, error: 'Emel ini telah didaftarkan sebagai ibu bapa. Sila log masuk.' },
          { status: 409 }
        )
      }
      const existingStaff = await db.staff.findUnique({ where: { emel: emelLower } })
      if (existingStaff) {
        return NextResponse.json(
          { ok: false, error: 'Emel ini telah didaftarkan sebagai staf sekolah.' },
          { status: 409 }
        )
      }

      // Cipta akaun ibu bapa
      const guardian = await db.guardian.create({
        data: {
          nama: String(nama).trim(),
          emel: emelLower,
          noTelefon: String(noTelefon).trim(),
          password: String(password),
          hubungan,
          status: 'AKTIF',
        },
      })

      // Auto-log masuk
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
        metadata: 'Pendaftaran akaun ibu bapa baharu',
      })

      return NextResponse.json({
        ok: true,
        user,
        message:
          'Pendaftaran berjaya! Akaun ibu bapa anda telah dicipta. Tiada anak dipautkan lagi — sila hubungi pejabat sekolah untuk memautkan akaun anak anda.',
      })
    }

    // ===== Pendaftaran Guru/Staf =====
    if (jenis === 'STAFF') {
      if (!noPekerja || !noPekerja.trim()) {
        return NextResponse.json(
          { ok: false, error: 'No. Pekerja diperlukan untuk akaun staf.' },
          { status: 400 }
        )
      }

      // Semak emel telah wujud
      const existingStaff = await db.staff.findUnique({ where: { emel: emelLower } })
      if (existingStaff) {
        return NextResponse.json(
          { ok: false, error: 'Emel ini telah didaftarkan sebagai staf. Sila log masuk.' },
          { status: 409 }
        )
      }
      const existingGuardian = await db.guardian.findUnique({ where: { emel: emelLower } })
      if (existingGuardian) {
        return NextResponse.json(
          { ok: false, error: 'Emel ini telah didaftarkan sebagai ibu bapa.' },
          { status: 409 }
        )
      }

      // Semak No. Pekerja unik
      const existingNoPekerja = await db.staff.findFirst({
        where: { noPekerja: String(noPekerja).trim() },
      })
      if (existingNoPekerja) {
        return NextResponse.json(
          { ok: false, error: 'No. Pekerja ini telah didaftarkan.' },
          { status: 409 }
        )
      }

      // Cipta akaun staf (default peranan: GURU)
      const staff = await db.staff.create({
        data: {
          nama: String(nama).trim(),
          emel: emelLower,
          password: String(password),
          peranan: 'GURU' as StaffRole,
          noPekerja: String(noPekerja).trim(),
        },
      })

      // Auto-log masuk
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
        metadata: 'Pendaftaran akaun guru baharu',
      })

      return NextResponse.json({
        ok: true,
        user,
        message:
          'Pendaftaran berjaya! Akaun guru anda telah dicipta dengan peranan Guru Kelas. Pentadbir sistem boleh menukar peranan anda jika perlu.',
      })
    }

    return NextResponse.json({ ok: false, error: 'Jenis akaun tidak sah.' }, { status: 400 })
  } catch (e) {
    console.error('Signup error:', e)
    return NextResponse.json(
      { ok: false, error: 'Ralat pelayan. Sila cuba lagi.' },
      { status: 500 }
    )
  }
}
