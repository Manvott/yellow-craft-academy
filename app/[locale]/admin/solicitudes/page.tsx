import { createClient } from '@/lib/supabase/server'
import type { SolicitudInfo } from '@/lib/types'

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: solicitudes } = await supabase
    .from('solicitudes_info')
    .select('*, producto:productos(nombre), proveedor:proveedores(nombre)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Solicitudes recibidas</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Fecha', 'Nombre', 'Email', 'Empresa', 'Isla', 'Cargo', 'Producto', 'Proveedor'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(solicitudes as SolicitudInfo[] ?? []).map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(s.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3 text-gray-600">{s.empresa ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{s.isla ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.cargo ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{(s as any).producto?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{(s as any).proveedor?.nombre ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!solicitudes?.length && (
            <div className="text-center py-12 text-gray-400">
              <p>Sin solicitudes aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
