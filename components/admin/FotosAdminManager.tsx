'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Foto {
  id: string
  nombre_archivo: string
  url_publica: string
  r2_key: string
  sesion: string | null
  subido_por: string | null
  created_at: string
}

interface Props { fotos: Foto[] }

export default function FotosAdminManager({ fotos: fotosIniciales }: Props) {
  const router = useRouter()
  const [fotos, setFotos] = useState<Foto[]>(fotosIniciales)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [sesionNueva, setSesionNueva] = useState('general')
  const [filtro, setFiltro] = useState('todas')
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [eliminando, setEliminando] = useState(false)

  const sesiones = ['todas', ...Array.from(new Set(fotos.map(f => f.sesion ?? 'general')))]
  const filtradas = filtro === 'todas' ? fotos : fotos.filter(f => (f.sesion ?? 'general') === filtro)

  async function subirFotos(files: FileList) {
    setSubiendo(true)
    const nuevas: Foto[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgreso(Math.round(((i + 1) / files.length) * 100))
      const fd = new FormData()
      fd.append('file', file)
      fd.append('sesion', sesionNueva)
      const res = await fetch('/api/fotos/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const { id, url } = await res.json()
        nuevas.push({ id, nombre_archivo: file.name, url_publica: url, r2_key: '', sesion: sesionNueva, subido_por: null, created_at: new Date().toISOString() })
      }
    }
    setFotos(prev => [...nuevas, ...prev])
    setSubiendo(false)
    setProgreso(0)
  }

  function toggleSeleccion(id: string) {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function eliminarSeleccionadas() {
    if (!seleccionadas.size) return
    if (!confirm(`¿Eliminar ${seleccionadas.size} foto(s)?`)) return
    setEliminando(true)
    const supabase = createClient()
    const ids = Array.from(seleccionadas)
    await supabase.from('fotos_evento').delete().in('id', ids)
    setFotos(prev => prev.filter(f => !seleccionadas.has(f.id)))
    setSeleccionadas(new Set())
    setEliminando(false)
    router.refresh()
  }

  return (
    <div>
      {/* Upload */}
      <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.07)', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gris)', display: 'block', marginBottom: '0.3rem', fontFamily: 'DM Sans, sans-serif' }}>
              Sesión
            </label>
            <input
              type="text"
              value={sesionNueva}
              onChange={e => setSesionNueva(e.target.value)}
              placeholder="ej: apertura, taller-croqueta"
              style={{ width: '100%', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <label style={{ background: 'var(--negro)', color: 'var(--crema)', padding: '0.55rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
            {subiendo ? `${progreso}%` : '+ Subir fotos'}
            <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) subirFotos(e.target.files) }} />
          </label>
        </div>
        {subiendo && (
          <div style={{ height: '4px', background: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--amarillo)', width: `${progreso}%`, transition: 'width 0.3s' }} />
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>{fotos.length} fotos</span>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {sesiones.map(s => (
            <button key={s} onClick={() => setFiltro(s)}
              style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', border: filtro === s ? '1.5px solid var(--negro)' : '1.5px solid rgba(0,0,0,0.1)', background: filtro === s ? 'var(--negro)' : 'transparent', color: filtro === s ? 'var(--crema)' : 'var(--gris)', fontSize: '0.68rem', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>
        {seleccionadas.size > 0 && (
          <button onClick={eliminarSeleccionadas} disabled={eliminando}
            style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}
          >
            {eliminando ? 'Eliminando…' : `Eliminar ${seleccionadas.size}`}
          </button>
        )}
      </div>

      {/* Grid */}
      {filtradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif', padding: '4rem 0', fontSize: '0.85rem' }}>
          Sin fotos en esta sesión.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {filtradas.map(foto => {
            const sel = seleccionadas.has(foto.id)
            return (
              <div key={foto.id}
                onClick={() => toggleSeleccion(foto.id)}
                style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', border: sel ? '2.5px solid var(--amarillo)' : '2.5px solid transparent', boxSizing: 'border-box' }}
              >
                <img src={foto.url_publica} alt={foto.nombre_archivo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {sel && (
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: 20, height: 20, borderRadius: '50%', background: 'var(--amarillo)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>✓</div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.4rem 0.6rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                  <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {foto.subido_por ?? ''} · {foto.sesion ?? 'general'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
