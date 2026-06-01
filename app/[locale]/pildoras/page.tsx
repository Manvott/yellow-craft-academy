import { getTranslations } from 'next-intl/server'
import Navbar from '@/components/Navbar'
import PillorasClient from '@/components/PillorasClient'
import { createClient } from '@/lib/supabase/server'
import type { SeccionPildora } from '@/lib/types'

export default async function PillorasPage() {
  const t = await getTranslations('pildoras')

  let secciones: SeccionPildora[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('secciones_pildoras')
      .select('*, pildoras(*)')
      .eq('activo', true)
      .order('orden')
    secciones = (data as SeccionPildora[]) ?? []
  } catch {}

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ background: 'var(--negro)', paddingTop: 72, minHeight: '32vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 70% at 20% 50%, rgba(245,197,24,0.06) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 2.5rem', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>
            Conocimiento · Yellow Craft Academy
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.8rem,4.5vw,4.5rem)', fontWeight: 300, lineHeight: 1.05, color: 'var(--crema)', marginBottom: '1rem' }}>
            {t('title')}
          </h1>
          <p style={{ fontSize: '0.87rem', color: 'rgba(247,243,238,0.4)', lineHeight: 1.75, fontFamily: 'DM Sans, sans-serif' }}>
            {t('subtitle')}
          </p>
        </div>
      </div>

      <main style={{ flex: 1, background: 'var(--crema)', padding: '5rem 2.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <PillorasClient secciones={secciones} />
        </div>
      </main>

      <footer style={{ background: 'var(--negro)', color: 'rgba(247,243,238,0.25)', textAlign: 'center', padding: '2.5rem', fontSize: '0.72rem', letterSpacing: '0.1em', fontFamily: 'DM Sans, sans-serif' }}>
        <p>© 2026 Yellow Craft Academy · AVA Identidad · Lanzarote</p>
      </footer>
    </div>
  )
}
