
-- ============================================================
-- FASE 3+4: Esquemas distribuidos + bodega + nube
-- ============================================================

-- ---------- Esquemas ----------
CREATE SCHEMA IF NOT EXISTS sucursal_quito;
CREATE SCHEMA IF NOT EXISTS sucursal_guayaquil;
CREATE SCHEMA IF NOT EXISTS sucursal_cuenca;
CREATE SCHEMA IF NOT EXISTS sucursal_ambato;
CREATE SCHEMA IF NOT EXISTS sucursal_portoviejo;
CREATE SCHEMA IF NOT EXISTS bodega_central;
CREATE SCHEMA IF NOT EXISTS cloud_ecommerce;

-- Exponer esquemas a PostgREST (para client read si se quisiera)
GRANT USAGE ON SCHEMA sucursal_quito, sucursal_guayaquil, sucursal_cuenca,
  sucursal_ambato, sucursal_portoviejo, bodega_central, cloud_ecommerce
  TO authenticated, service_role;

-- ---------- Plantilla por sucursal vía DO block ----------
DO $$
DECLARE
  s text;
  schemas text[] := ARRAY['sucursal_quito','sucursal_guayaquil','sucursal_cuenca','sucursal_ambato','sucursal_portoviejo'];
BEGIN
  FOREACH s IN ARRAY schemas LOOP
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.ven_clientes (
        id_cliente serial PRIMARY KEY,
        cli_razonsocial text NOT NULL,
        cli_ruc text NOT NULL UNIQUE,
        cli_telefono text,
        cli_email text,
        cli_direccion text,
        cli_provincia text,
        estado_cli char(3) NOT NULL DEFAULT ''ACT'',
        cli_fechacreacion timestamptz DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS %I.ven_facturas (
        id_factura serial PRIMARY KEY,
        id_cliente integer NOT NULL REFERENCES %I.ven_clientes(id_cliente),
        fac_numero text NOT NULL UNIQUE,
        fac_fecha date NOT NULL DEFAULT current_date,
        fac_subtotal numeric(12,2) NOT NULL DEFAULT 0,
        fac_iva numeric(12,2) NOT NULL DEFAULT 0,
        fac_total numeric(12,2) NOT NULL DEFAULT 0,
        estado_fac char(3) NOT NULL DEFAULT ''EMI'',
        fac_usuario text
      );
      CREATE TABLE IF NOT EXISTS %I.ven_facturas_det (
        id_det serial PRIMARY KEY,
        id_factura integer NOT NULL REFERENCES %I.ven_facturas(id_factura) ON DELETE CASCADE,
        producto text NOT NULL,
        cantidad integer NOT NULL,
        precio numeric(10,2) NOT NULL,
        subtotal numeric(12,2) NOT NULL
      );
      GRANT USAGE ON SCHEMA %I TO authenticated, service_role;
      GRANT ALL ON ALL TABLES IN SCHEMA %I TO service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO service_role;
      GRANT SELECT ON ALL TABLES IN SCHEMA %I TO authenticated;
    ', s, s, s, s, s, s, s, s, s);
  END LOOP;
END $$;

-- ---------- Bodega Central (distribuida vertical) ----------
CREATE TABLE IF NOT EXISTS bodega_central.inv_productos (
  id_producto serial PRIMARY KEY,
  prd_codigo text NOT NULL UNIQUE,
  prd_nombre text NOT NULL,
  prd_categoria text,
  prd_unidad text DEFAULT 'UND',
  prd_stock integer NOT NULL DEFAULT 0,
  prd_stockmin integer NOT NULL DEFAULT 10,
  prd_costo numeric(10,2) NOT NULL DEFAULT 0,
  estado_prd char(3) NOT NULL DEFAULT 'ACT'
);
CREATE TABLE IF NOT EXISTS bodega_central.inv_movimientos (
  id_mov serial PRIMARY KEY,
  id_producto integer NOT NULL REFERENCES bodega_central.inv_productos(id_producto),
  mov_fecha timestamptz NOT NULL DEFAULT now(),
  mov_tipo char(3) NOT NULL,  -- ING/EGR/AJU
  mov_cantidad integer NOT NULL,
  mov_destino text,
  mov_motivo text,
  mov_usuario text
);
GRANT ALL ON ALL TABLES IN SCHEMA bodega_central TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA bodega_central TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA bodega_central TO authenticated;

-- ---------- Cloud eCommerce (nube) ----------
CREATE TABLE IF NOT EXISTS cloud_ecommerce.cl_productos (
  id_producto serial PRIMARY KEY,
  prd_codigo text NOT NULL UNIQUE,
  prd_nombre text NOT NULL,
  prd_descripcion text,
  prd_imagen text,
  prd_precio numeric(10,2) NOT NULL,
  prd_stock integer NOT NULL DEFAULT 0,
  prd_categoria text,
  publicado boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS cloud_ecommerce.cl_clientes (
  id_cliente serial PRIMARY KEY,
  cli_email text NOT NULL UNIQUE,
  cli_nombre text NOT NULL,
  cli_telefono text,
  cli_direccion text,
  cli_ciudad text,
  cli_fechareg timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cloud_ecommerce.cl_pedidos (
  id_pedido serial PRIMARY KEY,
  id_cliente integer NOT NULL REFERENCES cloud_ecommerce.cl_clientes(id_cliente),
  ped_numero text NOT NULL UNIQUE,
  ped_fecha timestamptz NOT NULL DEFAULT now(),
  ped_total numeric(12,2) NOT NULL DEFAULT 0,
  ped_estado char(3) NOT NULL DEFAULT 'PEN', -- PEN/PAG/ENV/ENT/CAN
  ped_metpago text DEFAULT 'TARJETA'
);
CREATE TABLE IF NOT EXISTS cloud_ecommerce.cl_pedidos_det (
  id_det serial PRIMARY KEY,
  id_pedido integer NOT NULL REFERENCES cloud_ecommerce.cl_pedidos(id_pedido) ON DELETE CASCADE,
  id_producto integer NOT NULL REFERENCES cloud_ecommerce.cl_productos(id_producto),
  cantidad integer NOT NULL,
  precio numeric(10,2) NOT NULL,
  subtotal numeric(12,2) NOT NULL
);
GRANT ALL ON ALL TABLES IN SCHEMA cloud_ecommerce TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA cloud_ecommerce TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA cloud_ecommerce TO authenticated;

-- ============================================================
-- SEEDS
-- ============================================================

-- Clientes y facturas para cada sucursal (variando volumen)
INSERT INTO sucursal_quito.ven_clientes (cli_razonsocial, cli_ruc, cli_telefono, cli_email, cli_provincia) VALUES
 ('Distribuidora Andina S.A.','1791234567001','022223344','ventas@andina.ec','Pichincha'),
 ('Farmacéutica Quito Cía. Ltda.','1798765432001','023334455','info@fquito.ec','Pichincha'),
 ('Clínica Metropolitana','1790012345001','022345678','compras@cmetro.ec','Pichincha'),
 ('Hospital de los Valles','1791122334001','022999000','farmacia@hdlv.ec','Pichincha'),
 ('Cliente Particular Quito','1700000001','099000111','particular@quito.ec','Pichincha')
ON CONFLICT DO NOTHING;

INSERT INTO sucursal_guayaquil.ven_clientes (cli_razonsocial, cli_ruc, cli_telefono, cli_email, cli_provincia) VALUES
 ('Botica del Pacífico','0991234567001','042223344','contacto@bpacifico.ec','Guayas'),
 ('Hospital Luis Vernaza','0990012345001','042223456','farmacia@vernaza.ec','Guayas'),
 ('FarmaPort S.A.','0998765432001','042334455','info@farmaport.ec','Guayas'),
 ('Cliente Particular GYE','0700000001','099111222','particular@gye.ec','Guayas')
ON CONFLICT DO NOTHING;

INSERT INTO sucursal_cuenca.ven_clientes (cli_razonsocial, cli_ruc, cli_telefono, cli_email, cli_provincia) VALUES
 ('Farmacia del Tomebamba','0191234567001','072223344','ventas@tomebamba.ec','Azuay'),
 ('Hospital Santa Inés','0190012345001','072334455','farmacia@santaines.ec','Azuay'),
 ('Cliente Particular Cuenca','0100000001','099222333','particular@cue.ec','Azuay')
ON CONFLICT DO NOTHING;

INSERT INTO sucursal_ambato.ven_clientes (cli_razonsocial, cli_ruc, cli_telefono, cli_email, cli_provincia) VALUES
 ('Botica Central Ambato','1891234567001','032223344','info@bambato.ec','Tungurahua'),
 ('Hospital Provincial Docente','1890012345001','032334455','compras@hpd.ec','Tungurahua'),
 ('Cliente Particular Ambato','1800000001','099333444','particular@amb.ec','Tungurahua')
ON CONFLICT DO NOTHING;

INSERT INTO sucursal_portoviejo.ven_clientes (cli_razonsocial, cli_ruc, cli_telefono, cli_email, cli_provincia) VALUES
 ('Farmacia Manabí','1391234567001','052223344','ventas@manabi.ec','Manabí'),
 ('Clínica Portoviejo','1390012345001','052334455','farmacia@cporto.ec','Manabí'),
 ('Cliente Particular Portoviejo','1300000001','099444555','particular@ptv.ec','Manabí')
ON CONFLICT DO NOTHING;

-- Facturas históricas generadas con series
DO $$
DECLARE
  s text;
  schemas text[] := ARRAY['sucursal_quito','sucursal_guayaquil','sucursal_cuenca','sucursal_ambato','sucursal_portoviejo'];
  cant int[] := ARRAY[80, 60, 45, 35, 30];
  i int; n int; sub numeric; iva numeric;
BEGIN
  FOR i IN 1..array_length(schemas,1) LOOP
    s := schemas[i];
    FOR n IN 1..cant[i] LOOP
      sub := round((50 + random()*450)::numeric, 2);
      iva := round(sub * 0.15, 2);
      EXECUTE format('
        INSERT INTO %I.ven_facturas (id_cliente, fac_numero, fac_fecha, fac_subtotal, fac_iva, fac_total, estado_fac, fac_usuario)
        SELECT (SELECT id_cliente FROM %I.ven_clientes ORDER BY random() LIMIT 1),
               ''F-%s-'' || lpad($1::text,5,''0''),
               current_date - (random()*180)::int,
               $2, $3, $2+$3,
               CASE WHEN random() < 0.92 THEN ''EMI'' ELSE ''ANU'' END,
               ''cajero@'' || $4 || ''.ec''
        ON CONFLICT DO NOTHING',
        s, s, upper(substr(s, 10, 3)))
      USING n, sub, iva, substr(s, 10);
    END LOOP;
  END LOOP;
END $$;

-- Productos en bodega central
INSERT INTO bodega_central.inv_productos (prd_codigo, prd_nombre, prd_categoria, prd_stock, prd_stockmin, prd_costo) VALUES
 ('MED-001','Paracetamol 500mg x100','Analgésicos',  1240, 100, 3.20),
 ('MED-002','Ibuprofeno 400mg x50',  'Analgésicos',   860,  80, 4.50),
 ('MED-003','Amoxicilina 500mg x21', 'Antibióticos',  540,  60, 6.75),
 ('MED-004','Loratadina 10mg x30',   'Antialérgicos', 420,  50, 5.10),
 ('MED-005','Omeprazol 20mg x28',    'Gastro',        680,  60, 4.20),
 ('MED-006','Vitamina C 1g x30',     'Vitaminas',     920, 100, 7.80),
 ('MED-007','Insulina NPH 100UI',    'Diabetes',      210,  30, 18.50),
 ('MED-008','Mascarillas KN95 x50',  'Insumos',       3200,200, 0.55),
 ('MED-009','Alcohol 70% 1L',        'Insumos',       1450,150, 2.30),
 ('MED-010','Suero Fisiológico 500ml','Insumos',       780,  80, 1.85)
ON CONFLICT (prd_codigo) DO NOTHING;

-- Movimientos de inventario
INSERT INTO bodega_central.inv_movimientos (id_producto, mov_fecha, mov_tipo, mov_cantidad, mov_destino, mov_motivo, mov_usuario)
SELECT (random()*9+1)::int,
       now() - (random()*60 || ' days')::interval,
       (ARRAY['ING','EGR','EGR','EGR','AJU'])[(random()*4+1)::int],
       (random()*100+10)::int,
       (ARRAY['Quito','Guayaquil','Cuenca','Ambato','Portoviejo','BodegaPpal'])[(random()*5+1)::int],
       (ARRAY['Reposición','Despacho sucursal','Ajuste físico','Devolución','Caducidad'])[(random()*4+1)::int],
       'bodeguero@farmasystem.ec'
FROM generate_series(1, 120);

-- Catálogo cloud
INSERT INTO cloud_ecommerce.cl_productos (prd_codigo, prd_nombre, prd_descripcion, prd_precio, prd_stock, prd_categoria) VALUES
 ('CL-001','Paracetamol 500mg x20','Caja de 20 tabletas para alivio de dolor y fiebre.',  3.50,  200, 'Analgésicos'),
 ('CL-002','Ibuprofeno 400mg x10', 'Antiinflamatorio no esteroideo, caja de 10 tabletas.',  4.20,  180, 'Analgésicos'),
 ('CL-003','Vitamina C 1g x30',    'Suplemento vitamínico efervescente.',                   8.90,  140, 'Vitaminas'),
 ('CL-004','Loratadina 10mg x10',  'Antialérgico de acción prolongada.',                    5.50,  120, 'Antialérgicos'),
 ('CL-005','Mascarillas KN95 x10', 'Pack de 10 mascarillas de alta filtración.',            6.00,  500, 'Insumos'),
 ('CL-006','Alcohol Antiséptico 250ml','Frasco de 250ml al 70%.',                           2.10,  600, 'Insumos'),
 ('CL-007','Termómetro Digital',   'Termómetro digital de punta flexible.',                12.50,   80, 'Equipos'),
 ('CL-008','Tensiómetro de Brazo', 'Tensiómetro digital automático.',                      45.00,   40, 'Equipos')
ON CONFLICT (prd_codigo) DO NOTHING;

INSERT INTO cloud_ecommerce.cl_clientes (cli_email, cli_nombre, cli_telefono, cli_ciudad) VALUES
 ('maria.lopez@gmail.com','María López','0991234567','Quito'),
 ('jorge.salazar@gmail.com','Jorge Salazar','0992345678','Guayaquil'),
 ('andrea.cordova@gmail.com','Andrea Córdova','0993456789','Cuenca'),
 ('luis.naranjo@gmail.com','Luis Naranjo','0994567890','Ambato'),
 ('paola.zambrano@gmail.com','Paola Zambrano','0995678901','Portoviejo')
ON CONFLICT (cli_email) DO NOTHING;

DO $$
DECLARE n int; tot numeric;
BEGIN
  FOR n IN 1..40 LOOP
    tot := round((10 + random()*150)::numeric, 2);
    INSERT INTO cloud_ecommerce.cl_pedidos (id_cliente, ped_numero, ped_fecha, ped_total, ped_estado, ped_metpago)
    SELECT (SELECT id_cliente FROM cloud_ecommerce.cl_clientes ORDER BY random() LIMIT 1),
           'PED-' || lpad(n::text,5,'0'),
           now() - (random()*90 || ' days')::interval,
           tot,
           (ARRAY['PEN','PAG','PAG','ENV','ENT','ENT','CAN'])[(random()*6+1)::int],
           (ARRAY['TARJETA','TRANSFERENCIA','PAYPAL','EFECTIVO'])[(random()*3+1)::int]
    ON CONFLICT (ped_numero) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================
-- Función global de métricas por arquitectura (para /arq/comparativa)
-- ============================================================
CREATE OR REPLACE FUNCTION public.arq_resumen_global()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb := '{}'::jsonb;
DECLARE
  s text;
  schemas text[] := ARRAY['sucursal_quito','sucursal_guayaquil','sucursal_cuenca','sucursal_ambato','sucursal_portoviejo'];
  total_facturas int := 0;
  total_clientes int := 0;
  total_ventas numeric := 0;
  c int; v numeric; cl int;
BEGIN
  -- Centralizada (public)
  r := jsonb_set(r, '{centralizada}', jsonb_build_object(
    'productos', (SELECT count(*) FROM public.productos),
    'clientes',  (SELECT count(*) FROM public.clientes),
    'facturas',  (SELECT count(*) FROM public.facturas),
    'empleados', (SELECT count(*) FROM public.empleados),
    'ventas_total', COALESCE((SELECT sum(total) FROM public.facturas WHERE estado <> 'ANULADA'),0)
  ));

  -- Distribuida (suma sucursales)
  FOREACH s IN ARRAY schemas LOOP
    EXECUTE format('SELECT count(*), COALESCE(sum(fac_total),0) FROM %I.ven_facturas WHERE estado_fac = ''EMI''', s) INTO c, v;
    EXECUTE format('SELECT count(*) FROM %I.ven_clientes', s) INTO cl;
    total_facturas := total_facturas + c;
    total_ventas   := total_ventas + v;
    total_clientes := total_clientes + cl;
  END LOOP;
  r := jsonb_set(r, '{distribuida}', jsonb_build_object(
    'sucursales', array_length(schemas,1),
    'clientes',   total_clientes,
    'facturas',   total_facturas,
    'ventas_total', total_ventas
  ));

  -- Bodega (vertical)
  r := jsonb_set(r, '{bodega}', jsonb_build_object(
    'productos',   (SELECT count(*) FROM bodega_central.inv_productos),
    'stock_total', (SELECT COALESCE(sum(prd_stock),0) FROM bodega_central.inv_productos),
    'movimientos', (SELECT count(*) FROM bodega_central.inv_movimientos)
  ));

  -- Nube
  r := jsonb_set(r, '{nube}', jsonb_build_object(
    'productos', (SELECT count(*) FROM cloud_ecommerce.cl_productos),
    'clientes',  (SELECT count(*) FROM cloud_ecommerce.cl_clientes),
    'pedidos',   (SELECT count(*) FROM cloud_ecommerce.cl_pedidos),
    'ventas_total', COALESCE((SELECT sum(ped_total) FROM cloud_ecommerce.cl_pedidos WHERE ped_estado <> 'CAN'),0)
  ));

  RETURN r;
END $$;

GRANT EXECUTE ON FUNCTION public.arq_resumen_global() TO authenticated;
