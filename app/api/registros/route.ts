import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  nombre: z.string().min(2).max(150),
  empresa: z.string().max(150).optional().nullable(),
  perfil: z.string().max(100).optional().nullable(),
  email: z.string().email(),
  telefono: z.string().max(30).optional().nullable(),
  bloques: z.array(z.string()).optional().nullable(),
})

const RATE_LIMIT = new Map<string, number>()

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const now = Date.now()
  const last = RATE_LIMIT.get(ip) ?? 0
  if (now - last < 5 * 60 * 1000) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  RATE_LIMIT.set(ip, now)

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('registros').insert({
    ...result.data,
    ip_origen: ip,
  })

  if (error) {
    console.error('registros insert error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

// CORS para permitir peticiones desde la landing (dominio externo)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
