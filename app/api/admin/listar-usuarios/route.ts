import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { session } } = await supabaseAuth.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ users: [] })

  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const { data: roles } = await adminClient.from('admin_roles').select('*')

  // Fusionar auth users con sus roles
  const merged = users.map(u => {
    const rol = roles?.find(r => r.user_id === u.id)
    return {
      user_id: u.id,
      email: u.email ?? '',
      secciones: rol?.secciones ?? ['registros', 'solicitudes', 'fichas', 'pildoras'],
      es_superadmin: rol?.es_superadmin ?? false,
      es_yo: u.id === session.user.id,
    }
  })

  return NextResponse.json({ users: merged })
}
