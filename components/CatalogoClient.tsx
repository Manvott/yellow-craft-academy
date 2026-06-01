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

  const inputStyle: React.CSSProperties = {
    background: 'var(--blanco)',
    border: '1px solid var(--crema3)',
    color: 'var(--grafito)',
    padding: '0.8rem 1.1rem',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.82rem',
    fontWeight: 300,
    outline: 'none',
  }

  return (
    <div>
      {/* Eyebrow */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={{ fontSize: '0.62rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>
          {proveedores.length} proveedores · {productos.length} productos
        </p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,3vw,2.8rem)', fontWeight: 300, color: 'var(--negro)', lineHeight: 1.05, marginBottom: '2rem' }}>
          Descubre el<br /><em style={{ fontStyle: 'italic', color: 'var(--gris)' }}>portfolio</em>
        </h2>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, flex: '1 1 200px', minWidth: 180 }}
          />
          <select
            value={proveedorFiltro}
            onChange={e => setProveedorFiltro(e.target.value)}
            style={{ ...inputStyle, background: 'var(--blanco)', cursor: 'pointer', minWidth: 160 }}
          >
            <option value="all">{t('all_suppliers')}</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            style={{ ...inputStyle, background: 'var(--blanco)', cursor: 'pointer', minWidth: 160 }}
          >
            <option value="all">{t('all_categories')}</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '8rem 0', color: 'var(--gris)' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, marginBottom: '0.5rem' }}>Sin resultados</p>
          <p style={{ fontSize: '0.82rem' }}>{t('no_products')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(p => <ProductCard key={p.id} producto={p} />)}
        </div>
      )}

      <p style={{ textAlign: 'center', color: 'var(--gris-l)', fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '3rem', fontFamily: 'DM Sans, sans-serif' }}>
        {filtered.length} productos
      </p>
    </div>
  )
}
