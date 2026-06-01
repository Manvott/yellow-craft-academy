'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { Producto } from '@/lib/types'
import SolicitudModal from './SolicitudModal'

interface Props { producto: Producto }

export default function ProductCard({ producto }: Props) {
  const t = useTranslations('home')
  const [modalOpen, setModalOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--blanco)',
          border: '1px solid var(--crema3)',
          overflow: 'hidden',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          borderColor: hovered ? 'var(--gris-l)' : 'var(--crema3)',
          boxShadow: hovered ? '0 4px 24px rgba(10,10,8,0.07)' : 'none',
        }}
      >
        {/* Imagen */}
        <div style={{ position: 'relative', height: 200, background: 'var(--crema2)', overflow: 'hidden' }}>
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              style={{ objectFit: 'cover', transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.4s' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 60, height: 60, background: 'var(--crema3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris-l)', textAlign: 'center', lineHeight: 1.8 }}>
                  Sin<br />imagen
                </span>
              </div>
            </div>
          )}
          {producto.categoria && (
            <span style={{
              position: 'absolute', top: 12, left: 12,
              background: 'var(--amarillo)', color: 'var(--negro)',
              fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase',
              padding: '0.2rem 0.7rem', fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
            }}>
              {producto.categoria}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '1.25rem 1.25rem 1.5rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris-l)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
            {producto.proveedor?.nombre}
          </p>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.35rem', fontWeight: 400, color: 'var(--negro)', marginBottom: '0.5rem', lineHeight: 1.15 }}>
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p style={{ fontSize: '0.78rem', color: 'var(--gris)', lineHeight: 1.7, marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {producto.descripcion}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <div>
              {producto.precio_orientativo && (
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--negro)', fontFamily: 'DM Sans, sans-serif' }}>
                  {producto.precio_orientativo.toFixed(2)} €
                  {producto.unidad_venta && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--gris-l)', fontWeight: 300, marginLeft: 4 }}>
                      / {producto.unidad_venta}
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: 'var(--negro)', color: 'var(--crema)',
                fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                padding: '0.5rem 1.1rem', fontWeight: 500, border: 'none', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', transition: 'background 0.2s',
              }}
            >
              {t('request_info')}
            </button>
          </div>
        </div>
      </div>

      <SolicitudModal open={modalOpen} onClose={() => setModalOpen(false)} producto={producto} />
    </>
  )
}
