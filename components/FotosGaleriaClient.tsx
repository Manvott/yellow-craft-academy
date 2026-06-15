'use client'

import { useState } from 'react'

interface Foto {
  id: string
  nombre_archivo: string
  url_publica: string
  sesion: string | null
  subido_por: string | null
  created_at: string
}

interface Props { fotosIniciales: Foto[] }

function descargarFoto(url: string, nombre: string) {
  const a = document.createElement('a')
  a.href = `/api/fotos/download?url=${encodeURIComponent(url)}&nombre=${encodeURIComponent(nombre || 'foto.jpg')}`
  a.download = nombre || 'foto.jpg'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function FotosGaleriaClient({ fotosIniciales }: Props) {
  const [filtro, setFiltro] = useState('todas')
  const [lightbox, setLightbox] = useState<Foto | null>(null)

  const sesiones = ['todas', ...Array.from(new Set(fotosIniciales.map(f => f.sesion ?? 'general')))]
  const filtradas = filtro === 'todas' ? fotosIniciales : fotosIniciales.filter(f => (f.sesion ?? 'general') === filtro)

  return (
    <div>
      {/* Filtros por sesión */}
      {sesiones.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {sesiones.map(s => (
            <button key={s} onClick={() => setFiltro(s)}
              style={{ padding: '0.35rem 1rem', borderRadius: '2rem', border: filtro === s ? '1.5px solid var(--negro)' : '1.5px solid rgba(0,0,0,0.1)', background: filtro === s ? 'var(--negro)' : 'transparent', color: filtro === s ? 'var(--crema)' : 'var(--gris)', fontSize: '0.72rem', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em', cursor: 'pointer', textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif', padding: '6rem 0', fontSize: '0.9rem' }}>
          Las fotografías del evento estarán disponibles aquí próximamente.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {filtradas.map(foto => (
            <div key={foto.id} onClick={() => setLightbox(foto)}
              style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', background: '#f0ece6' }}>
              <img src={foto.url_publica} alt={foto.nombre_archivo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {foto.subido_por && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.4rem 0.75rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }}>
                  <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif' }}>{foto.subido_por}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <img src={lightbox.url_publica} alt={lightbox.nombre_archivo} onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '0.5rem' }} />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
            {lightbox.subido_por && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>{lightbox.subido_por}</span>
            )}
            <button onClick={e => { e.stopPropagation(); descargarFoto(lightbox.url_publica, lightbox.nombre_archivo) }}
              style={{ background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              ↓ Descargar
            </button>
            <button onClick={() => setLightbox(null)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
