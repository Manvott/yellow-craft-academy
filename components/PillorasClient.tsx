'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { SeccionPildora, Pildora } from '@/lib/types'

interface Props { secciones: SeccionPildora[] }

function PildoraCard({ pildora }: { pildora: Pildora }) {
  const t = useTranslations('pildoras')
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--blanco)',
        border: '1px solid var(--crema3)',
        borderColor: hovered ? 'var(--gris-l)' : 'var(--crema3)',
        overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}
    >
      {pildora.imagen_url && (
        <img src={pildora.imagen_url} alt={pildora.titulo} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
      )}
      <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 400, color: 'var(--negro)', marginBottom: '0.75rem', lineHeight: 1.15 }}>
          {pildora.titulo}
        </h3>
        {pildora.contenido && (
          <>
            <p style={{
              fontSize: '0.8rem', color: 'var(--gris)', lineHeight: 1.75,
              display: expanded ? 'block' : '-webkit-box',
              WebkitLineClamp: expanded ? undefined : 3,
              WebkitBoxOrient: 'vertical',
              overflow: expanded ? 'visible' : 'hidden',
            }}>
              {pildora.contenido}
            </p>
            {pildora.contenido.length > 180 && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{ marginTop: '0.5rem', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--negro)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'DM Sans, sans-serif', borderBottom: '1px solid var(--crema3)' }}
              >
                {expanded ? t('read_less') : t('read_more')}
              </button>
            )}
          </>
        )}
        {pildora.video_url && (
          <a
            href={pildora.video_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.35rem 0.9rem', textDecoration: 'none', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}
          >
            ▶ Ver video
          </a>
        )}
      </div>
    </div>
  )
}

export default function PillorasClient({ secciones }: Props) {
  const t = useTranslations('pildoras')
  const [activeSeccion, setActiveSeccion] = useState<string | null>(secciones[0]?.id ?? null)

  if (secciones.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 0', color: 'var(--gris)' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--gris-l)', marginBottom: '1rem' }}>📚</p>
        <p style={{ fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}>{t('no_content')}</p>
      </div>
    )
  }

  const seccionActiva = secciones.find(s => s.id === activeSeccion)

  return (
    <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-start' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0 }}>
        <div style={{ border: '1px solid var(--crema3)', overflow: 'hidden' }}>
          {secciones.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveSeccion(s.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '1.1rem 1.25rem',
                borderBottom: i < secciones.length - 1 ? '1px solid var(--crema3)' : 'none',
                background: activeSeccion === s.id ? 'var(--negro)' : 'var(--blanco)',
                cursor: 'pointer', border: 'none',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {s.icono && <span style={{ fontSize: '1.1rem' }}>{s.icono}</span>}
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 500, color: activeSeccion === s.id ? 'var(--crema)' : 'var(--negro)', fontFamily: 'DM Sans, sans-serif' }}>
                    {s.nombre}
                  </p>
                  {s.descripcion && (
                    <p style={{ fontSize: '0.7rem', color: activeSeccion === s.id ? 'rgba(247,243,238,0.4)' : 'var(--gris)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                      {s.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Contenido */}
      <div style={{ flex: 1 }}>
        {seccionActiva && (
          <>
            <div style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--crema3)' }}>
              <p style={{ fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>Sección</p>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.8rem,3vw,2.5rem)', fontWeight: 300, color: 'var(--negro)', lineHeight: 1.1 }}>
                {seccionActiva.icono && <span style={{ marginRight: '0.5rem' }}>{seccionActiva.icono}</span>}
                {seccionActiva.nombre}
              </h2>
            </div>
            {seccionActiva.pildoras && seccionActiva.pildoras.filter(p => p.activo).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {seccionActiva.pildoras
                  .filter(p => p.activo)
                  .sort((a, b) => a.orden - b.orden)
                  .map(p => <PildoraCard key={p.id} pildora={p} />)}
              </div>
            ) : (
              <div style={{ padding: '4rem 0', color: 'var(--gris-l)', fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                {t('no_content')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
