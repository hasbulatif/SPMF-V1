'use client'

import { ReactNode } from 'react'
import { useSession, useView, AppView } from '@/lib/store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  School,
  LayoutDashboard,
  FileText,
  Share2,
  Bell,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getInisial, STAFF_ROLE_LABEL } from '@/lib/api'

interface NavItem {
  label: string
  icon: ReactNode
  view: AppView
  match: string[]
}

const parentNav: NavItem[] = [
  { label: 'Papan Pemuka', icon: <LayoutDashboard className="h-4 w-4" />, view: { name: 'parent-dashboard' }, match: ['parent-dashboard'] },
  { label: 'Dokumen', icon: <FileText className="h-4 w-4" />, view: { name: 'parent-documents' }, match: ['parent-documents', 'parent-document-preview'] },
  { label: 'Pautan Kongsi', icon: <Share2 className="h-4 w-4" />, view: { name: 'parent-share-links' }, match: ['parent-share-links'] },
  { label: 'Notifikasi', icon: <Bell className="h-4 w-4" />, view: { name: 'parent-notifications' }, match: ['parent-notifications'] },
]

const staffNav: NavItem[] = [
  { label: 'Papan Pemuka', icon: <LayoutDashboard className="h-4 w-4" />, view: { name: 'staff-dashboard' }, match: ['staff-dashboard'] },
  { label: 'Dokumen', icon: <FileText className="h-4 w-4" />, view: { name: 'staff-documents' }, match: ['staff-documents', 'staff-document-preview', 'staff-document-edit'] },
  { label: 'Cipta Dokumen', icon: <FileText className="h-4 w-4" />, view: { name: 'staff-document-create' }, match: ['staff-document-create'] },
  { label: 'Murid', icon: <School className="h-4 w-4" />, view: { name: 'staff-students' }, match: ['staff-students'] },
  { label: 'Ibu Bapa', icon: <School className="h-4 w-4" />, view: { name: 'staff-guardians' }, match: ['staff-guardians'] },
  { label: 'Kelas', icon: <School className="h-4 w-4" />, view: { name: 'staff-classes' }, match: ['staff-classes'] },
  { label: 'Log Audit', icon: <Bell className="h-4 w-4" />, view: { name: 'staff-audit-logs' }, match: ['staff-audit-logs'] },
]

interface ShellProps {
  children: ReactNode
  notificationsBadge?: number
}

export function AppShell({ children, notificationsBadge = 0 }: ShellProps) {
  const { user, clear } = useSession()
  const { view, setView } = useView()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { toast } = useToast()

  const nav = user?.type === 'GUARDIAN' ? parentNav : staffNav

  // Tutup sidebar mobile bila view berubah (handler dipanggil dari nav click)
  function handleNavClick(item: NavItem) {
    setView(item.view)
    setMobileOpen(false)
  }

  async function handleLogout() {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {}
    clear()
    setView({ name: 'login' })
    toast({ title: 'Log keluar berjaya' })
  }

  function isActive(item: NavItem) {
    return item.match.includes(view.name)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <button
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Tukar menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <button
          onClick={() => setView(user?.type === 'GUARDIAN' ? { name: 'parent-dashboard' } : { name: 'staff-dashboard' })}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <School className="h-5 w-5" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-bold leading-tight">SPMF</div>
            <div className="text-[10px] text-muted-foreground leading-tight">Al Furqan Shah Alam</div>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Tukar tema"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user?.type === 'GUARDIAN' && notificationsBadge > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => setView({ name: 'parent-notifications' })}
            >
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">
                {notificationsBadge}
              </Badge>
            </Button>
          )}

          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-medium leading-tight">{user?.nama}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {user?.type === 'STAFF'
                ? STAFF_ROLE_LABEL[user.peranan ?? '']
                : user?.hubungan ?? 'Ibu Bapa'}
            </span>
          </div>
          <Avatar className="h-8 w-8 border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInisial(user?.nama ?? '')}
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout} aria-label="Log keluar">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-sidebar/40 p-3 gap-1">
          {nav.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive(item)
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Sidebar mobile */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-background border-r border-border p-3 flex flex-col gap-1 animate-in slide-in-from-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="rounded p-1 hover:bg-accent">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {nav.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive(item)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Footer sticky */}
      <footer className="mt-auto border-t border-border bg-background px-4 py-3 text-center text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Sekolah Rendah Al Furqan Shah Alam · SPMF v1.0 (Prototaip)</span>
      </footer>
    </div>
  )
}
