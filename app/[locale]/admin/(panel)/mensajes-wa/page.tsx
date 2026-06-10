import { createClient } from '@/lib/supabase/server'
import MensajesWAClient from '@/components/admin/MensajesWAClient'
import type { Plantilla, RegistroWA, Enviado } from '@/lib/tipos-mensajes-wa'

export default async function MensajesWAPage() {
  let plantillas: Plantilla[] = []
  let registros: RegistroWA[] = []
  let enviados: Enviado[] = []

  try {
    const supabase = await createClient()
    const [{ data: p }, { data: r }, { data: e }] = await Promise.all([
      supabase.from('mensajes_wa_plantillas').select('*').eq('activo', true).order('orden'),
      supabase.from('registros').select('id, nombre, empresa, isla, telefono, email').order('created_at', { ascending: false }),
      supabase.from('mensajes_wa_enviados').select('plantilla_id, registro_id'),
    ])
    plantillas = (p as Plantilla[]) ?? []
    registros = (r as RegistroWA[]) ?? []
    enviados = (e as Enviado[]) ?? []
  } catch {}

  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
        Comunicación
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.4rem', lineHeight: 1 }}>
        Mensajes WhatsApp
      </h1>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', marginBottom: '2rem', fontFamily: 'DM Sans, sans-serif' }}>
        Elige un mensaje, selecciona los destinatarios y marca cada envío realizado.
      </p>
      <MensajesWAClient plantillas={plantillas} registros={registros} enviados={enviados} />
    </div>
  )
}
