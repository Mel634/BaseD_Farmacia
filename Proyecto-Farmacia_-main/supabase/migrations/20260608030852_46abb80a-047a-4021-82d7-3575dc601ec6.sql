
-- ============================================================
-- FASE 1: Sucursales + roles + funciones de negocio
-- ============================================================

-- 1) Tabla sucursales
CREATE TABLE IF NOT EXISTS public.sucursales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  ciudad text NOT NULL,
  provincia text NOT NULL,
  direccion text,
  telefono text,
  schema_db text NOT NULL,
  tipo text NOT NULL DEFAULT 'SUCURSAL',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sucursales TO authenticated;
GRANT ALL ON public.sucursales TO service_role;
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
CREATE POLICY suc_all ON public.sucursales FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2) Roles adicionales
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cajero';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente_final';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) sucursal_id en tablas operativas
ALTER TABLE public.clientes      ADD COLUMN IF NOT EXISTS sucursal_id uuid;
ALTER TABLE public.empleados     ADD COLUMN IF NOT EXISTS sucursal_id uuid;
ALTER TABLE public.facturas      ADD COLUMN IF NOT EXISTS sucursal_id uuid;
ALTER TABLE public.ordenes_compra ADD COLUMN IF NOT EXISTS sucursal_id uuid;
ALTER TABLE public.ajustes_inventario ADD COLUMN IF NOT EXISTS sucursal_id uuid;

-- 4) Stock por sucursal
CREATE TABLE IF NOT EXISTS public.stock_sucursal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  sucursal_id uuid NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  stock_minimo integer NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (producto_id, sucursal_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_sucursal TO authenticated;
GRANT ALL ON public.stock_sucursal TO service_role;
ALTER TABLE public.stock_sucursal ENABLE ROW LEVEL SECURITY;
CREATE POLICY ss_all ON public.stock_sucursal FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5) Funciones de negocio
CREATE OR REPLACE FUNCTION public.proc_anular_factura(p_factura_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_estado text; v_num text; v_det record;
BEGIN
  SELECT estado, numero INTO v_estado, v_num FROM facturas WHERE id = p_factura_id;
  IF v_num IS NULL THEN RETURN 'ERROR: Factura no encontrada'; END IF;
  IF v_estado = 'ANULADA' THEN RETURN 'ERROR: Factura ya anulada'; END IF;
  FOR v_det IN SELECT producto_id, cantidad FROM fac_detalle WHERE factura_id = p_factura_id LOOP
    UPDATE productos SET stock = stock + v_det.cantidad WHERE id = v_det.producto_id;
  END LOOP;
  UPDATE facturas SET estado = 'ANULADA' WHERE id = p_factura_id;
  RETURN 'OK: Factura ' || v_num || ' anulada y stock restaurado';
END $$;

CREATE OR REPLACE FUNCTION public.proc_aprobar_orden(p_oc_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_estado text;
BEGIN
  SELECT estado INTO v_estado FROM ordenes_compra WHERE id = p_oc_id;
  IF v_estado IS NULL THEN RETURN 'ERROR: Orden no encontrada'; END IF;
  IF v_estado <> 'PENDIENTE' THEN RETURN 'ERROR: Solo se aprueban PENDIENTES'; END IF;
  UPDATE ordenes_compra SET estado = 'APROBADA' WHERE id = p_oc_id;
  RETURN 'OK: Orden aprobada';
END $$;

CREATE OR REPLACE FUNCTION public.proc_recibir_orden(p_oc_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_estado text; v_d record;
BEGIN
  SELECT estado INTO v_estado FROM ordenes_compra WHERE id = p_oc_id;
  IF v_estado IS NULL THEN RETURN 'ERROR: Orden no encontrada'; END IF;
  IF v_estado <> 'APROBADA' THEN RETURN 'ERROR: La orden debe estar APROBADA'; END IF;
  FOR v_d IN SELECT producto_id, cantidad FROM oc_detalle WHERE oc_id = p_oc_id LOOP
    UPDATE productos SET stock = stock + v_d.cantidad WHERE id = v_d.producto_id;
  END LOOP;
  UPDATE ordenes_compra SET estado = 'RECIBIDA' WHERE id = p_oc_id;
  RETURN 'OK: Orden recibida y stock actualizado';
END $$;

-- 6) Seeds de sucursales
INSERT INTO public.sucursales (codigo, nombre, ciudad, provincia, direccion, telefono, schema_db, tipo) VALUES
  ('QUITO', 'FarmaSystem Quito (Matriz)', 'Quito', 'Pichincha', 'Av. Amazonas N34-451', '+593 2 222 3344', 'sucursal_quito', 'MATRIZ'),
  ('GYE',   'FarmaSystem Guayaquil',      'Guayaquil', 'Guayas', 'Av. 9 de Octubre 1234', '+593 4 222 5566', 'sucursal_guayaquil', 'SUCURSAL'),
  ('CUE',   'FarmaSystem Cuenca',         'Cuenca', 'Azuay', 'Calle Larga 8-32', '+593 7 282 7788', 'sucursal_cuenca', 'SUCURSAL'),
  ('AMB',   'FarmaSystem Ambato',         'Ambato', 'Tungurahua', 'Av. Cevallos 5-10', '+593 3 282 9900', 'sucursal_ambato', 'SUCURSAL'),
  ('PTV',   'FarmaSystem Portoviejo',     'Portoviejo', 'Manabí', 'Av. Manabí 320', '+593 5 263 1122', 'sucursal_portoviejo', 'SUCURSAL'),
  ('BODEGA','Bodega Central',             'Quito', 'Pichincha', 'Vía a Calderón Km 5', '+593 2 280 0000', 'bodega_central', 'BODEGA')
ON CONFLICT (codigo) DO NOTHING;
