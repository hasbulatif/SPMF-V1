'use client'

import Image from 'next/image'

interface SchoolLogoProps {
  size?: number
  className?: string
  priority?: boolean
}

/**
 * Logo rasmi Sekolah Rendah Al Furqan (SRI Al Furqan)
 * Dimuatkan dari /public/logo-sekolah.png
 */
export function SchoolLogo({ size = 40, className = '', priority = false }: SchoolLogoProps) {
  return (
    <Image
      src="/logo-sekolah.png"
      alt="Logo Sekolah Rendah Al Furqan"
      width={size}
      height={size}
      priority={priority}
      className={`object-contain ${className}`}
    />
  )
}
