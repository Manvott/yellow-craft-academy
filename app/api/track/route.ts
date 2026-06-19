import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { ruta, referrer, dispositivo, navegador, locale, visitor_id } = await request.json()
    if (!ruta) return NextResponse.json({ error: 'Falta ruta' }, { status: 400 })

    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await sb.from('visitas_log').insert({
      ruta: String(ruta).slice(0, 300),
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      dispositivo: dispositivo ?? null,
      navegador: navegador ? String(navegador).slice(0, 120) : null,
      locale: locale ?? null,
      visitor_id: visitor_id ? String(visitor_id).slice(0, 60) : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
