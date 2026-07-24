import { createClient } from '@/lib/supabase/server'
import InvitacionEventoAdmin from '@/components/admin/InvitacionEventoAdmin'
import type { ConfiguracionInvitacionEvento } from '@/lib/tipos-invitacion-evento'

export default async function InvitacionEventoPage() {
  let config: ConfiguracionInvitacionEvento | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('configuracion_invitacion_evento')
      .select('*')
      .eq('activo', true)
      .limit(1)
      .maybeSingle()
    config = (data as ConfiguracionInvitacionEvento) ?? null
  } catch {}

  return (
    <div style={{ maxWidth: 700 }}>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>
        Comunicación
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.4rem', lineHeight: 1 }}>
        Invitación a nuevo evento
      </h1>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', marginBottom: '2rem', fontFamily: 'DM Sans, sans-serif' }}>
        Este mensaje se envía automáticamente por WhatsApp cuando un asistente de YCA responde a la invitación inicial. Usa {'{nombre}'} y {'{evento_nombre}'} como variables.
      </p>
      <InvitacionEventoAdmin config={config} />
    </div>
  )
}
