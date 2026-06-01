import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect(`/${locale}/admin/login`)

  const navItems = [
    { href: `/${locale}/admin`, label: 'Dashboard' },
    { href: `/${locale}/admin/solicitudes`, label: 'Solicitudes' },
    { href: `/${locale}/admin/proveedores`, label: 'Proveedores' },
    { href: `/${locale}/admin/productos`, label: 'Productos' },
    { href: `/${locale}/admin/pildoras`, label: 'Píldoras' },
  ]

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-gray-900 font-black text-xs">YC</span>
            </div>
            <span className="font-bold text-sm">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <Link
            href={`/${locale}`}
            className="block px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
          >
            ← Ver portal
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
