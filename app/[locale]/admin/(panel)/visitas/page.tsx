import VisitasAdmin from '@/components/admin/VisitasAdmin'

export default async function VisitasPage() {
  let visitas: any[] = []
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data } = await sb
      .from('visitas_log')
      .select('id, ruta, referrer, dispositivo, navegador, locale, visitor_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5000)
    visitas = data ?? []
  } catch {}

  return (
    <div>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '2rem' }}>
        Auditoría de visitas
      </h1>
      <VisitasAdmin visitas={visitas} />
    </div>
  )
}
