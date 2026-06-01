import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import Navbar from '@/components/Navbar'
import CatalogoClient from '@/components/CatalogoClient'
import { createClient } from '@/lib/supabase/server'
import type { Producto, Proveedor } from '@/lib/types'

export default async function HomePage() {
  const t = await getTranslations('home')
  const supabase = await createClient()

  const [{ data: proveedores }, { data: productos }] = await Promise.all([
    supabase.from('proveedores').select('*').eq('activo', true).order('orden'),
    supabase.from('productos').select('*, proveedor:proveedores(*)').eq('disponible', true).order('orden'),
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-yellow-400 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Yellow Craft Academy
          </h1>
          <p className="text-xl text-gray-700 mb-6">{t('subtitle')}</p>
          <div className="flex items-center justify-center gap-4 text-gray-800 text-sm font-medium">
            <span>📅 {t('event_date')}</span>
            <span>·</span>
            <span>📍 {t('event_location')}</span>
          </div>
        </div>
      </div>

      {/* Catálogo */}
      <main className="flex-1 bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <CatalogoClient
            productos={(productos as Producto[]) ?? []}
            proveedores={(proveedores as Proveedor[]) ?? []}
          />
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        <p>© 2026 Yellow Craft Academy · Ava Selección · Lanzarote</p>
      </footer>
    </div>
  )
}
