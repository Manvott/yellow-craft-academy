import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://fecuruxojkwoqhlhdtii.supabase.co', process.env.SUPA_KEY)

const nombres = ['maria karla cepero', 'camilo ramos', 'roman jesus mendez']
for (const n of nombres) {
  const { data } = await supabase.from('registros').select('id,nombre,empresa,email,telefono').ilike('nombre', `%${n}%`)
  console.log('REGISTRO:', JSON.stringify(data))
}

const claves = ['cepero', 'camilo ramos', 'mendez', 'dreamplace', 'volcanic', 'cact']
for (const k of claves) {
  const { data } = await supabase.from('clientes_ava').select('cod_cliente,nombre,nombre_comercial,email,telefono,movil').or(`nombre.ilike.%${k}%,nombre_comercial.ilike.%${k}%`)
  if (data?.length) console.log(`CLIENTE_AVA [${k}]:`, JSON.stringify(data))
}
