export interface Proveedor {
  id: string
  nombre: string
  descripcion: string | null
  logo_url: string | null
  web_url: string | null
  orden: number
  activo: boolean
  created_at: string
}

export interface Producto {
  id: string
  proveedor_id: string
  nombre: string
  descripcion: string | null
  imagen_url: string | null
  categoria: string | null
  precio_orientativo: number | null
  unidad_venta: string | null
  disponible: boolean
  orden: number
  created_at: string
  proveedor?: Proveedor
}

export interface SolicitudInfo {
  id: string
  producto_id: string | null
  proveedor_id: string | null
  nombre: string
  email: string
  telefono: string | null
  empresa: string | null
  isla: string | null
  cargo: string | null
  mensaje: string | null
  ip_origen: string | null
  created_at: string
  producto?: Producto
  proveedor?: Proveedor
}

export interface SeccionPildora {
  id: string
  nombre: string
  descripcion: string | null
  icono: string | null
  orden: number
  activo: boolean
  created_at: string
  pildoras?: Pildora[]
}

export interface Pildora {
  id: string
  seccion_id: string
  titulo: string
  contenido: string | null
  imagen_url: string | null
  video_url: string | null
  orden: number
  activo: boolean
  created_at: string
}
