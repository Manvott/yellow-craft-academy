'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Plantilla, RegistroWA, Enviado } from '@/lib/tipos-mensajes-wa'

interface Props {
  plantillas: Plantilla[]
  registros: RegistroWA[]
  enviados: Enviado[]
}

function WaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function buildMensaje(contenido: string, r: RegistroWA): string {
  const etiqueta = [r.nombre, r.isla, r.empresa].filter(Boolean).join(' - ')
  return contenido
    .replace(/\{nombre\}/g, r.nombre)
    .replace(/\{etiqueta\}/g, etiqueta)
    .replace(/\{empresa\}/g, r.empresa ?? '')
    .replace(/\{isla\}/g, r.isla ?? '')
}

export default function MensajesWAClient({ plantillas, registros, enviados }: Props) {
  const router = useRouter()
  const [plantillaActiva, setPlantillaActiva] = useState<Plantilla | null>(plantillas[0] ?? null)
  const [search, setSearch] = useState('')
  const [filtroEnvio, setFiltroEnvio] = useState<'todos' | 'pendientes' | 'enviados'>('todos')
  const [updating, setUpdating] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [formPlantilla, setFormPlantilla] = useState({ titulo: '', contenido: '' })
  const [savingPlantilla, setSavingPlantilla] = useState(false)

  // Set de "plantilla_id:registro_id" enviados
  const enviadosSet = new Set(enviados.map(e => `${e.plantilla_id}:${e.registro_id}`))

  function yaEnviado(registroId: string) {
    return plantillaActiva ? enviadosSet.has(`${plantillaActiva.id}:${registroId}`) : false
  }

  const totalEnviados = plantillaActiva
    ? registros.filter(r => enviadosSet.has(`${plantillaActiva.id}:${r.id}`)).length
    : 0

  const filtrados = registros.filter(r => {
    const matchSearch = r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (r.empresa ?? '').toLowerCase().includes(search.toLowerCase())
    const enviado = yaEnviado(r.id)
    const matchFiltro = filtroEnvio === 'todos' ? true : filtroEnvio === 'enviados' ? enviado : !enviado
    return matchSearch && matchFiltro
  })

  async function toggleEnviado(registroId: string) {
    if (!plantillaActiva) return
    setUpdating(registroId)
    const supabase = createClient()
    const key = `${plantillaActiva.id}:${registroId}`
    if (enviadosSet.has(key)) {
      await supabase.from('mensajes_wa_enviados')
        .delete().eq('plantilla_id', plantillaActiva.id).eq('registro_id', registroId)
    } else {
      await supabase.from('mensajes_wa_enviados').insert({ plantilla_id: plantillaActiva.id, registro_id: registroId })
    }
    setUpdating(null)
    router.refresh()
  }

  async function guardarPlantilla() {
    if (!formPlantilla.titulo || !formPlantilla.contenido) return
    setSavingPlantilla(true)
    const supabase = createClient()
    await supabase.from('mensajes_wa_plantillas').insert({ ...formPlantilla, orden: plantillas.length + 1 })
    setSavingPlantilla(false)
    setEditando(false)
    setFormPlantilla({ titulo: '', contenido: '' })
    router.refresh()
  }

  const S = {
    btn: (active: boolean, color = 'var(--negro)'): React.CSSProperties => ({
      padding: '0.45rem 0.9rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
      border: `1px solid ${active ? color : 'var(--crema3)'}`,
      background: active ? color : 'var(--blanco)',
      color: active ? 'var(--crema)' : 'var(--gris)',
      cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    }),
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>

      {/* ── PANEL IZQUIERDO: carrusel de plantillas ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
            Mensajes
          </p>
          <button onClick={() => setEditando(!editando)}
            style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: '1px solid var(--crema3)', padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--gris)' }}>
            {editando ? '✕' : '+ Nuevo'}
          </button>
        </div>

        {/* Form nueva plantilla */}
        {editando && (
          <div style={{ background: 'var(--blanco)', border: '2px solid var(--negro)', padding: '1rem', marginBottom: '0.75rem' }}>
            <input value={formPlantilla.titulo} onChange={e => setFormPlantilla(p => ({ ...p, titulo: e.target.value }))}
              placeholder="Título del mensaje *"
              style={{ width: '100%', background: 'var(--crema)', border: '1px solid var(--crema3)', padding: '0.6rem 0.75rem', fontSize: '0.78rem', outline: 'none', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}
            />
            <textarea rows={5} value={formPlantilla.contenido} onChange={e => setFormPlantilla(p => ({ ...p, contenido: e.target.value }))}
              placeholder="Contenido... Usa {nombre}, {etiqueta}, {isla}, {empresa}"
              style={{ width: '100%', background: 'var(--crema)', border: '1px solid var(--crema3)', padding: '0.6rem 0.75rem', fontSize: '0.75rem', outline: 'none', resize: 'vertical', fontFamily: 'DM Sans, sans-serif', marginBottom: '0.5rem' }}
            />
            <p style={{ fontSize: '0.6rem', color: 'var(--gris-l)', marginBottom: '0.5rem' }}>
              Variables: {'{nombre}'} {'{etiqueta}'} {'{isla}'} {'{empresa}'}
            </p>
            <button onClick={guardarPlantilla} disabled={savingPlantilla || !formPlantilla.titulo || !formPlantilla.contenido}
              style={{ background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.5rem 1rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', width: '100%', opacity: savingPlantilla ? 0.5 : 1 }}>
              {savingPlantilla ? 'Guardando...' : 'Guardar mensaje'}
            </button>
          </div>
        )}

        {/* Lista de plantillas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {plantillas.map(p => {
            const nEnviados = registros.filter(r => enviadosSet.has(`${p.id}:${r.id}`)).length
            const activa = plantillaActiva?.id === p.id
            return (
              <button key={p.id} onClick={() => setPlantillaActiva(p)}
                style={{ textAlign: 'left', padding: '0.85rem 1rem', border: `2px solid ${activa ? 'var(--negro)' : 'var(--crema3)'}`, background: activa ? 'var(--negro)' : 'var(--blanco)', cursor: 'pointer', transition: 'all 0.15s' }}>
                <p style={{ fontWeight: 500, fontSize: '0.82rem', color: activa ? 'var(--crema)' : 'var(--negro)', marginBottom: '0.3rem', fontFamily: 'DM Sans, sans-serif' }}>{p.titulo}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: 1, height: 4, background: activa ? 'rgba(247,243,238,0.15)' : 'var(--crema2)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${registros.length ? (nEnviados / registros.length) * 100 : 0}%`, background: '#25D366', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '0.62rem', color: activa ? 'rgba(247,243,238,0.5)' : 'var(--gris)', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}>
                    {nEnviados}/{registros.length}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── PANEL DERECHO: destinatarios ── */}
      <div>
        {!plantillaActiva ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gris-l)' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300 }}>Selecciona un mensaje</p>
          </div>
        ) : (
          <>
            {/* Cabecera mensaje activo */}
            <div style={{ background: 'var(--negro)', padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(247,243,238,0.4)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
                Mensaje activo
              </p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 300, color: 'var(--crema)', marginBottom: '0.75rem' }}>
                {plantillaActiva.titulo}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(247,243,238,0.55)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'DM Sans, sans-serif' }}>
                {plantillaActiva.contenido.replace(/\{nombre\}/g, '[nombre]').replace(/\{etiqueta\}/g, '[etiqueta]').replace(/\{empresa\}/g, '[empresa]').replace(/\{isla\}/g, '[isla]')}
              </p>
              {/* Progreso */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div style={{ flex: 1, height: 6, background: 'rgba(247,243,238,0.1)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${registros.length ? (totalEnviados / registros.length) * 100 : 0}%`, background: '#25D366', borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--amarillo)', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                  {totalEnviados} / {registros.length} enviados
                </span>
              </div>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                style={{ flex: '1 1 140px', background: 'var(--blanco)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.55rem 0.85rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', outline: 'none' }}
              />
              {(['todos', 'pendientes', 'enviados'] as const).map(f => (
                <button key={f} onClick={() => setFiltroEnvio(f)} style={S.btn(filtroEnvio === f)}>
                  {f === 'todos' ? `Todos (${registros.length})` : f === 'pendientes' ? `Pendientes (${registros.filter(r => !yaEnviado(r.id)).length})` : `Enviados (${totalEnviados})`}
                </button>
              ))}
            </div>

            {/* Lista destinatarios */}
            <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)' }}>
              {filtrados.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gris-l)', fontSize: '0.82rem' }}>Sin resultados</div>
              )}
              {filtrados.map((r, i) => {
                const enviado = yaEnviado(r.id)
                const waText = encodeURIComponent(buildMensaje(plantillaActiva.contenido, r))
                const waLink = `https://wa.me/${r.telefono!.replace(/\D/g, '')}?text=${waText}`
                return (
                  <div key={r.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                    gap: '0.75rem', alignItems: 'center',
                    padding: '0.65rem 1rem',
                    borderBottom: '1px solid var(--crema3)',
                    background: enviado ? '#f0fdf4' : i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)',
                  }}>
                    {/* Info */}
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '0.82rem', color: 'var(--negro)', marginBottom: '0.1rem' }}>{r.nombre}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {r.empresa && <span style={{ fontSize: '0.68rem', color: 'var(--gris)' }}>{r.empresa}</span>}
                        {r.isla && <span style={{ fontSize: '0.58rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.05rem 0.35rem' }}>{r.isla}</span>}
                        <span style={{ fontSize: '0.65rem', color: 'var(--gris-l)' }}>{r.telefono}</span>
                      </div>
                    </div>

                    {/* Abrir WhatsApp */}
                    {waLink ? (
                      <a href={waLink} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.62rem', color: '#25D366', textDecoration: 'none', border: '1px solid #25D366', padding: '0.25rem 0.6rem', whiteSpace: 'nowrap' }}>
                        <WaIcon /> Chat
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.6rem', color: 'var(--gris-l)', padding: '0.25rem 0.6rem', border: '1px solid var(--crema3)', whiteSpace: 'nowrap' }}>Sin tel.</span>
                    )}

                    {/* Marcar enviado — acción manual */}
                    <button onClick={() => toggleEnviado(r.id)} disabled={updating === r.id}
                      title={enviado ? 'Desmarcar' : 'Marcar como enviado'}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.62rem', border: `1px solid ${enviado ? '#16a34a' : 'var(--crema3)'}`, padding: '0.25rem 0.6rem', background: enviado ? '#dcfce7' : 'var(--crema2)', color: enviado ? '#16a34a' : 'var(--gris)', cursor: 'pointer', opacity: updating === r.id ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                      {enviado ? '✓ Enviado' : '○ Marcar'}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
