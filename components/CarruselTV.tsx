'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Foto {
  id: string
  url_publica: string
  subido_por: string | null
  sesion: string | null
  created_at: string
}

interface Props { fotosIniciales: Foto[] }

const INTERVALO_MS = 6000
const POLL_MS = 20000

export default function CarruselTV({ fotosIniciales }: Props) {
  const [fotos, setFotos] = useState<Foto[]>(fotosIniciales)
  const [idx, setIdx] = useState(0)
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const fotosRef = useRef(fotos)
  fotosRef.current = fotos

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setPantallaCompleta(true)
      } else {
        await document.exitFullscreen()
        setPantallaCompleta(false)
      }
    } catch {}
  }

  useEffect(() => {
    const onChange = () => setPantallaCompleta(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const refrescar = useCallback(async () => {
    try {
      const sb = createClient()
      const { data } = await sb
        .from('fotos_evento')
        .select('id, url_publica, subido_por, sesion, created_at')
        .order('created_at', { ascending: false })
      if (data) {
        const actuales = fotosRef.current
        const cambio = data.length !== actuales.length ||
          data.some((f, i) => f.id !== actuales[i]?.id)
        if (cambio) setFotos(data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(prev => {
        const total = fotosRef.current.length
        return total ? (prev + 1) % total : 0
      })
    }, INTERVALO_MS)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(refrescar, POLL_MS)
    return () => clearInterval(t)
  }, [refrescar])

  useEffect(() => {
    if (idx >= fotos.length && fotos.length) setIdx(0)
  }, [fotos, idx])

  if (!fotos.length) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0A0A08', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
        <svg viewBox="0 0 560 560" xmlns="http://www.w3.org/2000/svg" style={{ width: 120, height: 120, opacity: 0.5 }}>
          <circle cx="280" cy="92" r="32" fill="#F5C518"/>
          <text x="280" y="242" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="72" fontWeight="200" letterSpacing="7" fill="#F7F3EE" textAnchor="middle">YELLOW</text>
          <text x="280" y="318" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="60" fontWeight="600" letterSpacing="14" fill="#F7F3EE" textAnchor="middle">CRAFT</text>
          <text x="280" y="378" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="18" fontWeight="400" letterSpacing="9" fill="#F7F3EE" textAnchor="middle" opacity="0.5">ACADEMY</text>
        </svg>
        <p style={{ color: 'rgba(247,243,238,0.4)', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', letterSpacing: '0.1em' }}>
          Las fotografías del evento aparecerán aquí…
        </p>
        {!pantallaCompleta && (
          <button onClick={toggleFullscreen}
            style={{ marginTop: '0.5rem', background: 'rgba(245,197,24,0.95)', color: '#0A0A08', border: 'none', borderRadius: '2rem', padding: '0.6rem 1.3rem', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', letterSpacing: '0.05em' }}>
            ⛶ Pantalla completa
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0A08', overflow: 'hidden' }}>
      {fotos.map((foto, i) => (
        <div
          key={foto.id}
          style={{
            position: 'absolute', inset: 0,
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Fondo difuminado para rellenar */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${foto.url_publica})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(40px) brightness(0.4)', transform: 'scale(1.1)',
          }} />
          <img
            src={foto.url_publica}
            alt=""
            style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', zIndex: 1 }}
          />
          {(foto.subido_por || foto.sesion) && (
            <div style={{ position: 'absolute', bottom: '2.5rem', left: '3rem', zIndex: 2 }}>
              {foto.sesion && (
                <p style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,197,24,0.9)', fontFamily: 'DM Sans, sans-serif' }}>
                  {foto.sesion}
                </p>
              )}
              {foto.subido_por && (
                <p style={{ margin: '0.3rem 0 0', fontSize: '1rem', color: 'rgba(247,243,238,0.7)', fontFamily: 'DM Sans, sans-serif' }}>
                  📷 {foto.subido_por}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Logo esquina */}
      <div style={{ position: 'absolute', top: '2rem', right: '3rem', zIndex: 3, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F5C518' }} />
        <span style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(247,243,238,0.5)', fontFamily: 'DM Sans, sans-serif' }}>
          Yellow Craft Academy
        </span>
      </div>

      {/* Botón pantalla completa */}
      {!pantallaCompleta && (
        <button onClick={toggleFullscreen}
          style={{ position: 'absolute', top: '2rem', left: '3rem', zIndex: 4, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,197,24,0.95)', color: '#0A0A08', border: 'none', borderRadius: '2rem', padding: '0.6rem 1.3rem', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', letterSpacing: '0.05em' }}>
          ⛶ Pantalla completa
        </button>
      )}

      {/* Indicador de progreso */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.1)', zIndex: 3 }}>
        <div style={{ height: '100%', background: '#F5C518', width: `${((idx + 1) / fotos.length) * 100}%`, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}
