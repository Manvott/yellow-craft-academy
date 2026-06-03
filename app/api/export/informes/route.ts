import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx'

type InformeType =
  | 'inscritos'
  | 'asistencia'
  | 'por-isla'
  | 'por-perfil'
  | 'por-bloque'
  | 'solicitudes'
  | 'productos'
  | 'resumen'

async function getSession() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  return supabase.auth.getSession()
}

function colWidths(widths: number[]) {
  return widths.map(w => ({ wch: w }))
}

function headerStyle() {
  return { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '0A0A08' } }, alignment: { horizontal: 'center' } }
}

function addHeaders(ws: XLSX.WorkSheet, headers: string[], row = 1) {
  headers.forEach((h, i) => {
    const cell = XLSX.utils.encode_cell({ r: row - 1, c: i })
    if (!ws[cell]) ws[cell] = { v: h, t: 's' }
    ws[cell].s = headerStyle()
  })
}

export async function GET(request: NextRequest) {
  const { data: { session } } = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const tipo = request.nextUrl.searchParams.get('tipo') as InformeType
  if (!tipo) return NextResponse.json({ error: 'Tipo requerido' }, { status: 400 })

  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const wb = XLSX.utils.book_new()
  const fecha = new Date().toLocaleDateString('es-ES')

  // ── 1. INSCRITOS COMPLETO ────────────────────────────────────────────────────
  if (tipo === 'inscritos') {
    const { data } = await sb.from('registros').select('*').order('created_at', { ascending: false })
    const rows = (data ?? []).map((r: any) => ({
      'Fecha inscripción': new Date(r.created_at).toLocaleString('es-ES'),
      'Nombre': r.nombre,
      'Empresa': r.empresa ?? '',
      'Cargo': r.cargo ?? '',
      'Perfil profesional': r.perfil ?? '',
      'Isla': r.isla ?? '',
      'Email': r.email,
      'Teléfono': r.telefono ?? '',
      'Instagram': r.instagram ?? '',
      'Primera vez AVA': r.primera_vez ? 'Sí' : 'No',
      'Cliente AVA': r.cliente_ava ? 'Sí' : 'No',
      'Bloques seleccionados': (r.bloques ?? []).join(' | '),
      'Canal WA': r.acepta_whatsapp ? 'Sí' : 'No',
      'En lista WA': r.wa_confirmado ? 'Sí' : 'No',
      'Asistió al evento': r.asistio ? 'Sí' : 'No',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = colWidths([20, 28, 24, 18, 20, 14, 28, 16, 18, 14, 12, 60, 10, 12, 12])
    addHeaders(ws, Object.keys(rows[0] ?? {}))
    XLSX.utils.book_append_sheet(wb, ws, 'Inscritos')
  }

  // ── 2. CONTROL DE ASISTENCIA ────────────────────────────────────────────────
  if (tipo === 'asistencia') {
    const { data } = await sb.from('registros').select('nombre, empresa, isla, telefono, email, asistio, bloques').order('nombre')
    const rows = (data ?? []).map((r: any) => ({
      'Nombre': r.nombre,
      'Empresa': r.empresa ?? '',
      'Isla': r.isla ?? '',
      'Teléfono': r.telefono ?? '',
      'Email': r.email,
      'Asistió': r.asistio ? '✓ Sí' : '✗ No',
      'Bloques': (r.bloques ?? []).join(' | '),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = colWidths([28, 24, 14, 16, 28, 10, 60])
    addHeaders(ws, Object.keys(rows[0] ?? {}))
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia')
  }

  // ── 3. POR ISLA ─────────────────────────────────────────────────────────────
  if (tipo === 'por-isla') {
    const { data } = await sb.from('registros').select('nombre, empresa, isla, perfil, asistio, wa_confirmado')
    const islas: Record<string, any[]> = {}
    ;(data ?? []).forEach((r: any) => {
      const isla = r.isla ?? 'Sin especificar'
      if (!islas[isla]) islas[isla] = []
      islas[isla].push(r)
    })

    // Hoja resumen
    const resumen = Object.entries(islas).sort((a, b) => b[1].length - a[1].length).map(([isla, arr]) => ({
      'Isla': isla,
      'Inscritos': arr.length,
      'Asistieron': arr.filter((r: any) => r.asistio).length,
      'En lista WA': arr.filter((r: any) => r.wa_confirmado).length,
    }))
    const wsRes = XLSX.utils.json_to_sheet(resumen)
    wsRes['!cols'] = colWidths([20, 12, 12, 14])
    XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen por isla')

    // Una hoja por isla
    for (const [isla, arr] of Object.entries(islas)) {
      const rows = arr.map((r: any) => ({
        'Nombre': r.nombre, 'Empresa': r.empresa ?? '', 'Perfil': r.perfil ?? '',
        'Asistió': r.asistio ? 'Sí' : 'No', 'WA': r.wa_confirmado ? 'Sí' : 'No',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = colWidths([28, 24, 20, 10, 10])
      XLSX.utils.book_append_sheet(wb, ws, isla.substring(0, 31))
    }
  }

  // ── 4. POR PERFIL PROFESIONAL ────────────────────────────────────────────────
  if (tipo === 'por-perfil') {
    const { data } = await sb.from('registros').select('nombre, empresa, isla, perfil, cliente_ava, primera_vez')
    const perfiles: Record<string, number> = {}
    ;(data ?? []).forEach((r: any) => {
      const p = r.perfil ?? 'Sin especificar'
      perfiles[p] = (perfiles[p] ?? 0) + 1
    })
    const resumen = Object.entries(perfiles).sort((a, b) => b[1] - a[1]).map(([perfil, count]) => ({
      'Perfil profesional': perfil, 'Cantidad': count,
      '% del total': `${((count / (data?.length ?? 1)) * 100).toFixed(1)}%`,
    }))
    const wsRes = XLSX.utils.json_to_sheet(resumen)
    wsRes['!cols'] = colWidths([32, 12, 14])
    XLSX.utils.book_append_sheet(wb, wsRes, 'Por perfil')

    const detalle = (data ?? []).map((r: any) => ({
      'Nombre': r.nombre, 'Empresa': r.empresa ?? '', 'Isla': r.isla ?? '',
      'Perfil': r.perfil ?? '', 'Cliente AVA': r.cliente_ava ? 'Sí' : 'No',
      'Primera vez': r.primera_vez ? 'Sí' : 'No',
    }))
    const wsdet = XLSX.utils.json_to_sheet(detalle)
    wsdet['!cols'] = colWidths([28, 24, 14, 24, 12, 12])
    XLSX.utils.book_append_sheet(wb, wsdet, 'Detalle')
  }

  // ── 5. POR BLOQUE ────────────────────────────────────────────────────────────
  if (tipo === 'por-bloque') {
    const { data } = await sb.from('registros').select('nombre, empresa, isla, bloques, asistio')
    const bloques: Record<string, any[]> = {}
    ;(data ?? []).forEach((r: any) => {
      (r.bloques ?? []).forEach((b: string) => {
        if (!bloques[b]) bloques[b] = []
        bloques[b].push(r)
      })
    })
    const resumen = Object.entries(bloques).sort((a, b) => b[1].length - a[1].length).map(([bloque, arr]) => ({
      'Bloque': bloque, 'Inscritos': arr.length,
      'Asistieron': arr.filter((r: any) => r.asistio).length,
    }))
    const wsRes = XLSX.utils.json_to_sheet(resumen)
    wsRes['!cols'] = colWidths([60, 12, 12])
    XLSX.utils.book_append_sheet(wb, wsRes, 'Por bloque')
  }

  // ── 6. SOLICITUDES DE PRODUCTO ───────────────────────────────────────────────
  if (tipo === 'solicitudes') {
    const { data } = await sb.from('solicitudes_info')
      .select('*, producto:productos(nombre), proveedor:proveedores(nombre)')
      .order('created_at', { ascending: false })
    const rows = (data ?? []).map((r: any) => ({
      'Fecha': new Date(r.created_at).toLocaleString('es-ES'),
      'Nombre': r.nombre, 'Email': r.email, 'Empresa': r.empresa ?? '',
      'Isla': r.isla ?? '', 'Cargo': r.cargo ?? '', 'Teléfono': r.telefono ?? '',
      'Producto': r.producto?.nombre ?? '', 'Marca': r.proveedor?.nombre ?? '',
      'Mensaje': r.mensaje ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = colWidths([20, 28, 28, 24, 14, 18, 16, 28, 18, 40])
    XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes')
  }

  // ── 7. CATÁLOGO DE PRODUCTOS ─────────────────────────────────────────────────
  if (tipo === 'productos') {
    const { data } = await sb.from('productos')
      .select('*, proveedor:proveedores(nombre)')
      .order('orden')
    const rows = (data ?? []).map((r: any) => ({
      'Producto': r.nombre, 'Marca': r.proveedor?.nombre ?? '',
      'Categoría': r.categoria ?? '', 'Descripción': r.descripcion ?? '',
      'Tipo servicio': r.tipo_servicio ?? '', 'Con cargo': r.tiene_cargo ? 'Sí' : 'No',
      'Precio base (€)': r.precio_base ?? '', 'IGIC %': r.igic_pct ?? 0,
      'Coste aduana (€)': r.coste_aduana ?? 0, 'Coste logística (€)': r.coste_logistica ?? 0,
      'En exposición': r.en_exposicion ? 'Sí' : 'No',
      'Publicado catálogo': r.publicado_catalogo ? 'Sí' : 'No',
      'Ficha técnica': r.ficha_tecnica_url ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = colWidths([28, 20, 14, 40, 14, 10, 14, 10, 16, 18, 14, 16, 40])
    XLSX.utils.book_append_sheet(wb, ws, 'Catálogo productos')
  }

  // ── 8. RESUMEN EJECUTIVO ─────────────────────────────────────────────────────
  if (tipo === 'resumen') {
    const [
      { data: registros },
      { data: productos },
      { data: solicitudes },
      { data: proveedores },
    ] = await Promise.all([
      sb.from('registros').select('isla, perfil, wa_confirmado, asistio, primera_vez, cliente_ava, bloques'),
      sb.from('productos').select('publicado_catalogo, tipo_servicio'),
      sb.from('solicitudes_info').select('id'),
      sb.from('proveedores').select('id'),
    ])
    const r = registros ?? []
    const islaCount: Record<string, number> = {}
    r.forEach((x: any) => { const i = x.isla ?? 'N/E'; islaCount[i] = (islaCount[i] ?? 0) + 1 })

    const stats = [
      ['EVENTO', 'Yellow Craft Academy — 15 junio 2026'],
      ['Generado', fecha],
      ['', ''],
      ['INSCRITOS', ''],
      ['Total inscritos', r.length],
      ['Asistieron al evento', r.filter((x: any) => x.asistio).length],
      ['En lista WA', r.filter((x: any) => x.wa_confirmado).length],
      ['Primera vez en evento AVA', r.filter((x: any) => x.primera_vez).length],
      ['Clientes AVA', r.filter((x: any) => x.cliente_ava).length],
      ['', ''],
      ['POR ISLA', ''],
      ...Object.entries(islaCount).sort((a, b) => b[1] - a[1]).map(([isla, n]) => [isla, n]),
      ['', ''],
      ['CATÁLOGO', ''],
      ['Total productos', productos?.length ?? 0],
      ['Publicados en catálogo', productos?.filter((x: any) => x.publicado_catalogo).length ?? 0],
      ['Marcas participantes', proveedores?.length ?? 0],
      ['', ''],
      ['SOLICITUDES DE INFORMACIÓN', solicitudes?.length ?? 0],
    ]
    const ws = XLSX.utils.aoa_to_sheet(stats)
    ws['!cols'] = colWidths([30, 24])
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen ejecutivo')
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const nombres: Record<InformeType, string> = {
    'inscritos': 'inscritos-completo',
    'asistencia': 'control-asistencia',
    'por-isla': 'analisis-por-isla',
    'por-perfil': 'analisis-por-perfil',
    'por-bloque': 'analisis-por-bloque',
    'solicitudes': 'solicitudes-producto',
    'productos': 'catalogo-productos',
    'resumen': 'resumen-ejecutivo',
  }
  const filename = `YCA-${nombres[tipo]}-${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
