import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const maxDuration = 10

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  const { nombre, tipo, sesion } = await request.json()
  if (!nombre || !tipo) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  const ext = nombre.split('.').pop() ?? 'jpg'
  const key = `${sesion ?? 'general'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key, ContentType: tipo }),
    { expiresIn: 300 }
  )

  return NextResponse.json({
    uploadUrl: url,
    key,
    publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
  })
}
