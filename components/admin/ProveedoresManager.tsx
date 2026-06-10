'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Proveedor } from '@/lib/types'
import { useRouter } from 'next/navigation'
import FileUploadField from './FileUploadField'

interface Props { proveedores: Proveedor[] }

const empty = { nombre: '', descripcion: '', logo_url: '', web_url: '', orden: 0, activo: true, seccion: 'seleccion' as string }

export default function ProveedoresManager({ proveedores }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<typeof empty>(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    const supabase = createClient()
    if (editing) {
      await supabase.from('proveedores').update(form).eq('id', editing)
    } else {
      await supabase.from('proveedores').insert(form)
    }
    setForm(empty)
    setEditing(null)
    setLoading(false)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar proveedor?')) return
    const supabase = createClient()
    await supabase.from('proveedores').delete().eq('id', id)
    router.refresh()
  }

  function startEdit(p: Proveedor) {
    setEditing(p.id)
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', logo_url: p.logo_url ?? '', web_url: p.web_url ?? '', orden: p.orden, activo: p.activo, seccion: p.seccion ?? 'seleccion' })
  }

  const field = (label: string, key: keyof typeof empty, type = 'text') => (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
      <input
        type={type}
        value={String(form[key])}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
        <div className="grid grid-cols-2 gap-4">
          {field('Nombre *', 'nombre')}
          {field('Web', 'web_url')}
          <div className="col-span-2">
            <FileUploadField
              label="Logo de la marca"
              bucket="logos-marcas"
              accept="image/*"
              icono="🏷️"
              urlActual={form.logo_url}
              onUploaded={url => setForm(f => ({ ...f, logo_url: url }))}
              hint="PNG, SVG, JPG. Se sube a Supabase Storage."
            />
          </div>
          {field('Orden', 'orden', 'number')}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Sección en la landing</label>
            <select
              value={form.seccion}
              onChange={e => setForm(f => ({ ...f, seccion: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="seleccion">Descubre la selección de AVA</option>
              <option value="rincon_soberano">Rincón Soberano de AVA</option>
              <option value="colaboradores">Colaboradores</option>
            </select>
          </div>
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
          <button onClick={save} disabled={loading || !form.nombre}
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

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Nombre', 'Sección', 'Web', 'Orden', 'Activo', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {proveedores.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {p.seccion === 'rincon_soberano' ? 'Rincón Soberano' : p.seccion === 'colaboradores' ? 'Colaboradores' : 'Selección AVA'}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.web_url ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{p.orden}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block w-2 h-2 rounded-full ${p.activo ? 'bg-green-400' : 'bg-gray-300'}`} />
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
        {proveedores.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">Sin proveedores</div>
        )}
      </div>
    </div>
  )
}
