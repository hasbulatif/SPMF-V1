// API client wrapper untuk fetch dengan error handling
export interface ApiError {
  ok: false
  error: string
  locked?: boolean
}

export interface ApiSuccess<T> {
  ok: true
  data?: T
  [key: string]: unknown
}

export async function api<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })
  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new Error(`Ralat pelayan (${res.status})`)
  }
  if (!res.ok || (json as { ok?: boolean }).ok === false) {
    const err = (json as ApiError).error ?? `Ralat pelayan (${res.status})`
    const e = new Error(err) as Error & { locked?: boolean }
    e.locked = (json as ApiError).locked
    throw e
  }
  return json as T
}

// Helper constants
export const KATEGORI_OPTIONS: { value: string; label: string }[] = [
  { value: 'LAPORAN_KEMAJUAN', label: 'Laporan Kemajuan Murid' },
  { value: 'SLIP_KEPUTUSAN', label: 'Slip Keputusan Peperiksaan' },
  { value: 'SURAT_PENGESAHAN', label: 'Surat Pengesahan Murid' },
  { value: 'SURAT_EDARAN', label: 'Surat Edaran Sekolah' },
  { value: 'RESIT_YURAN', label: 'Resit Yuran' },
  { value: 'REKOD_KEHADIRAN', label: 'Rekod Kehadiran' },
  { value: 'SIJIL', label: 'Sijil dan Anugerah' },
  { value: 'BORANG', label: 'Borang Kebenaran / Maklum Balas' },
]

export const KATEGORI_LABEL: Record<string, string> = Object.fromEntries(
  KATEGORI_OPTIONS.map((k) => [k.value, k.label])
)

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'DRAFT', label: 'Draf' },
  { value: 'SEMAKAN', label: 'Semakan' },
  { value: 'DILULUSKAN', label: 'Diluluskan' },
  { value: 'DITERBITKAN', label: 'Diterbitkan' },
  { value: 'DITARIK', label: 'Ditarik Balik' },
]

export const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.label])
)

export const STAFF_ROLE_LABEL: Record<string, string> = {
  GURU: 'Guru Kelas',
  PENOLONG_KANAN: 'Penolong Kanan',
  KERANI: 'Kerani Pejabat',
  ADMIN: 'Pentadbir Sistem',
}

// Format tarikh Bahasa Malaysia
export function formatTarikh(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTarikhMasa(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relatifMasa(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const diff = Date.now() - date.getTime()
  const minit = Math.floor(diff / 60000)
  if (minit < 1) return 'Baru saja'
  if (minit < 60) return `${minit} minit lalu`
  const jam = Math.floor(minit / 60)
  if (jam < 24) return `${jam} jam lalu`
  const hari = Math.floor(jam / 24)
  if (hari < 30) return `${hari} hari lalu`
  return formatTarikh(date)
}

// Inisial dari nama
export function getInisial(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Nama fail PDF piawai: JenisDokumen_IDMurid_Penggal.pdf
export function buildPdfFileName(
  kategori: string,
  idMurid: string,
  penggal?: string | null
): string {
  const jenisMap: Record<string, string> = {
    LAPORAN_KEMAJUAN: 'LaporanKemajuan',
    SLIP_KEPUTUSAN: 'SlipKeputusan',
    SURAT_PENGESAHAN: 'SuratPengesahan',
    SURAT_EDARAN: 'SuratEdaran',
    RESIT_YURAN: 'ResitYuran',
    REKOD_KEHADIRAN: 'RekodKehadiran',
    SIJIL: 'Sijil',
    BORANG: 'Borang',
  }
  const jenis = jenisMap[kategori] ?? 'Dokumen'
  const penggalSuffix = penggal ? `_Penggal${penggal}` : ''
  return `${jenis}_${idMurid}${penggalSuffix}.pdf`
}
