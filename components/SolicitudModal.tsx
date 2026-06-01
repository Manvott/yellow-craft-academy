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
        body: JSON.stringify({
          ...form,
          producto_id: producto.id,
          proveedor_id: producto.proveedor_id,
        }),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-yellow-400 px-6 py-4 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-black text-gray-900 text-lg">{t('title')}</h2>
              <p className="text-gray-700 text-sm">{producto.nombre}</p>
            </div>
            <button onClick={handleClose} className="text-gray-900 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <p className="font-semibold text-gray-900">{t('success')}</p>
            <button onClick={handleClose} className="mt-6 bg-yellow-400 text-gray-900 font-bold px-6 py-2 rounded-xl">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  {t('nombre')} <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  {t('email')} <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">{t('telefono')}</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">{t('isla')}</label>
                <select
                  value={form.isla}
                  onChange={e => setForm(f => ({ ...f, isla: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                >
                  <option value="">—</option>
                  {ISLAS.map(i => (
                    <option key={i} value={i}>{t(`islas.${i}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">{t('empresa')}</label>
                <input
                  value={form.empresa}
                  onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">{t('cargo')}</label>
                <input
                  value={form.cargo}
                  onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-gray-700 block mb-1">{t('mensaje')}</label>
                <textarea
                  rows={3}
                  value={form.mensaje}
                  onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? '...' : t('submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
