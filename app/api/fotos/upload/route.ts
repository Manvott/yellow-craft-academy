import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const sesion = (formData.get('sesion') as string) || 'general'
    const subidoPor = (formData.get('subido_por') as string) || ''

    if (!file) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json({ error: 'Variables R2 no configuradas' }, { status: 500 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const key = `${sesion}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }))
    } catch (r2err: any) {
      return NextResponse.json({ error: `R2 error: ${r2err?.message}` }, { status: 500 })
    }

    const urlPublica = `${process.env.R2_PUBLIC_URL}/${key}`

    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await sb.from('fotos_evento').insert({
      nombre_archivo: file.name,
      url_publica: urlPublica,
      r2_key: key,
      subido_por: subidoPor || null,
      sesion,
      tamano_bytes: file.size,
    }).select('id').single()

    if (error) return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 })

    return NextResponse.json({ id: data.id, url: urlPublica })
  } catch (err: any) {
    return NextResponse.json({ error: `Unexpected: ${err?.message}` }, { status: 500 })
  }
}
