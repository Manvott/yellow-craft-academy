'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const locale = useLocale()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/admin/login`)
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        width: '100%', padding: '0.65rem 1.25rem',
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '0.72rem', color: 'rgba(247,243,238,0.35)',
        fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em',
        textAlign: 'left',
        transition: 'color 0.2s',
        opacity: loading ? 0.5 : 1,
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,243,238,0.35)')}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      {loading ? 'Saliendo...' : 'Cerrar sesión'}
    </button>
  )
}
