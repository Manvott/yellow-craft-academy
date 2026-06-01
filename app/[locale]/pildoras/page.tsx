import { getTranslations } from 'next-intl/server'
import Navbar from '@/components/Navbar'
import PillorasClient from '@/components/PillorasClient'
import { createClient } from '@/lib/supabase/server'
import type { SeccionPildora } from '@/lib/types'

export default async function PillorasPage() {
  const t = await getTranslations('pildoras')
  const supabase = await createClient()

  const { data: secciones } = await supabase
    .from('secciones_pildoras')
    .select('*, pildoras(*)')
    .eq('activo', true)
    .order('orden')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="bg-yellow-400 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-3">{t('title')}</h1>
          <p className="text-lg text-gray-700">{t('subtitle')}</p>
        </div>
      </div>

      <main className="flex-1 bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <PillorasClient secciones={(secciones as SeccionPildora[]) ?? []} />
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        <p>© 2026 Yellow Craft Academy · Ava Selección · Lanzarote</p>
      </footer>
    </div>
  )
}
