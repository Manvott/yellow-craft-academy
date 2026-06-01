import { createClient } from '@/lib/supabase/server'
import type { SeccionPildora } from '@/lib/types'
import PillorasAdminManager from '@/components/admin/PillorasAdminManager'

export default async function PillorasAdminPage() {
  let secciones: SeccionPildora[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('secciones_pildoras')
      .select('*, pildoras(*)')
      .order('orden')
    secciones = (data as SeccionPildora[]) ?? []
  } catch {}

  return (
    <div>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '2rem' }}>
        Píldoras de Conocimiento
      </h1>
      <PillorasAdminManager secciones={secciones} />
    </div>
  )
}
