import { createClient } from '@/lib/supabase/server'
import FotosAdminManager from '@/components/admin/FotosAdminManager'

export default async function FotosAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', margin: 0 }}>
          Fotografías del Evento
        </h1>
        <a
          href={`/${locale}/fotos/tv`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: 'var(--negro)', color: 'var(--crema)', padding: '0.55rem 1.2rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontFamily: 'DM Sans, sans-serif', textDecoration: 'none', letterSpacing: '0.05em' }}
        >
          📺 Abrir modo TV (carrusel)
        </a>
      </div>
      <FotosAdminManager fotos={fotos} />
    </div>
  )
}
