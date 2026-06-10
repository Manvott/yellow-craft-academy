'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

interface NavItem { href: string; label: string }

interface Props {
  navItems: NavItem[]
  userEmail: string
  esSuperadmin: boolean
  children: React.ReactNode
  locale: string
}

export default function AdminShell({ navItems, userEmail, esSuperadmin, children, locale }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Cerrar sidebar al navegar
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Cerrar al hacer clic fuera (overlay)
  function handleOverlay() { setSidebarOpen(false) }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--crema)', position: 'relative' }}>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div onClick={handleOverlay} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'var(--negro)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}
      className="admin-sidebar">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(247,243,238,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 28, height: 28, background: 'var(--amarillo)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--negro)' }}>YC</span>
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--crema)', fontFamily: 'DM Sans, sans-serif' }}>
                Admin {esSuperadmin && <span style={{ color: 'var(--amarillo)', fontSize: '0.6rem' }}>★</span>}
              </p>
              <p style={{ fontSize: '0.56rem', color: 'rgba(247,243,238,0.3)', fontFamily: 'DM Sans, sans-serif' }}>Yellow Craft Academy</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(247,243,238,0.4)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: '0.2rem' }}>
            ×
          </button>
        </div>

        <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== `/${locale}/admin` && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                style={{ display: 'block', padding: '0.7rem 1.25rem', fontSize: '0.75rem', color: active ? 'var(--amarillo)' : 'rgba(247,243,238,0.55)', textDecoration: 'none', letterSpacing: '0.05em', fontFamily: 'DM Sans, sans-serif', background: active ? 'rgba(247,243,238,0.05)' : 'transparent', borderLeft: active ? '2px solid var(--amarillo)' : '2px solid transparent', transition: 'all 0.15s' }}>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ borderTop: '1px solid rgba(247,243,238,0.07)' }}>
          <Link href={`/${locale}/evento`}
            style={{ display: 'block', padding: '0.65rem 1.25rem', fontSize: '0.65rem', color: 'rgba(247,243,238,0.25)', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            ← Ver portal
          </Link>
          {userEmail && (
            <div style={{ padding: '0.35rem 1.25rem 0', borderTop: '1px solid rgba(247,243,238,0.05)' }}>
              <p style={{ fontSize: '0.6rem', color: 'rgba(247,243,238,0.2)', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </p>
            </div>
          )}
          <LogoutButton />
        </div>
      </aside>

      {/* Topbar móvil */}
      <div className="admin-topbar" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, background: 'var(--negro)', padding: '0 1rem', height: 52, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(247,243,238,0.07)' }}>
        <button onClick={() => setSidebarOpen(true)}
          style={{ background: 'none', border: 'none', color: 'var(--crema)', cursor: 'pointer', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ display: 'block', width: 20, height: 2, background: 'var(--crema)' }} />
          <span style={{ display: 'block', width: 20, height: 2, background: 'var(--crema)' }} />
          <span style={{ display: 'block', width: 20, height: 2, background: 'var(--crema)' }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 22, height: 22, background: 'var(--amarillo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.5rem', fontWeight: 700, color: 'var(--negro)' }}>YC</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--crema)', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em' }}>Admin</span>
        </div>
        <div style={{ width: 32 }} />
      </div>

      {/* Main content */}
      <main className="admin-main" style={{ flex: 1, padding: '2.5rem', overflow: 'auto', marginLeft: 220, minWidth: 0, maxWidth: '100%' }}>
        {children}
      </main>

      <style>{`
        /* Desktop: sidebar siempre visible */
        @media (min-width: 769px) {
          .admin-sidebar {
            transform: translateX(0) !important;
            position: sticky !important;
            top: 0 !important;
            height: 100vh !important;
          }
        }

        /* Mobile: sidebar oculto, topbar visible */
        @media (max-width: 768px) {
          .admin-topbar { display: flex !important; }
          .admin-main { margin-left: 0 !important; padding: 4.5rem 1rem 2rem !important; }

          /* Tablas con scroll horizontal */
          .admin-main table { font-size: 0.75rem !important; }
          .admin-main th, .admin-main td { padding: 0.5rem 0.6rem !important; }

          /* Grids de stats → 2 columnas */
          .admin-main [style*="auto-fill, minmax(180px"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }

          /* Formularios → columna única */
          .admin-main [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          .admin-main [style*="repeat(3, 1fr)"] {
            grid-template-columns: 1fr 1fr !important;
          }
          .admin-main [style*="repeat(4,"] {
            grid-template-columns: 1fr 1fr !important;
          }

          /* Resúmenes bloques+islas → columna */
          .admin-main [style*="grid-template-columns: 1fr 1fr"][style*="marginBottom: '2rem'"] {
            grid-template-columns: 1fr !important;
          }

          /* Cabeceras con botón Excel → columna */
          .admin-main [style*="justifyContent: 'space-between'"][style*="alignItems: 'flex-end'"] {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
        }

        @media (max-width: 480px) {
          .admin-main { padding: 4rem 0.75rem 2rem !important; }
          .admin-main [style*="auto-fill, minmax(180px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
