import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 10

export async function POST(request: NextRequest) {
  const { checkAdmin } = await import('@/lib/admin-guard')
  const { ok, soloLectura } = await checkAdmin()
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (soloLectura) return NextResponse.json({ error: 'Modo prueba: solo lectura' }, { status: 403 })

  const { nombre_archivo, url_publica, r2_key, sesion, subido_por, tamano_bytes } = await request.json()
  if (!nombre_archivo || !url_publica || !r2_key) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await sb.from('fotos_evento').insert({
    nombre_archivo,
    url_publica,
    r2_key,
    sesion: sesion || 'general',
    subido_por: subido_por || null,
    tamano_bytes: tamano_bytes ?? 0,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
