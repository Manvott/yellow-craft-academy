'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { Producto } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  producto: Producto
}

const ISLAS = ['lanzarote', 'fuerteventura', 'gran_canaria', 'tenerife', 'la_palma', 'la_gomera', 'el_hierro', 'otra']

const inputStyle: React.CSSProperties = {
  background: 'var(--blanco)',
  border: '1px solid var(--crema3)',
  color: 'var(--grafito)',
  padding: '0.85rem 1.1rem',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '0.82rem',
  fontWeight: 300,
  outline: 'none',
  width: '100%',
}

export default function SolicitudModal({ open, onClose, producto }: Props) {
  const t = useTranslations('solicitud')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', empresa: '', isla: '', cargo: '', mensaje: '',
  })

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, producto_id: producto.id, proveedor_id: producto.proveedor_id }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setSuccess(false)
    setError('')
    setForm({ nombre: '', email: '', telefono: '', empresa: '', isla: '', cargo: '', mensaje: '' })
    onClose()
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase',
    color: 'var(--gris)', display: 'block', marginBottom: '0.4rem',
    fontFamily: 'DM Sans, sans-serif',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,8,0.7)' }} onClick={handleClose} />
      <div style={{ position: 'relative', background: 'var(--blanco)', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ background: 'var(--negro)', padding: '1.5rem 1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.58rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(247,243,238,0.35)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
                {t('title')}
              </p>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 300, color: 'var(--crema)', lineHeight: 1.1 }}>
                {producto.nombre}
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'rgba(245,197,24,0.7)', marginTop: '0.25rem', fontFamily: 'DM Sans, sans-serif' }}>
                {producto.proveedor?.nombre}
              </p>
            </div>
            <button onClick={handleClose} style={{ color: 'rgba(247,243,238,0.4)', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        </div>

        {success ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: 'var(--amarillo)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem' }}>✓</div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.5rem' }}>Solicitud enviada</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--gris)', lineHeight: 1.7 }}>{t('success')}</p>
            <button onClick={handleClose} style={{ marginTop: '2rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.75rem 2rem', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>{t('nombre')} <span style={{ color: 'var(--amarillo)' }}>*</span></label>
                <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>{t('email')} <span style={{ color: 'var(--amarillo)' }}>*</span></label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('telefono')}</label>
                <input type="tel" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('isla')}</label>
                <select value={form.isla} onChange={e => setForm(f => ({ ...f, isla: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">—</option>
                  {ISLAS.map(i => <option key={i} value={i}>{t(`islas.${i}`)}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('empresa')}</label>
                <input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('cargo')}</label>
                <input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>{t('mensaje')}</label>
                <textarea rows={3} value={form.mensaje} onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>

            {error && <p style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: '0.75rem' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '1.25rem', width: '100%',
                background: 'var(--negro)', color: 'var(--crema)',
                border: 'none', padding: '1rem',
                fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase',
                fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1, fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {loading ? '...' : t('submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
