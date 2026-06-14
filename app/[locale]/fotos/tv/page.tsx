import CarruselTV from '@/components/CarruselTV'
import { createClient } from '@/lib/supabase/server'

export default async function FotosTVPage() {
  let fotos: any[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('fotos_evento')
      .select('id, url_publica, subido_por, sesion, created_at')
      .order('created_at', { ascending: false })
    fotos = data ?? []
  } catch {}

  return <CarruselTV fotosIniciales={fotos} />
}
