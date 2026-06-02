import AjustesAdmin from '@/components/admin/AjustesAdmin'
import GestionUsuarios from '@/components/admin/GestionUsuarios'
import { createClient } from '@/lib/supabase/server'

export default async function AjustesPage() {
  let usuarios: any[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('admin_roles').select('*').order('created_at')
    usuarios = data ?? []
  } catch {}

  return (
    <div style={{ maxWidth: 700 }}>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>
        Cuenta y acceso
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '2.5rem', lineHeight: 1 }}>
        Ajustes
      </h1>
      <AjustesAdmin />
      <div style={{ marginTop: '2rem' }}>
        <GestionUsuarios usuarios={usuarios} />
      </div>
    </div>
  )
}
