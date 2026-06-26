import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: rol } = await supabase.from('admin_roles').select('solo_lectura').eq('user_id', user.id).single()
  if (rol?.solo_lectura) return NextResponse.json({ error: 'Modo prueba: solo lectura' }, { status: 403 })

  const { id, asistio } = await request.json()
  if (!id || typeof asistio !== 'boolean') {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await admin
    .from('registros')
    .update({ asistio })
    .eq('id', id)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
