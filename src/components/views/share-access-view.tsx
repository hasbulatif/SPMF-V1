'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { School, Lock, AlertCircle, Loader2, ArrowLeft, Printer, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DocumentMarkdown } from '@/components/document-markdown'
import { SchoolHeader } from '@/components/school-header'
import { formatTarikh } from '@/lib/api'

interface SharePreview {
  tajuk: string
  kategori: string
  tarikh: string
  student: { nama: string; idMurid: string; tahun: number; kelas: { nama: string } }
  tarikhLuput: string
  cubaanGagal: number
  hadCubaan: number
}

interface SharedDocument {
  id: string
  tajuk: string
  kategori: string
  penggal: string | null
  tahun: number
  tarikh: string
  kandungan: string
  student: { nama: string; idMurid: string; tahun: number; kelas: { nama: string } }
  diterbitOleh: string | null
}

export function ShareAccessView({ token }: { token: string }) {
  const { toast } = useToast()
  const [preview, setPreview] = useState<SharePreview | null>(null)
  const [doc, setDoc] = useState<SharedDocument | null>(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api<{ ok: boolean; preview: SharePreview }>(`/api/share/${token}`)
        if (!cancelled) {
          setPreview(res.preview)
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleVerify() {
    if (pin.length !== 6) {
      toast({ title: 'PIN tidak lengkap', description: 'Masukkan 6 digit PIN.', variant: 'destructive' })
      return
    }
    setVerifying(true)
    setError(null)
    try {
      const res = await api<{ ok: boolean; document: SharedDocument }>(`/api/share/${token}`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      })
      setDoc(res.document)
      toast({ title: 'Akses diberikan', description: 'Dokumen kini boleh dilihat.' })
    } catch (e) {
      const err = e as Error & { locked?: boolean }
      setError(err.message)
      setLocked(!!err.locked)
      // Refresh cubaanGagal
      try {
        const r = await api<{ ok: boolean; preview: SharePreview }>(`/api/share/${token}`)
        setPreview(r.preview)
      } catch {}
      setPin('')
    } finally {
      setVerifying(false)
    }
  }

  function handleBackHome() {
    window.location.href = '/'
  }

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm">Memuatkan pautan perkongsian...</div>
        </div>
      </div>
    )
  }

  // Jika ada error awal (link tidak sah/tamat tempoh/dibatalkan)
  if (error && !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-center">Pautan Tidak Sah</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={handleBackHome} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Laman Utama
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Jika PIN belum disahkan
  if (!doc && preview) {
    const remaining = preview.hadCubaan - preview.cubaanGagal
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 p-4 pattern-bg">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <School className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold">Sekolah Rendah Al Furqan</div>
                <div className="text-[11px] text-muted-foreground">Shah Alam</div>
              </div>
            </div>
            <CardTitle className="text-xl">Akses Dokumen Berkongsi</CardTitle>
            <p className="text-sm text-muted-foreground">
              Dokumen ini dilindungi PIN. Sila masukkan PIN 6 digit yang diberikan oleh ibu bapa/penjaga.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
              <div className="text-[11px] uppercase text-muted-foreground tracking-wide">Dokumen</div>
              <div className="text-sm font-medium">{preview.tajuk}</div>
              <div className="text-xs text-muted-foreground">
                {preview.student.nama} · {preview.student.kelas.nama}
              </div>
              <div className="text-[11px] text-muted-foreground pt-1">
                Pautan sah sehingga: {formatTarikh(preview.tarikhLuput)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Masukkan PIN</label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={pin}
                  onChange={(v) => setPin(v)}
                  disabled={verifying || locked}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {preview.cubaanGagal > 0 && (
              <div className="text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                {remaining} cubaan PIN lagi sebelum pautan dikunci.
              </div>
            )}

            <Button
              onClick={handleVerify}
              className="w-full h-11"
              disabled={verifying || locked || pin.length !== 6}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengesahkan...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" /> Sahkan PIN
                </>
              )}
            </Button>

            <Button onClick={handleBackHome} variant="ghost" className="w-full text-xs">
              <ArrowLeft className="mr-2 h-3 w-3" /> Kembali ke Laman Utama
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Jika PIN disahkan - papar dokumen
  if (!doc) return null
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
        <Button onClick={handleBackHome} variant="ghost" size="sm">
          <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="mr-1 h-4 w-4" /> Cetak
          </Button>
          <Button
            onClick={() => {
              handlePrint()
              toast({ title: 'Pilih "Save as PDF"', description: 'Dalam dialog cetakan, pilih Save as PDF sebagai destinasi.' })
            }}
            size="sm"
          >
            <Download className="mr-1 h-4 w-4" /> PDF
          </Button>
        </div>
      </header>

      <div className="py-6 px-4">
        <div className="a4-paper print-area mx-auto">
          <div className="watermark" aria-hidden />
          <SchoolHeader />
          <div className="mb-4 rounded border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
            <div className="font-semibold mb-1">Maklumat Dokumen</div>
            <div className="grid grid-cols-2 gap-1">
              <span>Tajuk:</span><span className="font-medium">{doc.tajuk}</span>
              <span>Murid:</span><span className="font-medium">{doc.student.nama} ({doc.student.idMurid})</span>
              <span>Kelas:</span><span className="font-medium">{doc.student.kelas.nama}</span>
              <span>Tarikh:</span><span className="font-medium">{formatTarikh(doc.tarikh)}</span>
            </div>
          </div>
          <DocumentMarkdown content={doc.kandungan} />
          <div className="mt-6 border-t border-neutral-300 pt-3 text-[10px] text-neutral-500 text-center">
            Dokumen ini dikongsikan melalui Sistem Pengurusan Murid Al Furqan (SPMF) · Salinan Ibu Bapa
          </div>
        </div>
      </div>
    </div>
  )
}
