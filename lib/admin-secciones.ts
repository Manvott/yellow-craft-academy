export const SECCIONES_ADMIN = [
  { key: 'registros',      label: 'Asistentes',     icono: '👥', soloSuperadmin: false },
  { key: 'acreditacion',   label: 'Acreditación',   icono: '🎫', soloSuperadmin: false },
  { key: 'fichas',      label: 'Fichas Producto',icono: '📋', soloSuperadmin: false },
  { key: 'solicitudes', label: 'Solicitudes',    icono: '📩', soloSuperadmin: false },
  { key: 'proveedores', label: 'Marcas',         icono: '🏷', soloSuperadmin: false },
  { key: 'pildoras',    label: 'Pildoras',       icono: '💊', soloSuperadmin: false },
  { key: 'informes',    label: 'Informes',       icono: '📊', soloSuperadmin: false },
  { key: 'ajustes',     label: 'Ajustes',        icono: '⚙', soloSuperadmin: true  },
] as const

export type SeccionKey = typeof SECCIONES_ADMIN[number]['key']
