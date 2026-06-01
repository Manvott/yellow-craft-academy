'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { headers } from 'next/headers'

const schema = z.object({
  nombre: z.string().min(2).max(150),
  empresa: z.string().max(150).optional().nullable(),
  cargo: z.string().max(100).optional().nullable(),
  perfil: z.string().max(100).optional().nullable(),
  email: z.string().email(),
  telefono: z.string().max(30).optional().nullable(),
  isla: z.string().max(50).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  primera_vez: z.boolean(),
  cliente_ava: z.boolean(),
  bloques: z.array(z.string()).optional().nullable(),
  acepta_whatsapp: z.boolean(),
})

export async function registrarAsistente(formData: FormData) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  const raw = {
    nombre:        formData.get('nombre') as string,
    empresa:       (formData.get('empresa') as string) || null,
    cargo:         (formData.get('cargo') as string) || null,
    perfil:        (formData.get('perfil') as string) || null,
    email:         formData.get('email') as string,
    telefono:      (formData.get('telefono') as string) || null,
    isla:          (formData.get('isla') as string) || null,
    instagram:     (formData.get('instagram') as string) || null,
    primera_vez:   formData.get('primera_vez') === 'si',
    cliente_ava:   formData.get('cliente_ava') === 'si',
    bloques:       formData.getAll('bloques') as string[],
    acepta_whatsapp: formData.get('whatsapp_canal') === 'on',
  }

  const result = schema.safeParse({
    ...raw,
    bloques: raw.bloques.length ? raw.bloques : null,
  })

  if (!result.success) {
    return { ok: false, error: 'Datos inválidos. Revisa el formulario.' }
  }

  if (!result.data.acepta_whatsapp) {
    return { ok: false, error: 'Debes aceptar el canal de WhatsApp para reservar tu plaza.' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('registros').insert({
      ...result.data,
      ip_origen: ip,
    })
    if (error) throw error
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error al guardar. Inténtalo de nuevo.' }
  }
}
