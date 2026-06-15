'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

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

async function subirFoto(
  file: File,
  sesion: string,
): Promise<{ foto: Foto | null; error?: string }> {
  try {
    const presignRes = await fetch('/api/fotos/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: file.name, tipo: file.type || 'image/jpeg', sesion }),
    })
    if (!presignRes.ok) return { foto: null, error: `Presign ${presignRes.status}: ${await presignRes.text()}` }
    const { uploadUrl, key, publicUrl } = await presignRes.json()

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'image/jpeg' },
      body: file,
    })
    if (!putRes.ok) return { foto: null, error: `R2 ${putRes.status}` }

    const regRes = await fetch('/api/fotos/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_archivo: file.name, url_publica: publicUrl, r2_key: key, sesion, tamano_bytes: file.size }),
    })
    if (!regRes.ok) return { foto: null, error: `Register ${regRes.status}: ${await regRes.text()}` }
    const { id } = await regRes.json()

    return { foto: { id, nombre_archivo: file.name, url_publica: publicUrl, r2_key: key, sesion, subido_por: null, created_at: new Date().toISOString() } }
  } catch (e: any) {
    return { foto: null, error: e?.message ?? 'Error desconocido' }
  }
}

export default function FotosAdminManager({ fotos: fotosIniciales }: Props) {
  const router = useRouter()
  const [fotos, setFotos] = useState<Foto[]>(fotosIniciales)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [sesion, setSesion] = useState('general')
  const [filtro, setFiltro] = useState('todas')
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sesiones = ['todas', ...Array.from(new Set(fotos.map(f => f.sesion ?? 'general')))]
  const filtradas = filtro === 'todas' ? fotos : fotos.filter(f => (f.sesion ?? 'general') === filtro)

  async function handleFiles(files: FileList) {
    setSubiendo(true)
    setError('')
    const lista = Array.from(files)
    const nuevas: Foto[] = []
    const errores: string[] = []
    let completados = 0
    const CONCURRENCIA = 4
    let cursor = 0

    async function worker() {
      while (cursor < lista.length) {
        const i = cursor++
        const file = lista[i]
        const { foto, error: err } = await subirFoto(file, sesion)
        if (foto) nuevas.push(foto)
        else if (err) errores.push(`${file.name}: ${err}`)
        completados++
        setProgreso(Math.round((completados / lista.length) * 100))
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCIA, lista.length) }, worker))

    if (errores.length) setError(`${errores.length} de ${lista.length} fallaron — ${errores.slice(0, 3).join(' | ')}`)
    setFotos(prev => [...nuevas, ...prev])
    setSubiendo(false)
    setProgreso(0)
    if (inputRef.current) inputRef.current.value = ''
    if (nuevas.length) router.refresh()
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
    const ids = Array.from(seleccionadas)
    const res = await fetch('/api/fotos/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) {
      setFotos(prev => prev.filter(f => !seleccionadas.has(f.id)))
      setSeleccionadas(new Set())
      router.refresh()
    } else {
      const t = await res.text()
      setError(`Error al eliminar: ${t}`)
    }
    setEliminando(false)
  }

  return (
    <div>
      {/* Upload panel — estilo landing */}
      <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.07)', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gris)', display: 'block', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
              Sesión / categoría
            </label>
            <input
              type="text"
              value={sesion}
              onChange={e => setSesion(e.target.value)}
              placeholder="ej: apertura, taller-croqueta"
              style={{ width: '100%', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <label
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(245,197,24,0.5)', borderRadius: '0.75rem', padding: '2.5rem', cursor: subiendo ? 'default' : 'pointer', background: 'rgba(245,197,24,0.03)' }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); if (!subiendo && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files) }}
        >
          <span style={{ fontSize: '2.2rem', marginBottom: '0.6rem' }}>📷</span>
          <span style={{ fontSize: '0.87rem', fontFamily: 'DM Sans, sans-serif', color: 'var(--gris)' }}>
            {subiendo ? `Subiendo bloque… ${progreso}%` : 'Arrastra un bloque de fotos JPEG aquí o haz clic para seleccionar'}
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
            style={{ display: 'none' }}
            disabled={subiendo}
            onChange={e => { if (e.target.files?.length) handleFiles(e.target.files) }}
          />
        </label>

        {subiendo && (
          <div style={{ marginTop: '0.8rem', height: '4px', background: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--amarillo)', width: `${progreso}%`, transition: 'width 0.3s' }} />
          </div>
        )}
        {error && (
          <p style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: '#dc2626', fontFamily: 'DM Sans, sans-serif', wordBreak: 'break-all' }}>{error}</p>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>{fotos.length} fotos</span>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {sesiones.map(s => (
            <button key={s} onClick={() => setFiltro(s)}
              style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', border: filtro === s ? '1.5px solid var(--negro)' : '1.5px solid rgba(0,0,0,0.1)', background: filtro === s ? 'var(--negro)' : 'transparent', color: filtro === s ? 'var(--crema)' : 'var(--gris)', fontSize: '0.68rem', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
        {seleccionadas.size > 0 && (
          <button onClick={eliminarSeleccionadas} disabled={eliminando}
            style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
            {eliminando ? 'Eliminando…' : `Eliminar ${seleccionadas.size}`}
          </button>
        )}
      </div>

      {/* Grid */}
      {filtradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif', padding: '4rem 0', fontSize: '0.85rem' }}>
          Sin fotos. Usa el área de arriba para subir.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {filtradas.map(foto => {
            const sel = seleccionadas.has(foto.id)
            return (
              <div key={foto.id} onClick={() => toggleSeleccion(foto.id)}
                style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', border: sel ? '2.5px solid var(--amarillo)' : '2.5px solid transparent', boxSizing: 'border-box' }}>
                <img src={foto.url_publica} alt={foto.nombre_archivo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {sel && (
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: 22, height: 22, borderRadius: '50%', background: 'var(--amarillo)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>✓</div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.4rem 0.6rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                  <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {foto.sesion ?? 'general'}
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
