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

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    session = data.session
    userEmail = data.session?.user?.email ?? ''

    if (session) {
      const { data: rol } = await supabase
        .from('admin_roles')
        .select('secciones, es_superadmin')
        .eq('user_id', session.user.id)
        .single()

      if (rol) {
        secciones = rol.secciones ?? []
        esSuperadmin = rol.es_superadmin ?? false
      } else {
        esSuperadmin = true
        secciones = SECCIONES_ADMIN.map(s => s.key)
      }
    }
  } catch {}

  if (!session) redirect(`/${locale}/admin/login`)

  const navItems = [
    { href: `/${locale}/admin`, label: 'Dashboard' },
    ...SECCIONES_ADMIN
      .filter(s => {
        if (s.soloSuperadmin) return esSuperadmin
        return esSuperadmin || secciones.includes(s.key)
      })
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
      locale={locale}
    >
      {children}
    </AdminShell>
  )
}
