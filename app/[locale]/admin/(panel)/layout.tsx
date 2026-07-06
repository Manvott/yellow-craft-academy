import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SECCIONES_ADMIN } from '@/lib/admin-secciones'
import AdminShell from '@/components/admin/AdminShell'

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
  let secciones: string[] = []
  let esSuperadmin = false
  let soloLectura = false
  let suspendido = false

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    session = data.session
    userEmail = data.session?.user?.email ?? ''

    if (session) {
      const { data: rol } = await supabase
        .from('admin_roles')
        .select('secciones, es_superadmin, solo_lectura, suspendido')
        .eq('user_id', session.user.id)
        .single()

      if (rol) {
        secciones = rol.secciones ?? []
        esSuperadmin = rol.es_superadmin ?? false
        soloLectura = rol.solo_lectura ?? false
        suspendido = rol.suspendido ?? false
      } else {
        esSuperadmin = true
        secciones = SECCIONES_ADMIN.map(s => s.key)
      }
    }
  } catch {}

  if (!session) redirect(`/${locale}/admin/login`)

  if (suspendido) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--crema)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.75rem' }}>
          Cuenta suspendida
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif', maxWidth: 400, lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Tu acceso al panel está temporalmente suspendido. Contacta con un administrador si crees que es un error.
        </p>
        <a href={`/${locale}/admin/login`}
          style={{ background: 'var(--negro)', color: 'var(--crema)', padding: '0.65rem 1.5rem', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>
          Volver al inicio de sesión
        </a>
      </div>
    )
  }

  const navItems = [
    ...(esSuperadmin ? [{ href: `/${locale}/admin`, label: 'Dashboard' }] : []),
    ...SECCIONES_ADMIN
      .filter(s => esSuperadmin || secciones.includes(s.key))
      .map(s => ({
        href: `/${locale}/admin/${s.key}`,
        label: s.label,
      })),
  ]

  return (
    <AdminShell
      navItems={navItems}
      userEmail={userEmail}
      esSuperadmin={esSuperadmin}
      soloLectura={soloLectura}
      locale={locale}
    >
      {children}
    </AdminShell>
  )
}
