export interface Plantilla {
  id: string
  titulo: string
  contenido: string
  activo: boolean
  orden: number
}

export interface RegistroWA {
  id: string
  nombre: string
  empresa: string | null
  isla: string | null
  telefono: string | null
  email: string
  bloques: string[] | null
  confirmado_llamada: boolean
}

export interface Enviado {
  plantilla_id: string
  registro_id: string
}
