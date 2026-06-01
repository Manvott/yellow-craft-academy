'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale() {
    const next = locale === 'es' ? 'en' : 'es'
    router.push(pathname.replace(`/${locale}`, `/${next}`))
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '1.25rem 2.5rem',
      background: 'rgba(247,243,238,0.94)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
    }}>
      <Link href={`/${locale}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <svg viewBox="0 0 560 560" xmlns="http://www.w3.org/2000/svg" style={{ width: 36, height: 36 }}>
          <circle cx="280" cy="280" r="268" fill="#F0EAE0"/>
          <circle cx="280" cy="92" r="32" fill="#F5C518"/>
          <text x="280" y="242" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="72" fontWeight="200" letterSpacing="7" fill="#0A0A08" textAnchor="middle" dominantBaseline="middle">YELLOW</text>
          <text x="280" y="318" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="60" fontWeight="600" letterSpacing="14" fill="#0A0A08" textAnchor="middle" dominantBaseline="middle">CRAFT</text>
          <text x="280" y="378" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="18" fontWeight="400" letterSpacing="9" fill="#0A0A08" textAnchor="middle" dominantBaseline="middle" opacity="0.38">ACADEMY</text>
        </svg>
        <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
          Organizado por AVA · Lanzarote
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link href={`/${locale}`} style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>
          {t('productos')}
        </Link>
        <Link href={`/${locale}/pildoras`} style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>
          {t('pildoras')}
        </Link>
        <button
          onClick={switchLocale}
          style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'var(--negro)', color: 'var(--crema)', padding: '0.4rem 1rem', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
        >
          {locale === 'es' ? 'EN' : 'ES'}
        </button>
      </div>
    </nav>
  )
}
