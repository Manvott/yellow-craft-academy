import { getTranslations } from 'next-intl/server'
import Navbar from '@/components/Navbar'
import CatalogoClient from '@/components/CatalogoClient'
import { createClient } from '@/lib/supabase/server'
import type { Producto, Proveedor } from '@/lib/types'

export default async function HomePage() {
  const t = await getTranslations('home')

  let proveedores: Proveedor[] = []
  let productos: Producto[] = []
  let categoriasDB: string[] = []

  try {
    const supabase = await createClient()
    const [{ data: p }, { data: pr }, { data: cats }] = await Promise.all([
      supabase.from('proveedores').select('*').eq('activo', true).order('orden'),
      supabase.from('productos').select('*, proveedor:proveedores(*)').eq('disponible', true).order('orden'),
      supabase.from('categorias').select('nombre').eq('activa', true).order('orden'),
    ])
    proveedores = (p as Proveedor[]) ?? []
    productos = (pr as Producto[]) ?? []
    categoriasDB = (cats ?? []).map((c: any) => c.nombre)
  } catch {}

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'var(--negro)', paddingTop: 72, minHeight: '40vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 80% 50%, rgba(245,197,24,0.08) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '4rem 2.5rem', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>
            Catálogo de producto · Yellow Craft Academy
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(3rem,5vw,5rem)', fontWeight: 300, lineHeight: 1, color: 'var(--crema)', marginBottom: '1rem' }}>
            Producto en<br /><em style={{ color: 'rgba(245,197,24,0.9)', fontStyle: 'italic' }}>escena</em>
          </h1>
          <p style={{ fontSize: '0.87rem', color: 'rgba(247,243,238,0.45)', maxWidth: 480, lineHeight: 1.75, fontFamily: 'DM Sans, sans-serif' }}>
            {t('subtitle')}
          </p>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', fontSize: '0.72rem', color: 'rgba(247,243,238,0.3)', fontFamily: 'DM Sans, sans-serif' }}>
            <span>📅 {t('event_date')}</span>
            <span>·</span>
            <span>📍 {t('event_location')}</span>
          </div>
        </div>
      </div>

      {/* Catálogo */}
      <main style={{ flex: 1, background: 'var(--crema)', padding: '5rem 2.5rem' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <CatalogoClient productos={productos} proveedores={proveedores} categoriasDB={categoriasDB} />
        </div>
      </main>

      <footer style={{ background: 'var(--negro)', color: 'rgba(247,243,238,0.25)', textAlign: 'center', padding: '2.5rem', fontSize: '0.72rem', letterSpacing: '0.1em', fontFamily: 'DM Sans, sans-serif' }}>
        <p>© 2026 Yellow Craft Academy · AVA Identidad · Lanzarote</p>
        <p style={{ marginTop: '0.3rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', color: 'rgba(245,197,24,0.25)', letterSpacing: '0.1em' }}>29°02′N · 13°36′W</p>
      </footer>
    </div>
  )
}
