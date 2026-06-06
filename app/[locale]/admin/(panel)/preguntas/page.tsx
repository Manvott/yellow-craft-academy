import { createClient } from '@/lib/supabase/server'
import PreguntasAdmin from '@/components/admin/PreguntasAdmin'

export interface PreguntaAdmin {
  id: string
  nombre: string | null
  empresa: string | null
  ponente: string
  pregunta: string
  respondida: boolean
  respuesta: string | null
  created_at: string
}

export default async function PreguntasPage() {
  let preguntas: PreguntaAdmin[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('preguntas').select('*').order('created_at', { ascending: false })
    preguntas = (data as PreguntaAdmin[]) ?? []
  } catch {}

  const total = preguntas.length
  const respondidas = preguntas.filter(p => p.respondida).length

  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
        Interacción · Ponentes
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.5rem', lineHeight: 1 }}>
        Preguntas
      </h1>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
          <strong style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300 }}>{total}</strong>
          <span style={{ color: 'var(--gris)', marginLeft: '0.4rem' }}>preguntas</span>
        </span>
        <span style={{ fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
          <strong style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: '#16a34a' }}>{respondidas}</strong>
          <span style={{ color: 'var(--gris)', marginLeft: '0.4rem' }}>respondidas</span>
        </span>
        <span style={{ fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
          <strong style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: 'var(--gris-l)' }}>{total - respondidas}</strong>
          <span style={{ color: 'var(--gris)', marginLeft: '0.4rem' }}>pendientes</span>
        </span>
      </div>
      <PreguntasAdmin preguntas={preguntas} />
    </div>
  )
}
