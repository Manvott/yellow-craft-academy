'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function getVisitorId(): string {
  try {
    let id = localStorage.getItem('yca_vid')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('yca_vid', id)
    }
    return id
  } catch {
    return 'anon'
  }
}

function detectarDispositivo(ua: string): string {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'movil' : 'escritorio'
}

function detectarNavegador(ua: string): string {
  if (/Edg\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/Chrome\//.test(ua)) return 'Chrome'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Otro'
}

export default function TrackVisita() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || pathname.includes('/admin')) return
    const ua = navigator.userAgent
    const locale = pathname.split('/')[1] || ''
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        ruta: pathname,
        referrer: document.referrer || null,
        dispositivo: detectarDispositivo(ua),
        navegador: detectarNavegador(ua),
        locale,
        visitor_id: getVisitorId(),
      }),
    }).catch(() => {})
  }, [pathname])

  return null
}
