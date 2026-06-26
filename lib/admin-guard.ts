import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Comprueba la sesión del admin y si está en modo solo lectura.
 * Devuelve { ok, soloLectura, userId }.
 */
export async function checkAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, soloLectura: false, userId: null }

  const { data: rol } = await supabase
    .from('admin_roles')
    .select('solo_lectura')
    .eq('user_id', user.id)
    .single()

  return { ok: true, soloLectura: rol?.solo_lectura ?? false, userId: user.id }
}
