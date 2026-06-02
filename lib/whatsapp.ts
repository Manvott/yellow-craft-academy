/**
 * WhatsApp Cloud API — Meta
 * Env vars requeridas (solo servidor, sin NEXT_PUBLIC_):
 *   WHATSAPP_TOKEN        — token permanente de la app Meta
 *   WHATSAPP_PHONE_ID     — Phone Number ID del número verificado
 */

const WA_API = 'https://graph.facebook.com/v20.0'

interface EnvioConfirmacion {
  nombre: string
  telefono: string   // formato internacional: +34612345678
  isla?: string | null
  empresa?: string | null
}

export async function enviarConfirmacionPlaza(datos: EnvioConfirmacion): Promise<void> {
  const token   = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneId) {
    console.warn('[WA] Variables WHATSAPP_TOKEN / WHATSAPP_PHONE_ID no configuradas — omitiendo envío.')
    return
  }

  // Normalizar número: quitar + y espacios → "34612345678"
  const to = datos.telefono.replace(/\D/g, '')

  const cuerpo = [
    `¡Hola ${datos.nombre}! ✅`,
    ``,
    `Tu plaza en *Yellow Craft Academy* está confirmada.`,
    ``,
    `📅 15 de junio de 2026`,
    `📍 Sala Ocean · Puerto del Carmen · Lanzarote`,
    `⏰ 9:30h – 21:00h`,
    ``,
    `Acceso profesional · entrada gratuita.`,
    ``,
    `¿Dudas? Escríbenos a marketing@avaseleccion.com`,
    ``,
    `— Equipo AVA 🌊`,
  ].join('\n')

  const res = await fetch(`${WA_API}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: cuerpo, preview_url: false },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[WA] Error al enviar confirmación:', JSON.stringify(err))
  } else {
    console.log(`[WA] Confirmación enviada a ${to} (${datos.nombre})`)
  }
}
