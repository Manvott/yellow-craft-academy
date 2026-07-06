import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  // Verificar sesión
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { session } } = await supabaseAuth.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: miRol } = await supabaseAuth.from('admin_roles').select('solo_lectura').eq('user_id', session.user.id).single()
  if (miRol?.solo_lectura) return NextResponse.json({ error: 'Modo prueba: solo lectura' }, { status: 403 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })

  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { user_id, email, secciones, es_superadmin, ver_costes, solo_lectura, suspendido } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 422 })

  const { error } = await adminClient.from('admin_roles').upsert({
    user_id, email, secciones, es_superadmin,
    ver_costes: ver_costes ?? true,
    solo_lectura: solo_lectura ?? false,
    suspendido: suspendido ?? false,
  }, { onConflict: 'user_id' })

  if (error) {
    console.error('guardar-permisos error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
