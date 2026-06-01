import { z } from 'zod'

export const solicitudSchema = z.object({
  producto_id: z.string().uuid(),
  proveedor_id: z.string().uuid(),
  nombre: z.string().min(2, 'Nombre requerido').max(100),
  email: z.string().email('Email inválido'),
  telefono: z.string().max(20).optional().nullable(),
  empresa: z.string().max(100).optional().nullable(),
  isla: z.string().max(50).optional().nullable(),
  cargo: z.string().max(100).optional().nullable(),
  mensaje: z.string().max(500).optional().nullable(),
})

export type SolicitudInput = z.infer<typeof solicitudSchema>
