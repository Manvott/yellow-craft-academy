import { createClient } from '@/lib/supabase/server'
import type { Proveedor } from '@/lib/types'
import ProveedoresManager from '@/components/admin/ProveedoresManager'

export default async function ProveedoresPage() {
  let proveedores: Proveedor[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('proveedores').select('*').order('orden')
    proveedores = (data as Proveedor[]) ?? []
  } catch {}

  return (
    <div>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '2rem' }}>
        Proveedores
      </h1>
      <ProveedoresManager proveedores={proveedores} />
    </div>
  )
}
