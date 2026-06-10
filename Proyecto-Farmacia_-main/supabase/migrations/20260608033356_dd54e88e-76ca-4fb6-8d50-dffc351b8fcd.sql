
-- ============================================================
-- DROP esquemas previos para reconstruir limpio
-- ============================================================
DROP SCHEMA IF EXISTS sucursal_quito CASCADE;
DROP SCHEMA IF EXISTS sucursal_guayaquil CASCADE;
DROP SCHEMA IF EXISTS sucursal_cuenca CASCADE;
DROP SCHEMA IF EXISTS sucursal_ambato CASCADE;
DROP SCHEMA IF EXISTS sucursal_portoviejo CASCADE;
DROP SCHEMA IF EXISTS bodega_central CASCADE;
DROP SCHEMA IF EXISTS cloud_ecommerce CASCADE;
DROP SCHEMA IF EXISTS nosql_mongo CASCADE;

-- ============================================================
-- CENTRALIZADA (public)
-- ============================================================
INSERT INTO public.proveedores (ruc, razon_social, telefono, email, direccion)
SELECT * FROM (VALUES
  ('1790012345001','Pfizer Ecuador S.A.','022456789','ventas@pfizer.ec','Av. Amazonas N34-451, Quito'),
  ('0992345678001','Bayer S.A.','042345678','contacto@bayer.ec','Km 2.5 Vía Daule, Guayaquil'),
  ('1791234567001','GlaxoSmithKline Ecuador','022987654','info@gsk.ec','Av. República E7-61, Quito'),
  ('0991234567001','Roche Ecuador','042876543','servicio@roche.ec','Av. 9 de Octubre, Guayaquil'),
  ('1792345678001','Novartis Ecuador','022345012','ventas@novartis.ec','Av. Eloy Alfaro, Quito')
) AS v(ruc, razon_social, telefono, email, direccion)
WHERE NOT EXISTS (SELECT 1 FROM public.proveedores WHERE ruc = v.ruc);

INSERT INTO public.productos (codigo, nombre, categoria, precio_compra, precio_venta, stock, stock_minimo)
SELECT * FROM (VALUES
  ('MED001','Paracetamol 500mg x 20','Analgésicos',1.20,2.50,150,20),
  ('MED002','Ibuprofeno 400mg x 10','Analgésicos',2.00,4.00,120,15),
  ('MED003','Amoxicilina 500mg x 12','Antibióticos',5.50,9.80,80,10),
  ('MED004','Loratadina 10mg x 10','Antihistamínicos',3.20,6.50,90,10),
  ('MED005','Omeprazol 20mg x 14','Gástricos',4.50,8.90,70,10),
  ('MED006','Metformina 850mg x 30','Diabetes',6.00,12.00,60,8),
  ('MED007','Losartán 50mg x 30','Hipertensión',5.80,11.50,55,8),
  ('MED008','Atorvastatina 20mg x 30','Cardiovascular',7.20,14.50,45,8),
  ('MED009','Diclofenaco 50mg x 20','Antiinflamatorios',2.80,5.50,100,15),
  ('MED010','Salbutamol Inhalador','Respiratorios',8.50,16.90,40,5),
  ('MED011','Ranitidina 150mg x 20','Gástricos',3.00,6.00,75,10),
  ('MED012','Cetirizina 10mg x 20','Antihistamínicos',2.50,5.20,85,10),
  ('MED013','Aspirina 100mg x 30','Cardiovascular',1.80,3.80,140,20),
  ('MED014','Naproxeno 550mg x 10','Analgésicos',3.50,7.20,65,10),
  ('MED015','Vitamina C 1g x 20','Vitaminas',2.20,4.80,110,15),
  ('MED016','Complejo B x 30','Vitaminas',4.00,8.50,70,10),
  ('MED017','Insulina NPH','Diabetes',18.00,32.00,25,5),
  ('MED018','Enalapril 10mg x 30','Hipertensión',2.80,5.90,90,12),
  ('MED019','Azitromicina 500mg x 3','Antibióticos',6.50,12.80,50,8),
  ('MED020','Acetaminofén Pediátrico','Analgésicos',2.40,4.90,95,12)
) AS v(codigo, nombre, categoria, precio_compra, precio_venta, stock, stock_minimo)
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE codigo = v.codigo);

INSERT INTO public.clientes (cedula, nombre_completo, telefono, email, direccion)
SELECT * FROM (VALUES
  ('1712345678','María Fernanda López','0991234567','maria.lopez@gmail.com','Av. 6 de Diciembre, Quito'),
  ('0923456789','Carlos Andrés Mendoza','0987654321','carlos.mendoza@hotmail.com','Cdla. Kennedy, Guayaquil'),
  ('1709876543','Ana Cristina Vega','0998765432','ana.vega@yahoo.com','La Carolina, Quito'),
  ('0912345678','Luis Roberto Paredes','0976543210','luis.paredes@gmail.com','Urdesa, Guayaquil'),
  ('1798765432','Sofía Alejandra Cabrera','0965432109','sofia.cabrera@outlook.com','Cumbayá, Quito'),
  ('0934567890','Diego Fernando Salazar','0954321098','diego.salazar@gmail.com','Samborondón, Guayaquil'),
  ('1723456789','Patricia Elena Vásquez','0943210987','patricia.vasquez@gmail.com','El Batán, Quito'),
  ('0945678901','Roberto Carlos Núñez','0932109876','roberto.nunez@hotmail.com','Centenario, Guayaquil'),
  ('1734567890','Gabriela María Torres','0921098765','gabriela.torres@yahoo.com','González Suárez, Quito'),
  ('0956789012','Andrés Felipe Rivera','0910987654','andres.rivera@gmail.com','Alborada, Guayaquil')
) AS v(cedula, nombre_completo, telefono, email, direccion)
WHERE NOT EXISTS (SELECT 1 FROM public.clientes WHERE cedula = v.cedula);

DO $$
DECLARE v_cli uuid; v_prod record; v_num text; v_fid uuid; v_sub numeric; v_iva numeric; v_qty int; i int;
BEGIN
  FOR i IN 1..50 LOOP
    SELECT id INTO v_cli FROM public.clientes ORDER BY random() LIMIT 1;
    IF v_cli IS NULL THEN EXIT; END IF;
    v_num := 'FAC-' || to_char(now() - (i || ' days')::interval, 'YYYYMMDD') || '-' || lpad(i::text,4,'0');
    IF EXISTS (SELECT 1 FROM public.facturas WHERE numero = v_num) THEN CONTINUE; END IF;
    INSERT INTO public.facturas (numero, cliente_id, fecha, estado)
      VALUES (v_num, v_cli, (current_date - (i || ' days')::interval)::date, 'EMITIDA')
      RETURNING id INTO v_fid;
    v_sub := 0;
    FOR v_prod IN SELECT id, precio_venta FROM public.productos ORDER BY random() LIMIT (1 + (random()*3)::int) LOOP
      v_qty := 1 + (random()*4)::int;
      INSERT INTO public.fac_detalle (factura_id, producto_id, cantidad, precio_unitario, subtotal)
      VALUES (v_fid, v_prod.id, v_qty, v_prod.precio_venta, v_qty * v_prod.precio_venta);
      v_sub := v_sub + v_qty * v_prod.precio_venta;
    END LOOP;
    v_iva := round(v_sub * 0.15, 2);
    UPDATE public.facturas SET subtotal = v_sub, iva = v_iva, total = v_sub + v_iva WHERE id = v_fid;
  END LOOP;
END $$;

-- ============================================================
-- DISTRIBUIDA: 5 esquemas de sucursales
-- ============================================================
DO $$
DECLARE
  v_schema text;
  v_schemas text[] := ARRAY['sucursal_quito','sucursal_guayaquil','sucursal_cuenca','sucursal_ambato','sucursal_portoviejo'];
BEGIN
  FOREACH v_schema IN ARRAY v_schemas LOOP
    EXECUTE format('CREATE SCHEMA %I', v_schema);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated, anon, service_role', v_schema);
    EXECUTE format('CREATE TABLE %I.ven_clientes (cli_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cli_cedula text UNIQUE NOT NULL, cli_nombre text NOT NULL, cli_telefono text, cli_email text, cli_ciudad text, created_at timestamptz DEFAULT now())', v_schema);
    EXECUTE format('CREATE TABLE %I.inv_productos (prd_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), prd_codigo text UNIQUE NOT NULL, prd_nombre text NOT NULL, prd_categoria text, prd_precio numeric(10,2) NOT NULL DEFAULT 0, prd_stock int NOT NULL DEFAULT 0, created_at timestamptz DEFAULT now())', v_schema);
    EXECUTE format('CREATE TABLE %I.ven_facturas (fac_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), fac_numero text UNIQUE NOT NULL, fac_cliente_id uuid, fac_fecha date NOT NULL DEFAULT current_date, fac_subtotal numeric(12,2) NOT NULL DEFAULT 0, fac_iva numeric(12,2) NOT NULL DEFAULT 0, fac_total numeric(12,2) NOT NULL DEFAULT 0, estado_fac text NOT NULL DEFAULT ''EMI'', created_at timestamptz DEFAULT now())', v_schema);
    EXECUTE format('CREATE TABLE %I.ven_fac_det (det_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), det_fac_id uuid, det_prd_id uuid, det_cantidad int NOT NULL, det_precio numeric(10,2) NOT NULL, det_subtotal numeric(12,2) NOT NULL)', v_schema);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO authenticated', v_schema);
    EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO service_role', v_schema);
    EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA %I TO anon', v_schema);
  END LOOP;
END $$;

-- Seed productos en cada sucursal
DO $$
DECLARE
  v_schema text;
  v_schemas text[] := ARRAY['sucursal_quito','sucursal_guayaquil','sucursal_cuenca','sucursal_ambato','sucursal_portoviejo'];
  v_prods text[][] := ARRAY[
    ARRAY['MED001','Paracetamol 500mg x 20','Analgésicos','2.50'],
    ARRAY['MED002','Ibuprofeno 400mg x 10','Analgésicos','4.00'],
    ARRAY['MED003','Amoxicilina 500mg x 12','Antibióticos','9.80'],
    ARRAY['MED004','Loratadina 10mg x 10','Antihistamínicos','6.50'],
    ARRAY['MED005','Omeprazol 20mg x 14','Gástricos','8.90'],
    ARRAY['MED006','Metformina 850mg x 30','Diabetes','12.00'],
    ARRAY['MED007','Losartán 50mg x 30','Hipertensión','11.50'],
    ARRAY['MED008','Atorvastatina 20mg x 30','Cardiovascular','14.50'],
    ARRAY['MED009','Diclofenaco 50mg x 20','Antiinflamatorios','5.50'],
    ARRAY['MED010','Salbutamol Inhalador','Respiratorios','16.90'],
    ARRAY['MED011','Ranitidina 150mg x 20','Gástricos','6.00'],
    ARRAY['MED013','Aspirina 100mg x 30','Cardiovascular','3.80'],
    ARRAY['MED015','Vitamina C 1g x 20','Vitaminas','4.80'],
    ARRAY['MED019','Azitromicina 500mg x 3','Antibióticos','12.80']
  ];
  i int;
BEGIN
  FOREACH v_schema IN ARRAY v_schemas LOOP
    FOR i IN 1..array_length(v_prods,1) LOOP
      EXECUTE format('INSERT INTO %I.inv_productos (prd_codigo, prd_nombre, prd_categoria, prd_precio, prd_stock) VALUES ($1,$2,$3,$4,$5)', v_schema)
        USING v_prods[i][1], v_prods[i][2], v_prods[i][3], v_prods[i][4]::numeric, 20 + (random()*100)::int;
    END LOOP;
  END LOOP;
END $$;

-- Seed clientes + facturas por sucursal
DO $$
DECLARE
  v_schema text;
  v_schemas text[] := ARRAY['sucursal_quito','sucursal_guayaquil','sucursal_cuenca','sucursal_ambato','sucursal_portoviejo'];
  v_ciudades text[] := ARRAY['Quito','Guayaquil','Cuenca','Ambato','Portoviejo'];
  v_nombres text[] := ARRAY['Juan Pérez','María García','Carlos López','Ana Martínez','Pedro Rodríguez',
                            'Lucía Sánchez','Fernando Ramírez','Carmen Torres','José Flores','Rosa Jiménez',
                            'Miguel Castro','Elena Morales','Roberto Silva','Patricia Ruiz','Andrés Gómez'];
  v_idx int; i int; v_ced text; v_cli_id uuid; v_fac_id uuid; v_num text;
  v_sub numeric; v_qty int; v_prod record;
BEGIN
  FOR v_idx IN 1..array_length(v_schemas,1) LOOP
    v_schema := v_schemas[v_idx];
    FOR i IN 1..15 LOOP
      v_ced := lpad((1000000000 + v_idx*100000 + i)::text, 10, '0');
      EXECUTE format('INSERT INTO %I.ven_clientes (cli_cedula, cli_nombre, cli_telefono, cli_email, cli_ciudad) VALUES ($1,$2,$3,$4,$5)', v_schema)
        USING v_ced, v_nombres[1+((i-1) % array_length(v_nombres,1))],
              '09' || lpad((10000000 + i*v_idx)::text,8,'0'),
              lower(replace(v_nombres[1+((i-1) % array_length(v_nombres,1))],' ','.')) || i || '@mail.com',
              v_ciudades[v_idx];
    END LOOP;

    FOR i IN 1..30 LOOP
      EXECUTE format('SELECT cli_id FROM %I.ven_clientes ORDER BY random() LIMIT 1', v_schema) INTO v_cli_id;
      v_num := upper(substring(v_schema,10,3)) || '-' || to_char(current_date - (i || ' days')::interval, 'YYYYMMDD') || '-' || lpad(i::text,4,'0');
      EXECUTE format('INSERT INTO %I.ven_facturas (fac_numero, fac_cliente_id, fac_fecha, estado_fac) VALUES ($1,$2,$3,$4) RETURNING fac_id', v_schema)
        USING v_num, v_cli_id, (current_date - (i || ' days')::interval)::date,
              CASE WHEN random() < 0.08 THEN 'CAN' ELSE 'EMI' END
        INTO v_fac_id;
      v_sub := 0;
      FOR v_prod IN EXECUTE format('SELECT prd_id, prd_precio FROM %I.inv_productos ORDER BY random() LIMIT %s', v_schema, 1+(random()*3)::int) LOOP
        v_qty := 1 + (random()*4)::int;
        EXECUTE format('INSERT INTO %I.ven_fac_det (det_fac_id, det_prd_id, det_cantidad, det_precio, det_subtotal) VALUES ($1,$2,$3,$4,$5)', v_schema)
          USING v_fac_id, v_prod.prd_id, v_qty, v_prod.prd_precio, v_qty * v_prod.prd_precio;
        v_sub := v_sub + v_qty * v_prod.prd_precio;
      END LOOP;
      EXECUTE format('UPDATE %I.ven_facturas SET fac_subtotal=$1, fac_iva=$2, fac_total=$3 WHERE fac_id=$4', v_schema)
        USING v_sub, round(v_sub*0.15,2), v_sub + round(v_sub*0.15,2), v_fac_id;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- BODEGA CENTRAL
-- ============================================================
CREATE SCHEMA bodega_central;
GRANT USAGE ON SCHEMA bodega_central TO authenticated, anon, service_role;

CREATE TABLE bodega_central.inv_productos (
  prd_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_codigo text UNIQUE NOT NULL,
  prd_nombre text NOT NULL,
  prd_lote text,
  prd_caducidad date,
  prd_stock int NOT NULL DEFAULT 0,
  prd_costo numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bodega_central.inv_movimientos (
  mov_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mov_prd_id uuid,
  mov_tipo text NOT NULL,
  mov_cantidad int NOT NULL,
  mov_destino text,
  mov_fecha timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA bodega_central TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA bodega_central TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA bodega_central TO anon;

INSERT INTO bodega_central.inv_productos (prd_codigo, prd_nombre, prd_lote, prd_caducidad, prd_stock, prd_costo) VALUES
('MED001','Paracetamol 500mg x 20','L2026A','2027-06-30',850,1.20),
('MED002','Ibuprofeno 400mg x 10','L2026B','2027-04-15',640,2.00),
('MED003','Amoxicilina 500mg x 12','L2026C','2026-12-20',420,5.50),
('MED004','Loratadina 10mg x 10','L2026D','2027-08-10',510,3.20),
('MED005','Omeprazol 20mg x 14','L2026E','2027-05-25',380,4.50),
('MED006','Metformina 850mg x 30','L2026F','2027-09-30',290,6.00),
('MED007','Losartán 50mg x 30','L2026G','2027-07-18',310,5.80),
('MED008','Atorvastatina 20mg x 30','L2026H','2027-03-22',240,7.20),
('MED009','Diclofenaco 50mg x 20','L2026I','2027-11-05',560,2.80),
('MED010','Salbutamol Inhalador','L2026J','2027-02-14',180,8.50),
('MED013','Aspirina 100mg x 30','L2026K','2028-01-30',720,1.80),
('MED015','Vitamina C 1g x 20','L2026L','2027-10-12',600,2.20);

DO $$
DECLARE v_p record; i int;
BEGIN
  FOR v_p IN SELECT prd_id FROM bodega_central.inv_productos LOOP
    FOR i IN 1..3 LOOP
      INSERT INTO bodega_central.inv_movimientos (mov_prd_id, mov_tipo, mov_cantidad, mov_destino, mov_fecha)
      VALUES (v_p.prd_id,
              CASE WHEN random() < 0.5 THEN 'ENTRADA' ELSE 'DESPACHO' END,
              10 + (random()*80)::int,
              (ARRAY['Quito','Guayaquil','Cuenca','Ambato','Portoviejo','Proveedor'])[1+(random()*5)::int],
              now() - (i || ' days')::interval);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- CLOUD ECOMMERCE
-- ============================================================
CREATE SCHEMA cloud_ecommerce;
GRANT USAGE ON SCHEMA cloud_ecommerce TO authenticated, anon, service_role;

CREATE TABLE cloud_ecommerce.cl_productos (
  prd_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_sku text UNIQUE NOT NULL,
  prd_nombre text NOT NULL,
  prd_descripcion text,
  prd_categoria text,
  prd_precio numeric(10,2) NOT NULL,
  prd_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE cloud_ecommerce.cl_clientes (
  cli_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cli_email text UNIQUE NOT NULL,
  cli_nombre text NOT NULL,
  cli_telefono text,
  cli_direccion text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE cloud_ecommerce.cl_pedidos (
  ped_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ped_numero text UNIQUE NOT NULL,
  ped_cli_id uuid,
  ped_fecha timestamptz DEFAULT now(),
  ped_total numeric(12,2) NOT NULL DEFAULT 0,
  ped_estado text DEFAULT 'PEN',
  ped_metodo_pago text DEFAULT 'TARJETA'
);

CREATE TABLE cloud_ecommerce.cl_ped_det (
  det_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  det_ped_id uuid,
  det_prd_id uuid,
  det_cantidad int NOT NULL,
  det_precio numeric(10,2) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA cloud_ecommerce TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA cloud_ecommerce TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA cloud_ecommerce TO anon;

INSERT INTO cloud_ecommerce.cl_productos (prd_sku, prd_nombre, prd_descripcion, prd_categoria, prd_precio) VALUES
('SKU-001','Paracetamol 500mg x 20','Analgésico y antipirético','Analgésicos',2.50),
('SKU-002','Ibuprofeno 400mg x 10','Antiinflamatorio no esteroideo','Analgésicos',4.00),
('SKU-003','Vitamina C 1g x 20','Refuerzo del sistema inmunológico','Vitaminas',4.80),
('SKU-004','Complejo B x 30','Multivitamínico','Vitaminas',8.50),
('SKU-005','Omeprazol 20mg x 14','Protector gástrico','Gástricos',8.90),
('SKU-006','Loratadina 10mg x 10','Antialérgico','Antihistamínicos',6.50),
('SKU-007','Aspirina 100mg x 30','Cardioprotector','Cardiovascular',3.80),
('SKU-008','Salbutamol Inhalador','Broncodilatador','Respiratorios',16.90),
('SKU-009','Crema Hidratante 200ml','Cuidado de la piel','Dermocosmética',12.50),
('SKU-010','Protector Solar SPF50','Bloqueador solar','Dermocosmética',18.90),
('SKU-011','Termómetro Digital','Equipo médico','Equipos',9.90),
('SKU-012','Tensiómetro Digital','Equipo médico','Equipos',45.00);

INSERT INTO cloud_ecommerce.cl_clientes (cli_email, cli_nombre, cli_telefono, cli_direccion) VALUES
('juan.perez@gmail.com','Juan Pérez','0991111111','Av. Naciones Unidas, Quito'),
('maria.lopez@hotmail.com','María López','0992222222','Cdla. Urdesa, Guayaquil'),
('carlos.mendoza@yahoo.com','Carlos Mendoza','0993333333','El Vergel, Cuenca'),
('ana.vega@gmail.com','Ana Vega','0994444444','Atocha, Ambato'),
('luis.paredes@outlook.com','Luis Paredes','0995555555','Av. Manabí, Portoviejo'),
('sofia.cabrera@gmail.com','Sofía Cabrera','0996666666','Cumbayá, Quito'),
('diego.salazar@hotmail.com','Diego Salazar','0997777777','Samborondón, Guayaquil'),
('patricia.ruiz@gmail.com','Patricia Ruiz','0998888888','Centro, Cuenca');

DO $$
DECLARE v_cli uuid; v_ped uuid; v_prod record; v_num text; v_total numeric; v_qty int; i int;
BEGIN
  FOR i IN 1..25 LOOP
    SELECT cli_id INTO v_cli FROM cloud_ecommerce.cl_clientes ORDER BY random() LIMIT 1;
    v_num := 'PED-' || lpad(i::text,5,'0');
    INSERT INTO cloud_ecommerce.cl_pedidos (ped_numero, ped_cli_id, ped_fecha, ped_estado, ped_metodo_pago)
    VALUES (v_num, v_cli, now() - (i || ' days')::interval,
            (ARRAY['PEN','ENV','ENT','ENT','ENT','CAN'])[1+(random()*5)::int],
            (ARRAY['TARJETA','TRANSFER','PAYPHONE'])[1+(random()*2)::int])
    RETURNING ped_id INTO v_ped;
    v_total := 0;
    FOR v_prod IN SELECT prd_id, prd_precio FROM cloud_ecommerce.cl_productos ORDER BY random() LIMIT 1+(random()*3)::int LOOP
      v_qty := 1+(random()*3)::int;
      INSERT INTO cloud_ecommerce.cl_ped_det (det_ped_id, det_prd_id, det_cantidad, det_precio)
      VALUES (v_ped, v_prod.prd_id, v_qty, v_prod.prd_precio);
      v_total := v_total + v_qty * v_prod.prd_precio;
    END LOOP;
    UPDATE cloud_ecommerce.cl_pedidos SET ped_total = v_total WHERE ped_id = v_ped;
  END LOOP;
END $$;

-- ============================================================
-- NOSQL DOCUMENTAL (estilo MongoDB con JSONB)
-- ============================================================
CREATE SCHEMA nosql_mongo;
GRANT USAGE ON SCHEMA nosql_mongo TO authenticated, anon, service_role;

CREATE TABLE nosql_mongo.documents (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection text NOT NULL,
  doc jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_nosql_collection ON nosql_mongo.documents(collection);
CREATE INDEX idx_nosql_doc ON nosql_mongo.documents USING gin(doc);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA nosql_mongo TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA nosql_mongo TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA nosql_mongo TO anon;

INSERT INTO nosql_mongo.documents (collection, doc) VALUES
('catalogo', '{"sku":"NSQ-001","nombre":"Paracetamol","laboratorio":"Genfar","presentaciones":[{"forma":"Tabletas 500mg","precio":2.50,"stock":150},{"forma":"Jarabe 120ml","precio":4.20,"stock":40}],"tags":["analgésico","antipirético","sin receta"]}'::jsonb),
('catalogo', '{"sku":"NSQ-002","nombre":"Ibuprofeno","laboratorio":"Bayer","presentaciones":[{"forma":"Tabletas 400mg","precio":4.00,"stock":120},{"forma":"Suspensión 100ml","precio":5.80,"stock":35}],"tags":["analgésico","antiinflamatorio"]}'::jsonb),
('catalogo', '{"sku":"NSQ-003","nombre":"Amoxicilina","laboratorio":"Pfizer","presentaciones":[{"forma":"Cápsulas 500mg","precio":9.80,"stock":80},{"forma":"Suspensión 250mg/5ml","precio":7.50,"stock":50}],"tags":["antibiótico","receta médica"]}'::jsonb),
('catalogo', '{"sku":"NSQ-004","nombre":"Vitamina C","laboratorio":"Roche","presentaciones":[{"forma":"Efervescente 1g","precio":4.80,"stock":110},{"forma":"Tabletas masticables","precio":3.50,"stock":85}],"tags":["vitamina","inmunológico"]}'::jsonb),
('catalogo', '{"sku":"NSQ-005","nombre":"Omeprazol","laboratorio":"GSK","presentaciones":[{"forma":"Cápsulas 20mg","precio":8.90,"stock":70},{"forma":"Cápsulas 40mg","precio":13.50,"stock":45}],"tags":["gástrico","reflujo"]}'::jsonb),
('resenas','{"producto_sku":"NSQ-001","cliente":"María L.","estrellas":5,"comentario":"Excelente, alivió mi dolor de cabeza rápidamente","fecha":"2026-05-15","verificado":true}'::jsonb),
('resenas','{"producto_sku":"NSQ-001","cliente":"Carlos M.","estrellas":4,"comentario":"Buen precio, calidad estándar","fecha":"2026-05-20","verificado":true}'::jsonb),
('resenas','{"producto_sku":"NSQ-002","cliente":"Ana V.","estrellas":5,"comentario":"Funciona muy bien para los cólicos","fecha":"2026-05-22","verificado":true,"util_votos":12}'::jsonb),
('resenas','{"producto_sku":"NSQ-003","cliente":"Luis P.","estrellas":5,"comentario":"Mi médico me lo recetó y funcionó perfectamente","fecha":"2026-05-25","verificado":true}'::jsonb),
('resenas','{"producto_sku":"NSQ-004","cliente":"Sofía C.","estrellas":4,"comentario":"Sabor agradable, sube las defensas","fecha":"2026-06-01","verificado":false}'::jsonb),
('resenas','{"producto_sku":"NSQ-005","cliente":"Diego S.","estrellas":5,"comentario":"Resolvió mi gastritis crónica","fecha":"2026-06-03","verificado":true,"util_votos":24}'::jsonb),
('logs','{"evento":"login","usuario":"admin@farma.com","ip":"192.168.1.10","navegador":"Chrome","timestamp":"2026-06-08T08:00:00Z"}'::jsonb),
('logs','{"evento":"venta","sucursal":"Quito","monto":45.80,"productos":3,"cajero":"Luis P.","timestamp":"2026-06-08T09:15:00Z"}'::jsonb),
('logs','{"evento":"alerta_stock","producto":"Paracetamol","sucursal":"Cuenca","stock_actual":3,"stock_minimo":20,"timestamp":"2026-06-08T10:30:00Z"}'::jsonb),
('logs','{"evento":"pedido_online","cliente":"juan.perez@gmail.com","monto":89.50,"items":4,"metodo":"TARJETA","timestamp":"2026-06-08T11:45:00Z"}'::jsonb),
('logs','{"evento":"sincronizacion","origen":"sucursal_guayaquil","destino":"central","registros":127,"duracion_ms":340,"timestamp":"2026-06-08T12:00:00Z"}'::jsonb),
('logs','{"evento":"error_pago","cliente":"maria.lopez@hotmail.com","gateway":"Payphone","codigo":"E-402","mensaje":"Fondos insuficientes","timestamp":"2026-06-08T13:20:00Z"}'::jsonb);

-- ============================================================
-- Funciones globales
-- ============================================================
CREATE OR REPLACE FUNCTION public.arq_resumen_global()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE r jsonb := '{}'::jsonb;
DECLARE
  s text;
  schemas text[] := ARRAY['sucursal_quito','sucursal_guayaquil','sucursal_cuenca','sucursal_ambato','sucursal_portoviejo'];
  total_facturas int := 0; total_clientes int := 0; total_ventas numeric := 0;
  c int; v numeric; cl int;
BEGIN
  r := jsonb_set(r, '{centralizada}', jsonb_build_object(
    'productos', (SELECT count(*) FROM public.productos),
    'clientes', (SELECT count(*) FROM public.clientes),
    'facturas', (SELECT count(*) FROM public.facturas),
    'empleados', (SELECT count(*) FROM public.empleados),
    'ventas_total', COALESCE((SELECT sum(total) FROM public.facturas WHERE estado <> 'ANULADA'),0)
  ));
  FOREACH s IN ARRAY schemas LOOP
    EXECUTE format('SELECT count(*), COALESCE(sum(fac_total),0) FROM %I.ven_facturas WHERE estado_fac <> ''CAN''', s) INTO c, v;
    EXECUTE format('SELECT count(*) FROM %I.ven_clientes', s) INTO cl;
    total_facturas := total_facturas + c;
    total_ventas := total_ventas + v;
    total_clientes := total_clientes + cl;
  END LOOP;
  r := jsonb_set(r, '{distribuida}', jsonb_build_object(
    'sucursales', array_length(schemas,1),
    'clientes', total_clientes,
    'facturas', total_facturas,
    'ventas_total', total_ventas
  ));
  r := jsonb_set(r, '{bodega}', jsonb_build_object(
    'productos', (SELECT count(*) FROM bodega_central.inv_productos),
    'stock_total', (SELECT COALESCE(sum(prd_stock),0) FROM bodega_central.inv_productos),
    'movimientos', (SELECT count(*) FROM bodega_central.inv_movimientos)
  ));
  r := jsonb_set(r, '{nube}', jsonb_build_object(
    'productos', (SELECT count(*) FROM cloud_ecommerce.cl_productos),
    'clientes', (SELECT count(*) FROM cloud_ecommerce.cl_clientes),
    'pedidos', (SELECT count(*) FROM cloud_ecommerce.cl_pedidos),
    'ventas_total', COALESCE((SELECT sum(ped_total) FROM cloud_ecommerce.cl_pedidos WHERE ped_estado <> 'CAN'),0)
  ));
  r := jsonb_set(r, '{nosql}', jsonb_build_object(
    'documentos', (SELECT count(*) FROM nosql_mongo.documents),
    'colecciones', (SELECT count(DISTINCT collection) FROM nosql_mongo.documents),
    'catalogo', (SELECT count(*) FROM nosql_mongo.documents WHERE collection='catalogo'),
    'resenas', (SELECT count(*) FROM nosql_mongo.documents WHERE collection='resenas'),
    'logs', (SELECT count(*) FROM nosql_mongo.documents WHERE collection='logs')
  ));
  RETURN r;
END $fn$;

CREATE OR REPLACE FUNCTION public.arq_buscar_disponibilidad(p_query text)
RETURNS TABLE(sucursal text, codigo text, nombre text, precio numeric, stock int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  s text;
  schemas text[] := ARRAY['sucursal_quito','sucursal_guayaquil','sucursal_cuenca','sucursal_ambato','sucursal_portoviejo'];
BEGIN
  FOREACH s IN ARRAY schemas LOOP
    RETURN QUERY EXECUTE format(
      'SELECT %L::text, prd_codigo, prd_nombre, prd_precio, prd_stock FROM %I.inv_productos WHERE prd_nombre ILIKE $1 OR prd_codigo ILIKE $1 ORDER BY prd_nombre',
      replace(s,'sucursal_',''), s)
      USING '%' || p_query || '%';
  END LOOP;
END $fn$;

CREATE OR REPLACE FUNCTION public.arq_nosql_query(p_collection text, p_limit int DEFAULT 50)
RETURNS TABLE(_id uuid, doc jsonb, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  RETURN QUERY EXECUTE format('SELECT _id, doc, created_at FROM nosql_mongo.documents WHERE collection = $1 ORDER BY created_at DESC LIMIT %s', p_limit) USING p_collection;
END $fn$;

GRANT EXECUTE ON FUNCTION public.arq_resumen_global() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arq_buscar_disponibilidad(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arq_nosql_query(text, int) TO anon, authenticated;
