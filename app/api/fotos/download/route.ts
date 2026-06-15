import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  const nombre = request.nextUrl.searchParams.get('nombre') || 'foto.jpg'

  if (!url || !url.startsWith(process.env.R2_PUBLIC_URL!)) {
    return NextResponse.json({ error: 'URL no válida' }, { status: 400 })
  }

  const res = await fetch(url)
  if (!res.ok) return NextResponse.json({ error: 'No se pudo obtener la foto' }, { status: 502 })

  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${nombre.replace(/"/g, '')}"`,
      'Cache-Control': 'no-store',
    },
  })
}
