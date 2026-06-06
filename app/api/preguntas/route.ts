import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  nombre:   z.string().max(150).optional().nullable(),
  empresa:  z.string().max(150).optional().nullable(),
  ponente:  z.string().min(1).max(100),
  pregunta: z.string().min(5).max(1000),
}).refine(d => d.nombre || d.empresa, {
  message: 'Debes indicar tu nombre o empresa',
})

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? 'Datos inválidos'
    return NextResponse.json({ error: msg }, { status: 422 })
  }
  const supabase = await createClient()
  const { error } = await supabase.from('preguntas').insert(result.data)
  if (error) return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
