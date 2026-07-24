import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface DestinatarioInvitacion {
  registro_id: string
  nombre: string
  telefono: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: rol } = await supabase.from('admin_roles').select('solo_lectura').eq('user_id', user.id).single()
  if (rol?.solo_lectura) return NextResponse.json({ error: 'Modo prueba: solo lectura' }, { status: 403 })

  const body = await request.json()
  const destinatarios: DestinatarioInvitacion[] = (Array.isArray(body.destinatarios) ? body.destinatarios : [])
    .filter((d: unknown): d is DestinatarioInvitacion =>
      !!d && typeof d === 'object' &&
      typeof (d as DestinatarioInvitacion).registro_id === 'string' && (d as DestinatarioInvitacion).registro_id.length > 0 &&
      typeof (d as DestinatarioInvitacion).nombre === 'string' && (d as DestinatarioInvitacion).nombre.length > 0 &&
      typeof (d as DestinatarioInvitacion).telefono === 'string' && (d as DestinatarioInvitacion).telefono.length > 0
    )
  if (destinatarios.length === 0) {
    return NextResponse.json({ error: 'Selecciona al menos un destinatario válido con teléfono.' }, { status: 400 })
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET
  if (!webhookUrl || !webhookSecret) {
    console.warn('N8N_WEBHOOK_URL o N8N_WEBHOOK_SECRET no configurados')
    return NextResponse.json({ error: 'La automatización de invitaciones no está configurada todavía.' }, { status: 500 })
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-YCA-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify({ destinatarios }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `n8n respondió con estado ${res.status}` }, { status: 502 })
    }

    return NextResponse.json({ ok: true, enviados: destinatarios.length })
  } catch (err) {
    console.error('Error llamando al webhook de n8n', err)
    return NextResponse.json({ error: 'No se pudo contactar con la automatización (n8n). Inténtalo de nuevo.' }, { status: 502 })
  }
}
