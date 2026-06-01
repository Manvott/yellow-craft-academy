import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: registros, error } = await supabase
    .from('registros')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }

  const rows = (registros ?? []).map((r: any) => ({
    'Fecha inscripción': new Date(r.created_at).toLocaleString('es-ES'),
    'Nombre': r.nombre,
    'Empresa': r.empresa ?? '',
    'Cargo': r.cargo ?? '',
    'Perfil profesional': r.perfil ?? '',
    'Isla': r.isla ?? '',
    'Email': r.email,
    'Teléfono WhatsApp': r.telefono ?? '',
    'Instagram': r.instagram ?? '',
    'Primera vez en evento AVA': r.primera_vez ? 'Sí' : 'No',
    'Cliente AVA': r.cliente_ava ? 'Sí' : 'No',
    'Acepta canal WhatsApp': r.acepta_whatsapp ? 'Sí' : 'No',
    'Añadido a lista WA': r.wa_confirmado ? 'Sí' : 'No',
    'Bloques seleccionados': (r.bloques ?? []).join(' | '),
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 20 }, { wch: 30 }, { wch: 32 }, { wch: 28 },
    { wch: 26 }, { wch: 18 }, { wch: 80 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Asistentes')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="yca-asistentes-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}
