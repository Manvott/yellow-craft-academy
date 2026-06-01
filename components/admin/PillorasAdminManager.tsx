'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SeccionPildora, Pildora } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface Props { secciones: SeccionPildora[] }

const emptySeccion = { nombre: '', descripcion: '', icono: '', orden: 0, activo: true }
const emptyPildora = { seccion_id: '', titulo: '', contenido: '', imagen_url: '', video_url: '', orden: 0, activo: true }

export default function PillorasAdminManager({ secciones }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'secciones' | 'pildoras'>('secciones')
  const [secForm, setSecForm] = useState<typeof emptySeccion>(emptySeccion)
  const [pilForm, setPilForm] = useState<typeof emptyPildora>(emptyPildora)
  const [editingSec, setEditingSec] = useState<string | null>(null)
  const [editingPil, setEditingPil] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function saveSeccion() {
    setLoading(true)
    const supabase = createClient()
    if (editingSec) {
      await supabase.from('secciones_pildoras').update(secForm).eq('id', editingSec)
    } else {
      await supabase.from('secciones_pildoras').insert(secForm)
    }
    setSecForm(emptySeccion); setEditingSec(null); setLoading(false); router.refresh()
  }

  async function savePildora() {
    setLoading(true)
    const supabase = createClient()
    if (editingPil) {
      await supabase.from('pildoras').update(pilForm).eq('id', editingPil)
    } else {
      await supabase.from('pildoras').insert(pilForm)
    }
    setPilForm(emptyPildora); setEditingPil(null); setLoading(false); router.refresh()
  }

  async function removeSec(id: string) {
    if (!confirm('¿Eliminar sección y todas sus píldoras?')) return
    const supabase = createClient()
    await supabase.from('secciones_pildoras').delete().eq('id', id)
    router.refresh()
  }

  async function removePil(id: string) {
    if (!confirm('¿Eliminar píldora?')) return
    const supabase = createClient()
    await supabase.from('pildoras').delete().eq('id', id)
    router.refresh()
  }

  const allPildoras = secciones.flatMap(s => (s.pildoras ?? []).map(p => ({ ...p, seccion: s.nombre })))

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {(['secciones', 'pildoras'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-yellow-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === 'secciones' ? 'Secciones' : 'Píldoras'}
          </button>
        ))}
      </div>

      {tab === 'secciones' ? (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">{editingSec ? 'Editar sección' : 'Nueva sección'}</h2>
            <div className="grid grid-cols-2 gap-4">
              {[['Nombre *', 'nombre'], ['Icono (emoji)', 'icono'], ['Orden', 'orden']].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
                  <input
                    type={key === 'orden' ? 'number' : 'text'}
                    value={String(secForm[key as keyof typeof secForm])}
                    onChange={e => setSecForm(f => ({ ...f, [key]: key === 'orden' ? Number(e.target.value) : e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Descripción</label>
                <input
                  value={secForm.descripcion}
                  onChange={e => setSecForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveSeccion} disabled={loading || !secForm.nombre}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-5 py-2 rounded-xl text-sm disabled:opacity-50">
                {loading ? '...' : editingSec ? 'Guardar' : 'Crear'}
              </button>
              {editingSec && (
                <button onClick={() => { setEditingSec(null); setSecForm(emptySeccion) }}
                  className="px-5 py-2 rounded-xl text-sm border border-gray-200">Cancelar</button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Sección', 'Icono', 'Píldoras', 'Orden', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {secciones.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.nombre}</td>
                    <td className="px-4 py-3 text-xl">{s.icono ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.pildoras?.length ?? 0}</td>
                    <td className="px-4 py-3 text-gray-500">{s.orden}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingSec(s.id); setSecForm({ nombre: s.nombre, descripcion: s.descripcion ?? '', icono: s.icono ?? '', orden: s.orden, activo: s.activo }) }}
                          className="text-xs text-blue-600 hover:underline">Editar</button>
                        <button onClick={() => removeSec(s.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {secciones.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Sin secciones</div>}
          </div>
        </>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">{editingPil ? 'Editar píldora' : 'Nueva píldora'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Sección *</label>
                <select
                  value={pilForm.seccion_id}
                  onChange={e => setPilForm(f => ({ ...f, seccion_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {secciones.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              {[['Título *', 'titulo'], ['Imagen URL', 'imagen_url'], ['Video URL', 'video_url'], ['Orden', 'orden']].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
                  <input
                    type={key === 'orden' ? 'number' : 'text'}
                    value={String(pilForm[key as keyof typeof pilForm])}
                    onChange={e => setPilForm(f => ({ ...f, [key]: key === 'orden' ? Number(e.target.value) : e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Contenido</label>
                <textarea rows={4} value={pilForm.contenido}
                  onChange={e => setPilForm(f => ({ ...f, contenido: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={savePildora} disabled={loading || !pilForm.titulo || !pilForm.seccion_id}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-5 py-2 rounded-xl text-sm disabled:opacity-50">
                {loading ? '...' : editingPil ? 'Guardar' : 'Crear'}
              </button>
              {editingPil && (
                <button onClick={() => { setEditingPil(null); setPilForm(emptyPildora) }}
                  className="px-5 py-2 rounded-xl text-sm border border-gray-200">Cancelar</button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Título', 'Sección', 'Video', 'Orden', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allPildoras.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.titulo}</td>
                    <td className="px-4 py-3 text-gray-500">{p.seccion}</td>
                    <td className="px-4 py-3 text-gray-500">{p.video_url ? '✓' : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.orden}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setEditingPil(p.id)
                          setPilForm({ seccion_id: p.seccion_id, titulo: p.titulo, contenido: p.contenido ?? '', imagen_url: p.imagen_url ?? '', video_url: p.video_url ?? '', orden: p.orden, activo: p.activo })
                        }} className="text-xs text-blue-600 hover:underline">Editar</button>
                        <button onClick={() => removePil(p.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allPildoras.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Sin píldoras</div>}
          </div>
        </>
      )}
    </div>
  )
}
