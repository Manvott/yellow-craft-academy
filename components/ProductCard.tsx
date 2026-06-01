'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { Producto } from '@/lib/types'
import SolicitudModal from './SolicitudModal'

interface Props {
  producto: Producto
}

export default function ProductCard({ producto }: Props) {
  const t = useTranslations('home')
  const tp = useTranslations('product')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden group">
        <div className="relative h-48 bg-gray-50">
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🍽️</span>
              </div>
            </div>
          )}
          {producto.categoria && (
            <span className="absolute top-3 left-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
              {producto.categoria}
            </span>
          )}
        </div>

        <div className="p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">
            {producto.proveedor?.nombre}
          </p>
          <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">
              {producto.descripcion}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div>
              {producto.precio_orientativo && (
                <p className="text-sm font-semibold text-gray-900">
                  {producto.precio_orientativo.toFixed(2)} €
                  {producto.unidad_venta && (
                    <span className="text-xs text-gray-400 font-normal ml-1">
                      / {producto.unidad_venta}
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-xs px-3 py-2 rounded-xl transition-colors"
            >
              {t('request_info')}
            </button>
          </div>
        </div>
      </div>

      <SolicitudModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        producto={producto}
      />
    </>
  )
}
