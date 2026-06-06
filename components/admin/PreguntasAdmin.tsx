'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { PreguntaAdmin } from '@/app/[locale]/admin/(panel)/preguntas/page'

interface Props { preguntas: PreguntaAdmin[] }

export default function PreguntasAdmin({ preguntas }: Props) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'respondidas'>('todas')
  const [filtroPonente, setFiltroPonente] = useState('todos')
  const [respondiendo, setRespondiendo] = useState<string | null>(null)
  const [textoRespuesta, setTextoRespuesta] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const ponentes = ['todos', ...Array.from(new Set(preguntas.map(p => p.ponente.split('—')[0].trim())))]

  const filtered = preguntas.filter(p => {
    const matchFiltro = filtro === 'todas' ? true : filtro === 'respondidas' ? p.respondida : !p.respondida
    const matchPonente = filtroPonente === 'todos' ? true : p.ponente.includes(filtroPonente)
    return matchFiltro && matchPonente
  })

  async function marcarRespondida(id: string, respondida: boolean) {
    setLoading(id)
    const supabase = createClient()
    await supabase.from('preguntas').update({ respondida: !respondida }).eq('id', id)
    setLoading(null); router.refresh()
  }

  async function guardarRespuesta(id: string) {
    setLoading(id)
    const supabase = createClient()
    await supabase.from('preguntas').update({ respuesta: textoRespuesta, respondida: true }).eq('id', id)
    setLoading(null); setRespondiendo(null); setTextoRespuesta(''); router.refresh()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta pregunta?')) return
    setLoading(id)
    const supabase = createClient()
    await supabase.from('preguntas').delete().eq('id', id)
    setLoading(null); router.refresh()
  }

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {(['todas', 'pendientes', 'respondidas'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid var(--crema3)', cursor: 'pointer', background: filtro === f ? 'var(--negro)' : 'var(--blanco)', color: filtro === f ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
            {f === 'todas' ? `Todas (${preguntas.length})` : f === 'pendientes' ? `Pendientes (${preguntas.filter(p => !p.respondida).length})` : `Respondidas (${preguntas.filter(p => p.respondida).length})`}
          </button>
        ))}
        <select value={filtroPonente} onChange={e => setFiltroPonente(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', border: '1px solid var(--crema3)', background: 'var(--blanco)', color: 'var(--gris)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}>
          {ponentes.map(p => <option key={p} value={p}>{p === 'todos' ? 'Todos los ponentes' : p}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gris-l)', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300 }}>
            Sin preguntas
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} style={{ background: 'var(--blanco)', border: `1px solid ${p.respondida ? '#86efac' : 'var(--crema3)'}`, padding: '1.25rem 1.5rem' }}>
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--negro)', fontFamily: 'DM Sans, sans-serif' }}>
                  {p.nombre || p.empresa}
                  {p.nombre && p.empresa && <span style={{ color: 'var(--gris)', fontWeight: 300 }}> · {p.empresa}</span>}
                </span>
                <span style={{ fontSize: '0.6rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.1rem 0.5rem', letterSpacing: '0.05em' }}>
                  {p.ponente.split('—')[0].trim()}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--gris-l)' }}>
                  {new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {p.respondida
                  ? <span style={{ fontSize: '0.62rem', background: '#dcfce7', color: '#16a34a', padding: '0.15rem 0.5rem', border: '1px solid #86efac' }}>✓ Respondida</span>
                  : <span style={{ fontSize: '0.62rem', background: 'var(--crema2)', color: 'var(--gris)', padding: '0.15rem 0.5rem', border: '1px solid var(--crema3)' }}>Pendiente</span>
                }
              </div>
            </div>

            {/* Pregunta */}
            <p style={{ fontSize: '0.88rem', color: 'var(--negro)', lineHeight: 1.65, marginBottom: '0.75rem', fontStyle: 'italic' }}>
              "{p.pregunta}"
            </p>

            {/* Respuesta guardada */}
            {p.respuesta && (
              <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #86efac', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#16a34a', marginBottom: '0.3rem', fontFamily: 'DM Sans, sans-serif' }}>Respuesta</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--grafito)', lineHeight: 1.6 }}>{p.respuesta}</p>
              </div>
            )}

            {/* Responder inline */}
            {respondiendo === p.id && (
              <div style={{ marginBottom: '0.75rem' }}>
                <textarea rows={3} value={textoRespuesta} onChange={e => setTextoRespuesta(e.target.value)}
                  placeholder="Escribe la respuesta del ponente..."
                  style={{ width: '100%', background: 'var(--crema)', border: '1px solid var(--crema3)', padding: '0.75rem', fontSize: '0.82rem', outline: 'none', resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={() => guardarRespuesta(p.id)} disabled={loading === p.id || !textoRespuesta.trim()}
                    style={{ background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.5rem 1.1rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: loading === p.id ? 0.5 : 1 }}>
                    Guardar respuesta
                  </button>
                  <button onClick={() => { setRespondiendo(null); setTextoRespuesta('') }}
                    style={{ background: 'none', border: '1px solid var(--crema3)', padding: '0.5rem 0.75rem', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--gris)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button onClick={() => { setRespondiendo(p.id); setTextoRespuesta(p.respuesta ?? '') }}
                style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: '1px solid var(--crema3)', padding: '0.3rem 0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--gris)' }}>
                {p.respuesta ? 'Editar respuesta' : 'Responder'}
              </button>
              <button onClick={() => marcarRespondida(p.id, p.respondida)} disabled={loading === p.id}
                style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: `1px solid ${p.respondida ? 'var(--crema3)' : '#16a34a'}`, padding: '0.3rem 0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: p.respondida ? 'var(--gris)' : '#16a34a' }}>
                {p.respondida ? 'Marcar pendiente' : '✓ Marcar respondida'}
              </button>
              <button onClick={() => eliminar(p.id)} disabled={loading === p.id}
                style={{ fontSize: '0.65rem', border: '1px solid #fca5a5', padding: '0.3rem 0.75rem', cursor: 'pointer', color: '#dc2626', background: 'none', fontFamily: 'DM Sans, sans-serif' }}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
