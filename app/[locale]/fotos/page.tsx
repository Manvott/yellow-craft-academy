import Navbar from '@/components/Navbar'
import FotosGaleriaClient from '@/components/FotosGaleriaClient'
import { createClient } from '@/lib/supabase/server'

export default async function FotosPage() {
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ background: 'var(--negro)', paddingTop: 72, minHeight: '32vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 70% at 80% 50%, rgba(245,197,24,0.06) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 2.5rem', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>
            Galería · Yellow Craft Academy
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.8rem,4.5vw,4.5rem)', fontWeight: 300, lineHeight: 1.05, color: 'var(--crema)', marginBottom: '1rem' }}>
            Fotos del<br /><em style={{ color: 'rgba(245,197,24,0.9)', fontStyle: 'italic' }}>evento</em>
          </h1>
          <p style={{ fontSize: '0.87rem', color: 'rgba(247,243,238,0.4)', lineHeight: 1.75, fontFamily: 'DM Sans, sans-serif' }}>
            Descarga las imágenes del evento. Los fotógrafos pueden subir sus fotos desde este mismo espacio.
          </p>
        </div>
      </div>

      <main style={{ flex: 1, background: 'var(--crema)', padding: '5rem 2.5rem' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <FotosGaleriaClient fotosIniciales={fotos} />
        </div>
      </main>

      <footer style={{ background: 'var(--negro)', color: 'rgba(247,243,238,0.25)', textAlign: 'center', padding: '2.5rem', fontSize: '0.72rem', letterSpacing: '0.1em', fontFamily: 'DM Sans, sans-serif' }}>
        <p>© 2026 Yellow Craft Academy · AVA Identidad · Lanzarote</p>
      </footer>
    </div>
  )
}
