import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  if (!body.nombre?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: 'Nombre y email son obligatorios.' }, { status: 400 })
  }

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await admin.from('registros').insert({
    nombre:   body.nombre.trim(),
    empresa:  body.empresa?.trim() || null,
    email:    body.email.trim(),
    telefono: body.telefono?.trim() || null,
    isla:     body.isla || null,
    bloques:  body.bloques ?? [],
    origen:   'admin',
    primera_vez: false,
    cliente_ava: false,
    acepta_whatsapp: false,
    wa_confirmado: false,
    wa_mensaje_enviado: false,
    asistio: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
