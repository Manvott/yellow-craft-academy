'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Producto, Proveedor } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface Props { productos: Producto[]; proveedores: Proveedor[] }

const empty = {
  proveedor_id: '', nombre: '', descripcion: '', imagen_url: '',
  categoria: '', precio_orientativo: '', unidad_venta: '', orden: 0, disponible: true,
}

export default function ProductosManager({ productos, proveedores }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<typeof empty>(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [provFiltro, setProvFiltro] = useState('all')

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const data = {
      ...form,
      precio_orientativo: form.precio_orientativo ? parseFloat(form.precio_orientativo) : null,
    }
    if (editing) {
      await supabase.from('productos').update(data).eq('id', editing)
    } else {
      await supabase.from('productos').insert(data)
    }
    setForm(empty)
    setEditing(null)
    setLoading(false)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar producto?')) return
    const supabase = createClient()
    await supabase.from('productos').delete().eq('id', id)
    router.refresh()
  }

  function startEdit(p: Producto) {
    setEditing(p.id)
    setForm({
      proveedor_id: p.proveedor_id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      imagen_url: p.imagen_url ?? '',
      categoria: p.categoria ?? '',
      precio_orientativo: p.precio_orientativo?.toString() ?? '',
      unidad_venta: p.unidad_venta ?? '',
      orden: p.orden,
      disponible: p.disponible,
    })
  }

  const filtered = provFiltro === 'all' ? productos : productos.filter(p => p.proveedor_id === provFiltro)

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Proveedor *</label>
            <select
              value={form.proveedor_id}
              onChange={e => setForm(f => ({ ...f, proveedor_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            >
              <option value="">Seleccionar...</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          {[
            ['Nombre *', 'nombre'], ['Categoría', 'categoria'],
            ['Precio orientativo (€)', 'precio_orientativo'], ['Unidad de venta', 'unidad_venta'],
            ['Imagen URL', 'imagen_url'], ['Orden', 'orden'],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
              <input
                type={key === 'orden' || key === 'precio_orientativo' ? 'number' : 'text'}
                value={String(form[key as keyof typeof form])}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Descripción</label>
            <textarea
              rows={2}
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={save} disabled={loading || !form.nombre || !form.proveedor_id}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-5 py-2 rounded-xl text-sm disabled:opacity-50">
            {loading ? '...' : editing ? 'Guardar' : 'Crear'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(empty) }}
              className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Filtro + tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <select
            value={provFiltro}
            onChange={e => setProvFiltro(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">Todos los proveedores</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <span className="ml-3 text-sm text-gray-400">{filtered.length} productos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nombre', 'Proveedor', 'Categoría', 'Precio', 'Orden', 'Activo', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{(p as any).proveedor?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.categoria ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.precio_orientativo ? `${p.precio_orientativo} €` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.orden}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full ${p.disponible ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(p)} className="text-xs text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => remove(p.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Sin productos</div>
          )}
        </div>
      </div>
    </div>
  )
}
