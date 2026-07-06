import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { session } } = await supabaseAuth.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Solo un superadmin (o usuario sin restricción) puede eliminar; nunca en modo prueba
  const { data: miRol } = await supabaseAuth.from('admin_roles').select('es_superadmin, solo_lectura').eq('user_id', session.user.id).single()
  if (miRol?.solo_lectura) return NextResponse.json({ error: 'Modo prueba: solo lectura' }, { status: 403 })
  if (!miRol?.es_superadmin) return NextResponse.json({ error: 'Solo un superadmin puede eliminar usuarios' }, { status: 403 })

  const { user_id } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 422 })
  if (user_id === session.user.id) return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })

  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  await adminClient.from('admin_roles').delete().eq('user_id', user_id)
  const { error } = await adminClient.auth.admin.deleteUser(user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
