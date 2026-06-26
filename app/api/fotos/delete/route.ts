import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { checkAdmin } = await import('@/lib/admin-guard')
    const { ok, soloLectura } = await checkAdmin()
    if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (soloLectura) return NextResponse.json({ error: 'Modo prueba: solo lectura' }, { status: 403 })

    const { ids } = await request.json()
    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'Faltan ids' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: fotos, error: selErr } = await sb
      .from('fotos_evento')
      .select('id, r2_key')
      .in('id', ids)
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 })

    const r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })

    await Promise.allSettled(
      (fotos ?? [])
        .filter(f => f.r2_key)
        .map(f => r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: f.r2_key })))
    )

    const { error: delErr } = await sb.from('fotos_evento').delete().in('id', ids)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    return NextResponse.json({ deleted: ids.length })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: 500 })
  }
}
