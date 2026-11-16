'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserType = 'GUARDIAN' | 'STAFF'
export type StaffRole = 'GURU' | 'PENOLONG_KANAN' | 'KERANI' | 'ADMIN'

export interface SessionUser {
  id: string
  type: UserType
  nama: string
  emel: string
  peranan?: StaffRole
  hubungan?: string
}

interface SessionState {
  user: SessionUser | null
  setUser: (u: SessionUser | null) => void
  clear: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      clear: () => set({ user: null }),
    }),
    { name: 'spmf-session' }
  )
)

// Aplikasi "view router" - single-page, semua navigasi di-handle dengan state
export type AppView =
  | { name: 'login' }
  | { name: 'parent-dashboard' }
  | { name: 'parent-documents'; studentId?: string }
  | { name: 'parent-document-preview'; documentId: string }
  | { name: 'parent-share-links' }
  | { name: 'parent-notifications' }
  | { name: 'staff-dashboard' }
  | { name: 'staff-documents' }
  | { name: 'staff-document-preview'; documentId: string }
  | { name: 'staff-document-edit'; documentId: string }
  | { name: 'staff-document-create' }
  | { name: 'staff-students' }
  | { name: 'staff-guardians' }
  | { name: 'staff-classes' }
  | { name: 'staff-audit-logs' }
  | { name: 'shared-document'; token: string }

interface ViewState {
  view: AppView
  setView: (v: AppView) => void
}

export const useView = create<ViewState>((set) => ({
  view: { name: 'login' },
  setView: (v) => set({ view: v }),
}))
