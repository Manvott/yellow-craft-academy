import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { solicitudSchema } from '@/lib/validations'

const RATE_LIMIT = new Map<string, number>()

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  // Simple in-memory rate limit: 1 request per IP per 15 minutes
  const now = Date.now()
  const last = RATE_LIMIT.get(ip) ?? 0
  if (now - last < 15 * 60 * 1000) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  RATE_LIMIT.set(ip, now)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = solicitudSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('solicitudes_info').insert({
    ...result.data,
    ip_origen: ip,
  })

  if (error) {
    console.error('solicitudes insert error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
