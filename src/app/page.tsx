'use client'

import { useEffect, useState } from 'react'
import { useSession, useView } from '@/lib/store'
import { api } from '@/lib/api'
import { LoginView } from '@/components/views/login-view'
import { ParentShell } from '@/components/shells/parent-shell'
import { StaffShell } from '@/components/shells/staff-shell'
import { ShareAccessView } from '@/components/views/share-access-view'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const [booting, setBooting] = useState(true)
  const { user, setUser } = useSession()
  const { view, setView } = useView()

  // Boot - semak sesi sedia ada + semak ?share=token
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const url = new URL(window.location.href)
        const shareToken = url.searchParams.get('share')
        if (shareToken) {
          setView({ name: 'shared-document', token: shareToken })
          setBooting(false)
          return
        }
        // Restore session
        const me = await api<{ ok: boolean; user?: { type: string } }>('/api/auth/me')
        if (!cancelled && me.ok && me.user) {
          setUser(me.user as never)
          // Auto-route berasaskan jenis pengguna
          const u = me.user as { type: string }
          setView(
            u.type === 'GUARDIAN'
              ? { name: 'parent-dashboard' }
              : { name: 'staff-dashboard' }
          )
        }
      } catch {
        // tiada sesi - kekal di login
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm">Memuatkan SPMF...</div>
        </div>
      </div>
    )
  }

  // Jika ada token perkongsian - papar halaman PIN akses (bebas login)
  if (view.name === 'shared-document') {
    return <ShareAccessView token={view.token} />
  }

  // Jika tidak log masuk - papar login
  if (!user) {
    return <LoginView />
  }

  // Routing berasaskan jenis pengguna
  if (user.type === 'GUARDIAN') {
    return <ParentShell />
  }
  return <StaffShell />
}
