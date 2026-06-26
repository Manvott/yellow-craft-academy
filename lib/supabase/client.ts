import { createBrowserClient } from '@supabase/ssr'

const MSG = 'Modo prueba: este usuario es de solo lectura. No se guardan los cambios.'

// Stub encadenable que imita el query builder pero nunca toca la BD
function readOnlyStub(): any {
  const result = { data: null, error: { message: MSG } }
  const handler: ProxyHandler<any> = {
    get(_t, prop) {
      if (prop === 'then') return (resolve: any) => Promise.resolve(result).then(resolve)
      if (prop === 'catch' || prop === 'finally') return () => proxy
      return () => proxy
    },
    apply() { return proxy },
  }
  const proxy: any = new Proxy(function () {}, handler)
  return proxy
}

function esSoloLectura(): boolean {
  return typeof window !== 'undefined' && (window as any).__YCA_READONLY === true
}

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (esSoloLectura()) {
    const origFrom = client.from.bind(client)
    ;(client as any).from = (table: string) => {
      const builder: any = origFrom(table)
      for (const metodo of ['insert', 'update', 'delete', 'upsert'] as const) {
        builder[metodo] = () => {
          try { alert(MSG) } catch {}
          return readOnlyStub()
        }
      }
      return builder
    }
  }

  return client
}
