import { createClient } from '@/lib/supabase/server'
import FotosAdminManager from '@/components/admin/FotosAdminManager'

export default async function FotosAdminPage() {
  let fotos: any[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('fotos_evento')
      .select('*')
      .order('created_at', { ascending: false })
    fotos = data ?? []
  } catch {}

  return (
    <div>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '2rem' }}>
        Fotografías del Evento
      </h1>
      <FotosAdminManager fotos={fotos} />
    </div>
  )
}
