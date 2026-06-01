'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { headers } from 'next/headers'

const schema = z.object({
  nombre: z.string().min(2).max(150),
  empresa: z.string().max(150).optional().nullable(),
  perfil: z.string().max(100).optional().nullable(),
  email: z.string().email(),
  telefono: z.string().max(30).optional().nullable(),
  bloques: z.array(z.string()).optional().nullable(),
})

export async function registrarAsistente(formData: FormData) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  const raw = {
    nombre: formData.get('nombre') as string,
    empresa: (formData.get('empresa') as string) || null,
    perfil: (formData.get('perfil') as string) || null,
    email: formData.get('email') as string,
    telefono: (formData.get('telefono') as string) || null,
    bloques: formData.getAll('bloques') as string[],
  }

  const result = schema.safeParse({
    ...raw,
    bloques: raw.bloques.length ? raw.bloques : null,
  })

  if (!result.success) {
    return { ok: false, error: 'Datos inválidos. Revisa el formulario.' }
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
