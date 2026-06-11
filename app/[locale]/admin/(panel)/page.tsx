import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SECCIONES_ADMIN } from '@/lib/admin-secciones'
import Link from 'next/link'

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Solo superadmin puede ver el dashboard
  let redirectTo: string | null = null
  try {
    const supabase = await createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) {
      const { data: rol } = await supabase
        .from('admin_roles')
        .select('secciones, es_superadmin')
        .eq('user_id', sessionData.session.user.id)
        .single()

      const esSuperadmin = rol ? (rol.es_superadmin ?? false) : true
      if (!esSuperadmin) {
        const secciones: string[] = rol?.secciones ?? []
        const primera = SECCIONES_ADMIN.find(s => !s.soloSuperadmin && secciones.includes(s.key))
        redirectTo = `/${locale}/admin/${primera?.key ?? 'registros'}`
      }
    }
  } catch {}

  if (redirectTo) redirect(redirectTo)

  let counts = { registros: 0, solicitudes: 0, proveedores: 0, productos: 0, pildoras: 0 }
  try {
    const supabase = await createClient()
    const [r, s, prov, prod, pil] = await Promise.all([
      supabase.from('registros').select('*', { count: 'exact', head: true }),
      supabase.from('solicitudes_info').select('*', { count: 'exact', head: true }),
      supabase.from('proveedores').select('*', { count: 'exact', head: true }),
      supabase.from('productos').select('*', { count: 'exact', head: true }),
      supabase.from('pildoras').select('*', { count: 'exact', head: true }),
    ])
    counts = {
      registros: r.count ?? 0,
      solicitudes: s.count ?? 0,
      proveedores: prov.count ?? 0,
      productos: prod.count ?? 0,
      pildoras: pil.count ?? 0,
    }
  } catch {}

  const stats = [
    { label: 'Asistentes registrados', value: counts.registros, href: `/${locale}/admin/registros`, accent: true },
    { label: 'Solicitudes de producto', value: counts.solicitudes, href: `/${locale}/admin/solicitudes`, accent: false },
    { label: 'Proveedores', value: counts.proveedores, href: `/${locale}/admin/proveedores`, accent: false },
    { label: 'Productos', value: counts.productos, href: `/${locale}/admin/productos`, accent: false },
    { label: 'Píldoras', value: counts.pildoras, href: `/${locale}/admin/pildoras`, accent: false },
  ]

  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>
        Yellow Craft Academy · 15 junio 2026
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '3rem', lineHeight: 1 }}>
        Panel de administración
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {stats.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: s.accent ? 'var(--amarillo)' : 'var(--blanco)',
              border: '1px solid var(--crema3)',
              padding: '1.5rem',
            }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: 'var(--negro)', lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--gris)', marginTop: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
                {s.label}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
