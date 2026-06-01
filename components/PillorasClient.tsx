'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { SeccionPildora, Pildora } from '@/lib/types'

interface Props {
  secciones: SeccionPildora[]
}

function PildoraCard({ pildora }: { pildora: Pildora }) {
  const t = useTranslations('pildoras')
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {pildora.imagen_url && (
        <img src={pildora.imagen_url} alt={pildora.titulo} className="w-full h-40 object-cover" />
      )}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base mb-2">{pildora.titulo}</h3>
        {pildora.contenido && (
          <>
            <p className={`text-gray-600 text-sm leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
              {pildora.contenido}
            </p>
            {pildora.contenido.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-yellow-600 font-semibold text-xs hover:underline"
              >
                {expanded ? t('read_less') : t('read_more')}
              </button>
            )}
          </>
        )}
        {pildora.video_url && (
          <a
            href={pildora.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gray-900 bg-yellow-400 px-3 py-1.5 rounded-full hover:bg-yellow-500 transition-colors"
          >
            ▶ Ver video
          </a>
        )}
      </div>
    </div>
  )
}

export default function PillorasClient({ secciones }: Props) {
  const t = useTranslations('pildoras')
  const [activeSeccion, setActiveSeccion] = useState<string | null>(
    secciones[0]?.id ?? null
  )

  if (secciones.length === 0) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-5xl mb-4">📚</p>
        <p className="font-medium">{t('no_content')}</p>
      </div>
    )
  }

  const seccionActiva = secciones.find(s => s.id === activeSeccion)

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar secciones */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {secciones.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSeccion(s.id)}
              className={`w-full text-left px-5 py-4 border-b border-gray-50 last:border-0 transition-colors ${
                activeSeccion === s.id
                  ? 'bg-yellow-400 font-bold text-gray-900'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {s.icono && <span className="text-xl">{s.icono}</span>}
                <div>
                  <p className="font-semibold text-sm">{s.nombre}</p>
                  {s.descripcion && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{s.descripcion}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex-1">
        {seccionActiva ? (
          <>
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              {seccionActiva.icono && <span className="mr-2">{seccionActiva.icono}</span>}
              {seccionActiva.nombre}
            </h2>
            {seccionActiva.pildoras && seccionActiva.pildoras.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {seccionActiva.pildoras
                  .filter(p => p.activo)
                  .sort((a, b) => a.orden - b.orden)
                  .map(p => (
                    <PildoraCard key={p.id} pildora={p} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <p>{t('no_content')}</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
