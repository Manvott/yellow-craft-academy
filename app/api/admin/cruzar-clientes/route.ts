import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()

  // Ejecuta el cruce: marca cliente_ava=true donde email o teléfono coincida con clientes_ava
  const { error } = await supabase.rpc('cruzar_clientes_ava')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Devuelve conteo actualizado
  const { data } = await supabase
    .from('registros')
    .select('cliente_ava')

  const clientesAva   = (data ?? []).filter(r => r.cliente_ava).length
  const nuevosClientes = (data ?? []).length - clientesAva

  return NextResponse.json({ ok: true, clientesAva, nuevosClientes, total: (data ?? []).length })
}
