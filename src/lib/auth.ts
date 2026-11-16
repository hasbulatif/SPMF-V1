// Utiliti auth untuk SPMF (dummy / prototype only)
// AMARAN: ini bukan untuk pengeluaran - pengesahan pelayan sebenar diperlukan.

import crypto from 'crypto'

// Hash ringkas untuk PIN prototype (jangan guna untuk password sebenar)
export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

export function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash
}

// Penghasilan token sesi ringkas
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Penghasilan token perkongsian
export function generateShareToken(): string {
  return 'spmf-' + crypto.randomBytes(12).toString('hex')
}

// Penghasilan PIN 6 digit
export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Jenis pengguna yang disokong sistem
export type UserType = 'GUARDIAN' | 'STAFF'
export type StaffRole = 'GURU' | 'PENOLONG_KANAN' | 'KERANI' | 'ADMIN'

export interface SessionUser {
  id: string
  type: UserType
  nama: string
  emel: string
  // Untuk staff
  peranan?: StaffRole
  // Untuk guardian
  hubungan?: string
}

// Pemetaan peranan staff ke label BM
export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  GURU: 'Guru Kelas',
  PENOLONG_KANAN: 'Penolong Kanan',
  KERANI: 'Kerani Pejabat',
  ADMIN: 'Pentadbir Sistem',
}

// Pemetaan kategori dokumen ke label BM
export const KATEGORI_LABEL: Record<string, string> = {
  LAPORAN_KEMAJUAN: 'Laporan Kemajuan Murid',
  SLIP_KEPUTUSAN: 'Slip Keputusan Peperiksaan',
  SURAT_PENGESAHAN: 'Surat Pengesahan Murid',
  SURAT_EDARAN: 'Surat Edaran Sekolah',
  RESIT_YURAN: 'Resit Yuran',
  REKOD_KEHADIRAN: 'Rekod Kehadiran',
  SIJIL: 'Sijil dan Anugerah',
  BORANG: 'Borang Kebenaran / Maklum Balas',
}

// Pemetaan status dokumen ke label BM
export const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draf',
  SEMAKAN: 'Semakan',
  DILULUSKAN: 'Diluluskan',
  DITERBITKAN: 'Diterbitkan',
  DITARIK: 'Ditarik Balik',
}

// Pemetaan status dokumen ke warna badge
export const STATUS_VARIANT: Record<string, string> = {
  DRAFT: 'secondary',
  SEMAKAN: 'outline',
  DILULUSKAN: 'default',
  DITERBITKAN: 'default',
  DITARIK: 'destructive',
}
