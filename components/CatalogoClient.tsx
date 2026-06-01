'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { Producto, Proveedor } from '@/lib/types'
import ProductCard from './ProductCard'

interface Props {
  productos: Producto[]
  proveedores: Proveedor[]
}

export default function CatalogoClient({ productos, proveedores }: Props) {
  const t = useTranslations('home')
  const [search, setSearch] = useState('')
  const [proveedorFiltro, setProveedorFiltro] = useState('all')
  const [categoriaFiltro, setCategoriaFiltro] = useState('all')

  const categorias = useMemo(() => {
    const cats = new Set(productos.map(p => p.categoria).filter(Boolean))
    return Array.from(cats) as string[]
  }, [productos])

  const filtered = useMemo(() => {
    return productos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(search.toLowerCase())
      const matchProv = proveedorFiltro === 'all' || p.proveedor_id === proveedorFiltro
      const matchCat = categoriaFiltro === 'all' || p.categoria === categoriaFiltro
      return matchSearch && matchProv && matchCat
    })
  }, [productos, search, proveedorFiltro, categoriaFiltro])

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
        />
        <select
          value={proveedorFiltro}
          onChange={e => setProveedorFiltro(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
        >
          <option value="all">{t('all_suppliers')}</option>
          {proveedores.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <select
          value={categoriaFiltro}
          onChange={e => setCategoriaFiltro(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
        >
          <option value="all">{t('all_categories')}</option>
          {categorias.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-medium">{t('no_products')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(p => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      )}

      <p className="text-center text-gray-400 text-sm mt-8">
        {filtered.length} productos
      </p>
    </div>
  )
}
