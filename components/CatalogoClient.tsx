'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import type { Producto, Proveedor } from '@/lib/types'
import { CATEGORIAS_PRODUCTO } from '@/lib/categorias'
import ProductCard from './ProductCard'

interface Props {
  productos: Producto[]
  proveedores: Proveedor[]
  categoriasDB?: string[]
}

export default function CatalogoClient({ productos, proveedores, categoriasDB = [] }: Props) {
  const t = useTranslations('home')
  const [search, setSearch] = useState('')
  const [proveedorFiltro, setProveedorFiltro] = useState('all')
  const [categoriaFiltro, setCategoriaFiltro] = useState('all')

  const categorias = useMemo(() => {
    const lista = categoriasDB.length ? categoriasDB : [...CATEGORIAS_PRODUCTO]
    const enProductos = new Set(productos.map(p => p.categoria).filter(Boolean) as string[])
    // Primero las que tienen productos, luego el resto
    const con = lista.filter(c => enProductos.has(c))
    const sin = lista.filter(c => !enProductos.has(c))
    const custom = Array.from(enProductos).filter(c => !lista.includes(c))
    return [...con, ...custom, ...sin]
  }, [productos, categoriasDB])

  // Proveedores con al menos 1 producto publicado
  const proveedoresConProductos = useMemo(() => {
    const ids = new Set(productos.map(p => p.proveedor_id))
    return proveedores.filter(p => ids.has(p.id))
  }, [productos, proveedores])

  const filtered = useMemo(() => {
    return productos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(search.toLowerCase())
      const matchProv = proveedorFiltro === 'all' || p.proveedor_id === proveedorFiltro
      const matchCat = categoriaFiltro === 'all' || p.categoria === categoriaFiltro
      return matchSearch && matchProv && matchCat
    })
  }, [productos, search, proveedorFiltro, categoriaFiltro])

  function selectMarca(id: string) {
    setProveedorFiltro(prev => prev === id ? 'all' : id)
    // Scroll suave a los productos
    setTimeout(() => {
      document.getElementById('catalogo-productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--blanco)', border: '1px solid var(--crema3)',
    color: 'var(--grafito)', padding: '0.75rem 1rem',
    fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem',
    fontWeight: 300, outline: 'none',
  }

  return (
    <div>
      {/* Cabecera */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.62rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>
          {proveedores.length} marcas · {productos.length} productos
        </p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,3vw,2.8rem)', fontWeight: 300, color: 'var(--negro)', lineHeight: 1.05 }}>
          Descubre la<br /><em style={{ fontStyle: 'italic', color: 'var(--gris)' }}>selección de AVA</em>
        </h2>
      </div>

      {/* ── LOGOS DE MARCAS ── */}
      {proveedores.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1.25rem', fontFamily: 'DM Sans, sans-serif' }}>
            Marcas participantes — pulsa para ver sus productos
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Botón "Todas" */}
            <button
              onClick={() => setProveedorFiltro('all')}
              style={{
                padding: '0.5rem 1.25rem',
                border: `1px solid ${proveedorFiltro === 'all' ? 'var(--negro)' : 'var(--crema3)'}`,
                background: proveedorFiltro === 'all' ? 'var(--negro)' : 'var(--blanco)',
                color: proveedorFiltro === 'all' ? 'var(--crema)' : 'var(--gris)',
                cursor: 'pointer', fontSize: '0.68rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              Todas
            </button>

            {/* Card por marca */}
            {proveedores.map(prov => {
              const activo = proveedorFiltro === prov.id
              const nProductos = productos.filter(p => p.proveedor_id === prov.id).length
              return (
                <button
                  key={prov.id}
                  onClick={() => selectMarca(prov.id)}
                  title={`${prov.nombre} — ${nProductos} producto${nProductos !== 1 ? 's' : ''}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: `${activo ? '2px' : '1px'} solid ${activo ? 'var(--negro)' : 'var(--crema3)'}`,
                    background: activo ? 'var(--negro)' : 'var(--blanco)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    minWidth: 90,
                  }}
                >
                  {/* Logo o inicial */}
                  <div style={{ width: 56, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {prov.logo_url ? (
                      <img
                        src={prov.logo_url}
                        alt={prov.nombre}
                        style={{
                          maxWidth: '100%', maxHeight: '100%',
                          objectFit: 'contain',
                          filter: activo ? 'brightness(0) invert(1)' : 'none',
                          transition: 'filter 0.2s',
                        }}
                      />
                    ) : (
                      <span style={{
                        fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300,
                        color: activo ? 'var(--crema)' : 'var(--negro)',
                        letterSpacing: '-0.02em',
                      }}>
                        {prov.nombre.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Nombre */}
                  <span style={{
                    fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: activo ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif',
                    whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {prov.nombre}
                  </span>
                  {/* Contador productos */}
                  {nProductos > 0 && (
                    <span style={{
                      fontSize: '0.55rem', background: activo ? 'var(--amarillo)' : 'var(--crema2)',
                      color: 'var(--negro)', padding: '0.05rem 0.4rem', fontFamily: 'DM Sans, sans-serif',
                    }}>
                      {nProductos}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Nombre de marca activa */}
          {proveedorFiltro !== 'all' && (
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: 'var(--negro)' }}>
                {proveedores.find(p => p.id === proveedorFiltro)?.nombre}
              </p>
              {proveedores.find(p => p.id === proveedorFiltro)?.web_url && (
                <a href={proveedores.find(p => p.id === proveedorFiltro)!.web_url!}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.65rem', color: 'var(--gris)', textDecoration: 'none', letterSpacing: '0.15em', textTransform: 'uppercase', borderBottom: '1px solid var(--crema3)', paddingBottom: 1 }}>
                  Ver web →
                </a>
              )}
              <button onClick={() => setProveedorFiltro('all')}
                style={{ fontSize: '0.62rem', color: 'var(--gris)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>
                × Todas las marcas
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── BUSCADOR + FILTRO CATEGORÍA ── */}
      <div id="catalogo-productos" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 200px', minWidth: 180 }}
        />
        <select
          value={categoriaFiltro}
          onChange={e => setCategoriaFiltro(e.target.value)}
          style={{ ...inputStyle, background: 'var(--blanco)', cursor: 'pointer', minWidth: 160 }}
        >
          <option value="all">{t('all_categories')}</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ── GRID PRODUCTOS ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--gris)' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, marginBottom: '0.5rem' }}>Sin resultados</p>
          <p style={{ fontSize: '0.82rem' }}>{t('no_products')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(p => <ProductCard key={p.id} producto={p} />)}
        </div>
      )}

      <p style={{ textAlign: 'center', color: 'var(--gris-l)', fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '3rem', fontFamily: 'DM Sans, sans-serif' }}>
        {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
