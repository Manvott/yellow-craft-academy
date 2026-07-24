import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: rol } = await supabase.from('admin_roles').select('solo_lectura').eq('user_id', user.id).single()
  if (rol?.solo_lectura) return NextResponse.json({ error: 'Modo prueba: solo lectura' }, { status: 403 })

  const body = await request.json()
  const eventoNombre = typeof body.evento_nombre === 'string' ? body.evento_nombre.trim() : ''
  const mensaje = typeof body.mensaje === 'string' ? body.mensaje.trim() : ''
  const imagenUrl = typeof body.imagen_url === 'string' ? body.imagen_url.trim() : ''
  const configId = typeof body.id === 'string' ? body.id : null

  if (!eventoNombre || !mensaje) {
    return NextResponse.json({ error: 'El nombre del evento y el mensaje son obligatorios.' }, { status: 400 })
  }

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const payload = {
    evento_nombre: eventoNombre,
    mensaje,
    imagen_url: imagenUrl || null,
    activo: true,
  }

  const { error } = configId
    ? await admin.from('configuracion_invitacion_evento').update(payload).eq('id', configId)
    : await admin.from('configuracion_invitacion_evento').insert(payload)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
