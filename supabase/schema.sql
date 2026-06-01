-- Yellow Craft Academy — Schema completo
-- Ejecutar en Supabase SQL Editor

-- Proveedores
CREATE TABLE proveedores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  descripcion text,
  logo_url    text,
  web_url     text,
  orden       int DEFAULT 0,
  activo      bool DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Productos
CREATE TABLE productos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id        uuid REFERENCES proveedores(id) ON DELETE CASCADE,
  nombre              text NOT NULL,
  descripcion         text,
  imagen_url          text,
  categoria           text,
  precio_orientativo  numeric(10,2),
  unidad_venta        text,
  disponible          bool DEFAULT true,
  orden               int DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

-- Solicitudes de información
CREATE TABLE solicitudes_info (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id  uuid REFERENCES productos(id) ON DELETE SET NULL,
  proveedor_id uuid REFERENCES proveedores(id) ON DELETE SET NULL,
  nombre       text NOT NULL,
  email        text NOT NULL,
  telefono     text,
  empresa      text,
  isla         text,
  cargo        text,
  mensaje      text,
  ip_origen    text,
  created_at   timestamptz DEFAULT now()
);

-- Secciones de píldoras
CREATE TABLE secciones_pildoras (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  descripcion text,
  icono       text,
  orden       int DEFAULT 0,
  activo      bool DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Píldoras de conocimiento
CREATE TABLE pildoras (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seccion_id  uuid REFERENCES secciones_pildoras(id) ON DELETE CASCADE,
  titulo      text NOT NULL,
  contenido   text,
  imagen_url  text,
  video_url   text,
  orden       int DEFAULT 0,
  activo      bool DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Registros de asistentes (desde la landing)
CREATE TABLE registros (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  empresa     text,
  perfil      text,
  email       text NOT NULL,
  telefono    text,
  bloques     text[],           -- array de nombres de bloques seleccionados
  ip_origen   text,
  created_at  timestamptz DEFAULT now()
);

-- ===== RLS =====

ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"  ON proveedores FOR SELECT USING (activo = true);
CREATE POLICY "admin_all"    ON proveedores FOR ALL   USING (auth.role() = 'authenticated');

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"  ON productos FOR SELECT USING (disponible = true);
CREATE POLICY "admin_all"    ON productos FOR ALL   USING (auth.role() = 'authenticated');

ALTER TABLE solicitudes_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert" ON solicitudes_info FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read"    ON solicitudes_info FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE secciones_pildoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"  ON secciones_pildoras FOR SELECT USING (activo = true);
CREATE POLICY "admin_all"    ON secciones_pildoras FOR ALL   USING (auth.role() = 'authenticated');

ALTER TABLE pildoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"  ON pildoras FOR SELECT USING (activo = true);
CREATE POLICY "admin_all"    ON pildoras FOR ALL   USING (auth.role() = 'authenticated');

ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert" ON registros FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read"    ON registros FOR SELECT USING (auth.role() = 'authenticated');

-- ===== Storage bucket para imágenes =====
-- Ejecutar desde Supabase Dashboard > Storage > New bucket
-- Nombre: product-images
-- Public: true
