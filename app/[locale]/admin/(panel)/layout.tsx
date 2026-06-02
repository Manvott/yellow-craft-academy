import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/admin/LogoutButton'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  let session = null
  let userEmail = ''
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    session = data.session
    userEmail = data.session?.user?.email ?? ''
  } catch {}

  if (!session) redirect(`/${locale}/admin/login`)

  const navItems = [
    { href: `/${locale}/admin`, label: 'Dashboard' },
    { href: `/${locale}/admin/registros`, label: 'Asistentes' },
    { href: `/${locale}/admin/solicitudes`, label: 'Solicitudes' },
    { href: `/${locale}/admin/proveedores`, label: 'Marcas' },
    { href: `/${locale}/admin/productos`, label: 'Productos' },
    { href: `/${locale}/admin/pildoras`, label: 'Píldoras' },
    { href: `/${locale}/admin/ajustes`, label: '⚙ Ajustes' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--crema)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: 'var(--negro)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(247,243,238,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 28, height: 28, background: 'var(--amarillo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--negro)', letterSpacing: '0.05em' }}>YC</span>
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--crema)', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em' }}>Admin</p>
              <p style={{ fontSize: '0.58rem', color: 'rgba(247,243,238,0.3)', fontFamily: 'DM Sans, sans-serif' }}>Yellow Craft Academy</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0' }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block', padding: '0.65rem 1.25rem',
                fontSize: '0.72rem', color: 'rgba(247,243,238,0.5)',
                textDecoration: 'none', letterSpacing: '0.05em',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{ borderTop: '1px solid rgba(247,243,238,0.07)' }}>
          <Link
            href={`/${locale}/evento`}
            style={{ display: 'block', padding: '0.65rem 1.25rem', fontSize: '0.65rem', color: 'rgba(247,243,238,0.25)', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}
          >
            ← Ver portal
          </Link>

          {/* Usuario activo */}
          {userEmail && (
            <div style={{ padding: '0.5rem 1.25rem 0', borderTop: '1px solid rgba(247,243,238,0.05)' }}>
              <p style={{ fontSize: '0.6rem', color: 'rgba(247,243,238,0.2)', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </p>
            </div>
          )}

          {/* Botón cerrar sesión */}
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '3rem', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
