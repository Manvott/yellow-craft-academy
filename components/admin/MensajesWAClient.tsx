'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Plantilla, RegistroWA, Enviado } from '@/lib/tipos-mensajes-wa'

interface Props {
  plantillas: Plantilla[]
  registros: RegistroWA[]
  enviados: Enviado[]
}

function buildMensaje(contenido: string, r: RegistroWA): string {
  const etiqueta = [r.nombre, r.isla, r.empresa].filter(Boolean).join(' - ')
  return contenido
    .replace(/\{nombre\}/g, r.nombre)
    .replace(/\{etiqueta\}/g, etiqueta)
    .replace(/\{empresa\}/g, r.empresa ?? '')
    .replace(/\{isla\}/g, r.isla ?? '')
}

function toVcf(r: RegistroWA): string {
  const tel = r.telefono ? r.telefono.replace(/\D/g, '') : ''
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${r.nombre}`,
    `N:${r.nombre};;;;`,
    tel ? `TEL;TYPE=CELL:+${tel.startsWith('34') ? tel : '34' + tel}` : '',
    r.empresa ? `ORG:${r.empresa}` : '',
    r.email ? `EMAIL:${r.email}` : '',
    'END:VCARD',
  ].filter(Boolean)
  return lines.join('\r\n')
}

function downloadVcf(r: RegistroWA) {
  const blob = new Blob([toVcf(r)], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${r.nombre.replace(/\s+/g, '_')}.vcf`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadAllVcf(registros: RegistroWA[]) {
  const content = registros.filter(r => r.telefono).map(toVcf).join('\r\n')
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'YCA-contactos-whatsapp.vcf'
  a.click()
  URL.revokeObjectURL(url)
}

const waPath = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

export default function MensajesWAClient({ plantillas, registros, enviados }: Props) {
  const router = useRouter()
  const [activa, setActiva] = useState<Plantilla | null>(plantillas[0] ?? null)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'pendientes' | 'enviados'>('todos')
  const [updating, setUpdating] = useState<string | null>(null)
  const [editando, setEditando] = useState<string | 'nueva' | false>(false)
  const [formTitulo, setFormTitulo] = useState('')
  const [formContenido, setFormContenido] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const EMOJIS = [
    '😊','✅','👉','🎉','📅','📍','⏰','🌊','🙌','👇',
    '🍽️','🥐','🍫','🍰','🍦','🥂','☕','🌿','⭐','🔥',
    '💪','📲','📩','💬','✨','🎯','👋','🤝','💡','📋',
  ]

  function insertEmoji(emoji: string) {
    const el = textareaRef.current
    if (!el) { setFormContenido(prev => prev + emoji); return }
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = formContenido.slice(0, start) + emoji + formContenido.slice(end)
    setFormContenido(newVal)
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + emoji.length; el.focus() }, 0)
  }

  const enviadosSet = new Set(enviados.map(e => `${e.plantilla_id}:${e.registro_id}`))

  const yaEnviado = useCallback((registroId: string) => {
    return activa ? enviadosSet.has(`${activa.id}:${registroId}`) : false
  }, [activa, enviadosSet])

  const totalEnviados = activa ? registros.filter(r => enviadosSet.has(`${activa.id}:${r.id}`)).length : 0

  const filtrados = registros.filter(r => {
    const matchSearch = r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (r.empresa ?? '').toLowerCase().includes(search.toLowerCase())
    const enviado = yaEnviado(r.id)
    if (filtro === 'enviados') return matchSearch && enviado
    if (filtro === 'pendientes') return matchSearch && !enviado
    return matchSearch
  })

  async function toggleEnviado(registroId: string) {
    if (!activa) return
    setUpdating(registroId)
    const supabase = createClient()
    const key = `${activa.id}:${registroId}`
    if (enviadosSet.has(key)) {
      await supabase.from('mensajes_wa_enviados').delete().eq('plantilla_id', activa.id).eq('registro_id', registroId)
    } else {
      await supabase.from('mensajes_wa_enviados').insert({ plantilla_id: activa.id, registro_id: registroId })
    }
    setUpdating(null)
    router.refresh()
  }

  async function guardar() {
    if (!formTitulo || !formContenido) return
    setSaving(true)
    const supabase = createClient()
    if (editando === 'nueva') {
      await supabase.from('mensajes_wa_plantillas').insert({ titulo: formTitulo, contenido: formContenido, orden: plantillas.length + 1 })
    } else if (editando) {
      await supabase.from('mensajes_wa_plantillas').update({ titulo: formTitulo, contenido: formContenido }).eq('id', editando)
    }
    setSaving(false)
    setEditando(false)
    setFormTitulo('')
    setFormContenido('')
    router.refresh()
  }

  function startEditar(p: Plantilla) {
    setEditando(p.id)
    setFormTitulo(p.titulo)
    setFormContenido(p.contenido)
  }

  const pct = registros.length ? Math.round((totalEnviados / registros.length) * 100) : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>

      {/* PLANTILLAS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>Mensajes</p>
          <button onClick={() => { setEditando('nueva'); setFormTitulo(''); setFormContenido('') }} style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: '1px solid var(--crema3)', padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--gris)' }}>
            {editando ? '✕' : '+ Nuevo'}
          </button>
        </div>

        {editando && (
          <div style={{ background: 'var(--blanco)', border: '2px solid var(--negro)', padding: '1rem', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>
              {editando === 'nueva' ? 'Nuevo mensaje' : 'Editar mensaje'}
            </p>
            <input value={formTitulo} onChange={e => setFormTitulo(e.target.value)} placeholder="Título *"
              style={{ width: '100%', background: 'var(--crema)', border: '1px solid var(--crema3)', padding: '0.6rem 0.75rem', fontSize: '0.78rem', outline: 'none', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }} />
            <textarea
              ref={textareaRef}
              rows={10}
              value={formContenido}
              onChange={e => setFormContenido(e.target.value)}
              placeholder="Contenido... Variables: {nombre} {etiqueta} {isla} {empresa}"
              style={{ width: '100%', background: 'var(--crema)', border: '1px solid var(--crema3)', padding: '0.75rem', fontSize: '0.82rem', outline: 'none', resize: 'vertical', fontFamily: 'DM Sans, sans-serif', marginBottom: '0.5rem', lineHeight: 1.6, minHeight: 180 }}
            />
            {/* Selector de emojis */}
            <div style={{ marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>Emojis</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', padding: '0.5rem', background: 'var(--crema2)', border: '1px solid var(--crema3)' }}>
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => insertEmoji(e)}
                    style={{ fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', lineHeight: 1, borderRadius: 4, transition: 'background 0.15s' }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--crema3)')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = 'none')}
                    title={e}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '0.6rem', color: 'var(--gris-l)', marginBottom: '0.5rem' }}>Variables: {'{nombre}'} {'{etiqueta}'} {'{isla}'} {'{empresa}'}</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={guardar} disabled={saving || !formTitulo || !formContenido}
                style={{ flex: 1, background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.5rem 1rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Guardando...' : editando === 'nueva' ? 'Crear' : 'Guardar cambios'}
              </button>
              <button onClick={() => { setEditando(false); setFormTitulo(''); setFormContenido('') }}
                style={{ background: 'none', border: '1px solid var(--crema3)', padding: '0.5rem 0.75rem', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--gris)' }}>
                ✕
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {plantillas.map(p => {
            const n = registros.filter(r => enviadosSet.has(`${p.id}:${r.id}`)).length
            const sel = activa?.id === p.id
            return (
              <div key={p.id} style={{ border: `2px solid ${sel ? 'var(--negro)' : 'var(--crema3)'}`, background: sel ? 'var(--negro)' : 'var(--blanco)' }}>
                <button onClick={() => setActiva(p)} style={{ textAlign: 'left', padding: '0.85rem 1rem 0.5rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <p style={{ fontWeight: 500, fontSize: '0.82rem', color: sel ? 'var(--crema)' : 'var(--negro)', marginBottom: '0.3rem', fontFamily: 'DM Sans, sans-serif' }}>{p.titulo}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: 4, background: sel ? 'rgba(247,243,238,0.15)' : 'var(--crema2)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${registros.length ? (n / registros.length) * 100 : 0}%`, background: '#25D366', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: '0.62rem', color: sel ? 'rgba(247,243,238,0.5)' : 'var(--gris)', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}>{n}/{registros.length}</span>
                  </div>
                </button>
                <div style={{ padding: '0 1rem 0.65rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => startEditar(p)}
                    style={{ fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'none', border: `1px solid ${sel ? 'rgba(247,243,238,0.2)' : 'var(--crema3)'}`, padding: '0.2rem 0.6rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: sel ? 'rgba(247,243,238,0.5)' : 'var(--gris)' }}>
                    Editar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DESTINATARIOS */}
      <div>
        {!activa ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gris-l)' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300 }}>Selecciona un mensaje</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--negro)', padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(247,243,238,0.4)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>Mensaje activo</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 300, color: 'var(--crema)', marginBottom: '0.75rem' }}>{activa.titulo}</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(247,243,238,0.55)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'DM Sans, sans-serif' }}>
                {activa.contenido.replace(/\{nombre\}/g, '[nombre]').replace(/\{etiqueta\}/g, '[etiqueta]').replace(/\{empresa\}/g, '[empresa]').replace(/\{isla\}/g, '[isla]')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div style={{ flex: 1, height: 6, background: 'rgba(247,243,238,0.1)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#25D366', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--amarillo)', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>{totalEnviados}/{registros.length} enviados</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button onClick={() => downloadAllVcf(registros)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid var(--crema3)', padding: '0.35rem 0.85rem', background: 'var(--blanco)', color: 'var(--gris)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                Exportar todos los contactos (.vcf)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                style={{ flex: '1 1 140px', background: 'var(--blanco)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.55rem 0.85rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', outline: 'none' }} />
              {(['todos', 'pendientes', 'enviados'] as const).map(f => (
                <button key={f} onClick={() => setFiltro(f)} style={{ padding: '0.45rem 0.9rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: `1px solid ${filtro === f ? 'var(--negro)' : 'var(--crema3)'}`, background: filtro === f ? 'var(--negro)' : 'var(--blanco)', color: filtro === f ? 'var(--crema)' : 'var(--gris)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {f === 'todos' ? `Todos (${registros.length})` : f === 'pendientes' ? `Pendientes (${registros.filter(r => !yaEnviado(r.id)).length})` : `Enviados (${totalEnviados})`}
                </button>
              ))}
            </div>

            <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)' }}>
              {filtrados.length === 0 && <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gris-l)', fontSize: '0.82rem' }}>Sin resultados</div>}
              {filtrados.map((r, i) => {
                const enviado = yaEnviado(r.id)
                const tel = r.telefono ? r.telefono.replace(/\D/g, '') : null
                const waUrl = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(buildMensaje(activa.contenido, r))}` : null
                return (
                  <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.75rem', alignItems: 'center', padding: '0.65rem 1rem', borderBottom: '1px solid var(--crema3)', background: enviado ? '#f0fdf4' : i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)' }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '0.82rem', color: 'var(--negro)', marginBottom: '0.1rem' }}>{r.nombre}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {r.empresa && <span style={{ fontSize: '0.68rem', color: 'var(--gris)' }}>{r.empresa}</span>}
                        {r.isla && <span style={{ fontSize: '0.58rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.05rem 0.35rem' }}>{r.isla}</span>}
                        {r.telefono && <span style={{ fontSize: '0.65rem', color: 'var(--gris-l)' }}>{r.telefono}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {r.telefono && (
                        <button onClick={() => downloadVcf(r)} title="Guardar contacto"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.58rem', border: '1px solid var(--crema3)', padding: '0.25rem 0.5rem', background: 'var(--crema2)', color: 'var(--gris)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                          .vcf
                        </button>
                      )}
                      {waUrl ? (
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.62rem', color: '#25D366', textDecoration: 'none', border: '1px solid #25D366', padding: '0.25rem 0.6rem', whiteSpace: 'nowrap' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d={waPath}/></svg> Chat
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.6rem', color: 'var(--gris-l)', padding: '0.25rem 0.5rem', border: '1px solid var(--crema3)' }}>Sin tel.</span>
                      )}
                    </div>
                    <button onClick={() => toggleEnviado(r.id)} disabled={updating === r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.62rem', border: `1px solid ${enviado ? '#16a34a' : 'var(--crema3)'}`, padding: '0.25rem 0.6rem', background: enviado ? '#dcfce7' : 'var(--crema2)', color: enviado ? '#16a34a' : 'var(--gris)', cursor: 'pointer', opacity: updating === r.id ? 0.5 : 1, whiteSpace: 'nowrap' }}>
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
