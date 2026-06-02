import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const MAX_ADMIN_USERS = 5 // 1 principal + 4 adicionales

export async function POST(request: NextRequest) {
  // Verificar que quien llama es admin autenticado
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { session } } = await supabaseAuth.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Usar service role para crear usuarios
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Configuración incompleta en servidor' }, { status: 500 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Límite de usuarios
  const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers()
  if (listErr) return NextResponse.json({ error: 'Error al verificar usuarios' }, { status: 500 })
  if (users.length >= MAX_ADMIN_USERS) {
    return NextResponse.json({ error: `Límite de ${MAX_ADMIN_USERS} administradores alcanzado.` }, { status: 400 })
  }

  const { email, password } = await request.json()
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Email y contraseña (mín. 8 caracteres) requeridos.' }, { status: 422 })
  }

  const { error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
