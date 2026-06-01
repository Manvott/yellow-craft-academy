import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()

  const [
    { count: registros },
    { count: solicitudes },
    { count: proveedores },
    { count: productos },
    { count: pildoras },
  ] = await Promise.all([
    supabase.from('registros').select('*', { count: 'exact', head: true }),
    supabase.from('solicitudes_info').select('*', { count: 'exact', head: true }),
    supabase.from('proveedores').select('*', { count: 'exact', head: true }),
    supabase.from('productos').select('*', { count: 'exact', head: true }),
    supabase.from('pildoras').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Asistentes registrados', value: registros ?? 0, href: `/${locale}/admin/registros`, accent: true },
    { label: 'Solicitudes de producto', value: solicitudes ?? 0, href: `/${locale}/admin/solicitudes`, accent: false },
    { label: 'Proveedores', value: proveedores ?? 0, href: `/${locale}/admin/proveedores`, accent: false },
    { label: 'Productos', value: productos ?? 0, href: `/${locale}/admin/productos`, accent: false },
    { label: 'Píldoras', value: pildoras ?? 0, href: `/${locale}/admin/pildoras`, accent: false },
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
              transition: 'border-color 0.2s',
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
