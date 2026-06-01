import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()

  const [
    { count: solicitudes },
    { count: proveedores },
    { count: productos },
    { count: pildoras },
  ] = await Promise.all([
    supabase.from('solicitudes_info').select('*', { count: 'exact', head: true }),
    supabase.from('proveedores').select('*', { count: 'exact', head: true }),
    supabase.from('productos').select('*', { count: 'exact', head: true }),
    supabase.from('pildoras').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Solicitudes', value: solicitudes ?? 0, href: `/${locale}/admin/solicitudes`, color: 'bg-yellow-400' },
    { label: 'Proveedores', value: proveedores ?? 0, href: `/${locale}/admin/proveedores`, color: 'bg-blue-100' },
    { label: 'Productos', value: productos ?? 0, href: `/${locale}/admin/productos`, color: 'bg-green-100' },
    { label: 'Píldoras', value: pildoras ?? 0, href: `/${locale}/admin/pildoras`, color: 'bg-purple-100' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-8">Panel de administración</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}>
            <div className={`${s.color} rounded-2xl p-6 hover:opacity-80 transition-opacity`}>
              <p className="text-3xl font-black text-gray-900">{s.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
