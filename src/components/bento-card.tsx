'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface BentoCardProps {
  title?: string
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
  className?: string
  accent?: 'default' | 'primary' | 'gold' | 'danger'
  span?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const spanClass: Record<NonNullable<BentoCardProps['span']>, string> = {
  sm: 'col-span-1',
  md: 'col-span-1 sm:col-span-2',
  lg: 'col-span-1 sm:col-span-2 lg:col-span-3',
  xl: 'col-span-1 sm:col-span-2 lg:col-span-4',
  full: 'col-span-1 sm:col-span-2 lg:col-span-4',
}

const accentStyles: Record<NonNullable<BentoCardProps['accent']>, string> = {
  default: 'border-border/60',
  primary: 'border-primary/20 bg-gradient-to-br from-primary/5 to-transparent',
  gold: 'border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-transparent',
  danger: 'border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent',
}

export function BentoCard({
  title,
  icon: Icon,
  action,
  children,
  className,
  accent = 'default',
  span = 'sm',
}: BentoCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden p-4 sm:p-5 transition-shadow hover:shadow-md',
        spanClass[span],
        accentStyles[accent],
        className
      )}
    >
      {(title || action || Icon) && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
            )}
            {title && (
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </Card>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  accent?: 'primary' | 'gold' | 'danger' | 'default'
}

export function StatCard({ label, value, icon: Icon, hint, accent = 'default' }: StatCardProps) {
  const accents: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    gold: 'bg-amber-100 text-amber-700',
    danger: 'bg-destructive/10 text-destructive',
    default: 'bg-muted text-muted-foreground',
  }
  return (
    <BentoCard span="sm" accent={accent === 'default' ? 'default' : accent === 'primary' ? 'primary' : accent === 'gold' ? 'gold' : 'danger'}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
          {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accents[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </BentoCard>
  )
}
