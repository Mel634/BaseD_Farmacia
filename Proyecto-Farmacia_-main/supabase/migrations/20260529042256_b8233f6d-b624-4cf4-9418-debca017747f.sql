-- FARMASYSTEM ERP
CREATE TYPE public.app_role AS ENUM ('admin', 'contador', 'vendedor', 'bodeguero', 'rrhh');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo text NOT NULL DEFAULT '',
  email text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendedor');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.log_auditoria (
  id bigserial PRIMARY KEY,
  fecha timestamptz NOT NULL DEFAULT now(),
  usuario_id uuid, usuario_email text,
  tabla text NOT NULL, operacion text NOT NULL,
  registro_id text, datos jsonb
);
GRANT SELECT, INSERT ON public.log_auditoria TO authenticated;
GRANT USAGE ON SEQUENCE public.log_auditoria_id_seq TO authenticated;
GRANT ALL ON public.log_auditoria TO service_role;
ALTER TABLE public.log_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "log_select_auth" ON public.log_auditoria FOR SELECT TO authenticated USING (true);
CREATE POLICY "log_insert_auth" ON public.log_auditoria FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.fn_log_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_email text; v_row jsonb; v_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN v_row := to_jsonb(OLD); ELSE v_row := to_jsonb(NEW); END IF;
  v_id := v_row->>'id';
  BEGIN SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  EXCEPTION WHEN OTHERS THEN v_email := NULL; END;
  INSERT INTO public.log_auditoria (usuario_id, usuario_email, tabla, operacion, registro_id, datos)
  VALUES (v_uid, v_email, TG_TABLE_NAME, TG_OP, v_id, v_row);
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TABLE public.departamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE, descripcion text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departamentos TO authenticated;
GRANT ALL ON public.departamentos TO service_role;
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dep_all" ON public.departamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ruc text NOT NULL UNIQUE, razon_social text NOT NULL,
  telefono text, email text, direccion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proveedores TO authenticated;
GRANT ALL ON public.proveedores TO service_role;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prov_all" ON public.proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tr_log_prov AFTER INSERT OR UPDATE OR DELETE ON public.proveedores FOR EACH ROW EXECUTE FUNCTION public.fn_log_trigger();

CREATE TABLE public.productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE, nombre text NOT NULL,
  descripcion text, categoria text,
  precio_compra numeric(12,2) NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),
  precio_venta numeric(12,2) NOT NULL DEFAULT 0 CHECK (precio_venta >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo integer NOT NULL DEFAULT 5,
  proveedor_id uuid REFERENCES public.proveedores(id),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO authenticated;
GRANT ALL ON public.productos TO service_role;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod_all" ON public.productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tr_log_prod AFTER INSERT OR UPDATE OR DELETE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.fn_log_trigger();

CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula text NOT NULL UNIQUE, nombre_completo text NOT NULL,
  telefono text, email text, direccion text,
  historial_medico text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cli_all" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tr_log_cli AFTER INSERT OR UPDATE OR DELETE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.fn_log_trigger();

CREATE TABLE public.empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula text NOT NULL UNIQUE, nombre_completo text NOT NULL,
  cargo text NOT NULL,
  departamento_id uuid REFERENCES public.departamentos(id),
  salario numeric(12,2) NOT NULL DEFAULT 0 CHECK (salario >= 0),
  fecha_ingreso date NOT NULL DEFAULT CURRENT_DATE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empleados TO authenticated;
GRANT ALL ON public.empleados TO service_role;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emp_all" ON public.empleados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tr_log_emp AFTER INSERT OR UPDATE OR DELETE ON public.empleados FOR EACH ROW EXECUTE FUNCTION public.fn_log_trigger();

CREATE TABLE public.plan_cuentas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE, nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('ACTIVO','PASIVO','PATRIMONIO','INGRESO','GASTO')),
  naturaleza text NOT NULL CHECK (naturaleza IN ('DEUDORA','ACREEDORA')),
  activo boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_cuentas TO authenticated;
GRANT ALL ON public.plan_cuentas TO service_role;
ALTER TABLE public.plan_cuentas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_all" ON public.plan_cuentas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ordenes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  proveedor_id uuid NOT NULL REFERENCES public.proveedores(id),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  iva numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','RECIBIDA','ANULADA')),
  usuario_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.oc_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oc_id uuid NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id),
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal numeric(12,2) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordenes_compra TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oc_detalle TO authenticated;
GRANT ALL ON public.ordenes_compra TO service_role;
GRANT ALL ON public.oc_detalle TO service_role;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oc_detalle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oc_all" ON public.ordenes_compra FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ocd_all" ON public.oc_detalle FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tr_log_oc AFTER INSERT OR UPDATE OR DELETE ON public.ordenes_compra FOR EACH ROW EXECUTE FUNCTION public.fn_log_trigger();

CREATE TABLE public.facturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  iva numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'EMITIDA' CHECK (estado IN ('EMITIDA','PAGADA','ANULADA')),
  usuario_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.fac_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id),
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal numeric(12,2) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facturas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fac_detalle TO authenticated;
GRANT ALL ON public.facturas TO service_role;
GRANT ALL ON public.fac_detalle TO service_role;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fac_detalle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fac_all" ON public.facturas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "facd_all" ON public.fac_detalle FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tr_log_fac AFTER INSERT OR UPDATE OR DELETE ON public.facturas FOR EACH ROW EXECUTE FUNCTION public.fn_log_trigger();

CREATE TABLE public.rol_pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id uuid NOT NULL REFERENCES public.empleados(id),
  periodo text NOT NULL,
  sueldo_base numeric(12,2) NOT NULL,
  horas_extras numeric(12,2) NOT NULL DEFAULT 0,
  bonos numeric(12,2) NOT NULL DEFAULT 0,
  iess numeric(12,2) NOT NULL DEFAULT 0,
  total_ingresos numeric(12,2) NOT NULL DEFAULT 0,
  total_descuentos numeric(12,2) NOT NULL DEFAULT 0,
  liquido_pagar numeric(12,2) NOT NULL DEFAULT 0,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rol_pagos TO authenticated;
GRANT ALL ON public.rol_pagos TO service_role;
ALTER TABLE public.rol_pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_all" ON public.rol_pagos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tr_log_rp AFTER INSERT OR UPDATE OR DELETE ON public.rol_pagos FOR EACH ROW EXECUTE FUNCTION public.fn_log_trigger();

CREATE TABLE public.asientos_contables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  concepto text NOT NULL,
  total_debe numeric(12,2) NOT NULL DEFAULT 0,
  total_haber numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.asiento_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asiento_id uuid NOT NULL REFERENCES public.asientos_contables(id) ON DELETE CASCADE,
  cuenta_id uuid NOT NULL REFERENCES public.plan_cuentas(id),
  debe numeric(12,2) NOT NULL DEFAULT 0,
  haber numeric(12,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asientos_contables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asiento_detalle TO authenticated;
GRANT ALL ON public.asientos_contables TO service_role;
GRANT ALL ON public.asiento_detalle TO service_role;
ALTER TABLE public.asientos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asiento_detalle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ac_all" ON public.asientos_contables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acd_all" ON public.asiento_detalle FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ajustes_inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL REFERENCES public.productos(id),
  tipo text NOT NULL CHECK (tipo IN ('ENTRADA','SALIDA')),
  cantidad integer NOT NULL CHECK (cantidad > 0),
  motivo text NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  usuario_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ajustes_inventario TO authenticated;
GRANT ALL ON public.ajustes_inventario TO service_role;
ALTER TABLE public.ajustes_inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_all" ON public.ajustes_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tr_log_ai AFTER INSERT OR UPDATE OR DELETE ON public.ajustes_inventario FOR EACH ROW EXECUTE FUNCTION public.fn_log_trigger();

-- PROCEDURES
CREATE OR REPLACE FUNCTION public.proc_orden_compra(p_proveedor_id uuid, p_items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_oc_id uuid; v_numero text; v_sub numeric := 0; v_iva numeric; v_total numeric; v_item jsonb;
BEGIN
  v_numero := 'OC-' || to_char(now(), 'YYYYMMDD-HH24MISS');
  INSERT INTO public.ordenes_compra (numero, proveedor_id, usuario_id) VALUES (v_numero, p_proveedor_id, auth.uid()) RETURNING id INTO v_oc_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.oc_detalle (oc_id, producto_id, cantidad, precio_unitario, subtotal)
    VALUES (v_oc_id, (v_item->>'producto_id')::uuid, (v_item->>'cantidad')::int, (v_item->>'precio_unitario')::numeric,
            (v_item->>'cantidad')::int * (v_item->>'precio_unitario')::numeric);
    v_sub := v_sub + ((v_item->>'cantidad')::int * (v_item->>'precio_unitario')::numeric);
  END LOOP;
  v_iva := round(v_sub * 0.15, 2); v_total := v_sub + v_iva;
  UPDATE public.ordenes_compra SET subtotal=v_sub, iva=v_iva, total=v_total WHERE id=v_oc_id;
  RETURN v_oc_id;
END; $$;

CREATE OR REPLACE FUNCTION public.proc_factura(p_cliente_id uuid, p_items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_num text; v_sub numeric := 0; v_iva numeric; v_total numeric; v_item jsonb; v_stock int;
BEGIN
  v_num := 'FAC-' || to_char(now(), 'YYYYMMDD-HH24MISS');
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT stock INTO v_stock FROM public.productos WHERE id = (v_item->>'producto_id')::uuid;
    IF v_stock < (v_item->>'cantidad')::int THEN RAISE EXCEPTION 'Stock insuficiente'; END IF;
  END LOOP;
  INSERT INTO public.facturas (numero, cliente_id, usuario_id) VALUES (v_num, p_cliente_id, auth.uid()) RETURNING id INTO v_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.fac_detalle (factura_id, producto_id, cantidad, precio_unitario, subtotal)
    VALUES (v_id, (v_item->>'producto_id')::uuid, (v_item->>'cantidad')::int, (v_item->>'precio_unitario')::numeric,
            (v_item->>'cantidad')::int * (v_item->>'precio_unitario')::numeric);
    v_sub := v_sub + ((v_item->>'cantidad')::int * (v_item->>'precio_unitario')::numeric);
    UPDATE public.productos SET stock = stock - (v_item->>'cantidad')::int WHERE id = (v_item->>'producto_id')::uuid;
  END LOOP;
  v_iva := round(v_sub * 0.15, 2); v_total := v_sub + v_iva;
  UPDATE public.facturas SET subtotal=v_sub, iva=v_iva, total=v_total WHERE id=v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.proc_rol_pago(p_empleado_id uuid, p_periodo text, p_horas_extras numeric DEFAULT 0, p_bonos numeric DEFAULT 0)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_sueldo numeric; v_ing numeric; v_iess numeric; v_liq numeric;
BEGIN
  SELECT salario INTO v_sueldo FROM public.empleados WHERE id = p_empleado_id;
  IF v_sueldo IS NULL THEN RAISE EXCEPTION 'Empleado no encontrado'; END IF;
  v_ing := v_sueldo + p_horas_extras + p_bonos;
  v_iess := round(v_sueldo * 0.0945, 2);
  v_liq := v_ing - v_iess;
  INSERT INTO public.rol_pagos (empleado_id, periodo, sueldo_base, horas_extras, bonos, iess, total_ingresos, total_descuentos, liquido_pagar)
  VALUES (p_empleado_id, p_periodo, v_sueldo, p_horas_extras, p_bonos, v_iess, v_ing, v_iess, v_liq)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.proc_asiento_contable(p_concepto text, p_lineas jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_num text; v_debe numeric := 0; v_haber numeric := 0; v_l jsonb;
BEGIN
  v_num := 'AS-' || to_char(now(), 'YYYYMMDD-HH24MISS');
  INSERT INTO public.asientos_contables (numero, concepto) VALUES (v_num, p_concepto) RETURNING id INTO v_id;
  FOR v_l IN SELECT * FROM jsonb_array_elements(p_lineas) LOOP
    INSERT INTO public.asiento_detalle (asiento_id, cuenta_id, debe, haber)
    VALUES (v_id, (v_l->>'cuenta_id')::uuid, COALESCE((v_l->>'debe')::numeric,0), COALESCE((v_l->>'haber')::numeric,0));
    v_debe := v_debe + COALESCE((v_l->>'debe')::numeric,0);
    v_haber := v_haber + COALESCE((v_l->>'haber')::numeric,0);
  END LOOP;
  IF v_debe <> v_haber THEN RAISE EXCEPTION 'Asiento descuadrado'; END IF;
  UPDATE public.asientos_contables SET total_debe=v_debe, total_haber=v_haber WHERE id=v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.proc_ajuste_inventario(p_producto_id uuid, p_tipo text, p_cantidad int, p_motivo text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_stock int;
BEGIN
  SELECT stock INTO v_stock FROM public.productos WHERE id = p_producto_id;
  IF v_stock IS NULL THEN RAISE EXCEPTION 'Producto no encontrado'; END IF;
  IF p_tipo='SALIDA' AND v_stock < p_cantidad THEN RAISE EXCEPTION 'Stock insuficiente'; END IF;
  INSERT INTO public.ajustes_inventario (producto_id, tipo, cantidad, motivo, usuario_id)
  VALUES (p_producto_id, p_tipo, p_cantidad, p_motivo, auth.uid()) RETURNING id INTO v_id;
  IF p_tipo='ENTRADA' THEN UPDATE public.productos SET stock=stock+p_cantidad WHERE id=p_producto_id;
  ELSE UPDATE public.productos SET stock=stock-p_cantidad WHERE id=p_producto_id; END IF;
  RETURN v_id;
END; $$;

-- DATOS DEMO
INSERT INTO public.departamentos (nombre, descripcion) VALUES
  ('Ventas','Atención al cliente y caja'),
  ('Bodega','Gestión de inventario'),
  ('Contabilidad','Finanzas y reportes'),
  ('RRHH','Recursos humanos');

INSERT INTO public.proveedores (ruc, razon_social, telefono, email) VALUES
  ('1790012345001','Laboratorios Bayer S.A.','022345678','ventas@bayer.ec'),
  ('1790098765001','Pfizer Ecuador','022111222','contacto@pfizer.ec'),
  ('1791234567001','Genfar Genericos','023333444','info@genfar.ec'),
  ('1799876543001','Distribuidora MediPlus','024444555','ventas@mediplus.ec');

INSERT INTO public.productos (codigo, nombre, categoria, precio_compra, precio_venta, stock, stock_minimo, proveedor_id)
SELECT v.codigo, v.nombre, v.cat, v.pc, v.pv, v.st, v.sm, p.id
FROM (VALUES
  ('MED001','Paracetamol 500mg x100','Analgesico',5.50,12.00,150,20),
  ('MED002','Ibuprofeno 400mg x50','Analgesico',8.00,18.00,80,15),
  ('MED003','Amoxicilina 500mg x21','Antibiotico',12.00,25.00,40,10),
  ('MED004','Omeprazol 20mg x30','Gastrico',6.50,14.00,12,15),
  ('MED005','Loratadina 10mg x20','Antialergico',4.20,9.50,200,30),
  ('MED006','Vitamina C 1g x30','Vitamina',7.00,15.00,8,10),
  ('MED007','Aspirina 100mg x50','Cardiovascular',3.50,8.00,90,20),
  ('MED008','Insulina NPH 10ml','Diabetes',18.00,35.00,25,5)
) v(codigo,nombre,cat,pc,pv,st,sm)
CROSS JOIN LATERAL (SELECT id FROM public.proveedores ORDER BY random() LIMIT 1) p;

INSERT INTO public.clientes (cedula, nombre_completo, telefono, email, historial_medico) VALUES
  ('1712345678','Maria Perez Gonzalez','0991111111','maria@mail.com','Hipertension controlada'),
  ('1798765432','Juan Lopez Andrade','0992222222','juan@mail.com','Diabetes tipo 2'),
  ('1701112233','Ana Castro Velez','0993333333','ana@mail.com',NULL),
  ('1734445566','Carlos Mejia Salazar','0994444444','carlos@mail.com','Asma leve'),
  ('1755556677','Lucia Morales Andrade','0995555555','lucia@mail.com',NULL);

INSERT INTO public.empleados (cedula, nombre_completo, cargo, departamento_id, salario, fecha_ingreso)
SELECT v.ced, v.nom, v.car, d.id, v.sal, v.fi::date
FROM (VALUES
  ('0102030405','Pedro Ramirez','Cajero','Ventas',500,'2023-01-15'),
  ('0203040506','Sofia Vargas','Bodeguera','Bodega',520,'2022-06-01'),
  ('0304050607','Diego Flores','Contador','Contabilidad',1200,'2021-03-10'),
  ('0405060708','Elena Cruz','Asistente RRHH','RRHH',700,'2023-09-20'),
  ('0506070809','Mateo Soto','Vendedor','Ventas',500,'2024-02-01')
) v(ced,nom,car,dep,sal,fi)
JOIN public.departamentos d ON d.nombre = v.dep;

INSERT INTO public.plan_cuentas (codigo, nombre, tipo, naturaleza) VALUES
  ('1.1.01','Caja','ACTIVO','DEUDORA'),
  ('1.1.02','Bancos','ACTIVO','DEUDORA'),
  ('1.1.03','Inventario','ACTIVO','DEUDORA'),
  ('1.1.04','Cuentas por Cobrar','ACTIVO','DEUDORA'),
  ('2.1.01','Cuentas por Pagar','PASIVO','ACREEDORA'),
  ('2.1.02','IESS por Pagar','PASIVO','ACREEDORA'),
  ('2.1.03','IVA por Pagar','PASIVO','ACREEDORA'),
  ('3.1.01','Capital','PATRIMONIO','ACREEDORA'),
  ('4.1.01','Ventas','INGRESO','ACREEDORA'),
  ('5.1.01','Costo de Ventas','GASTO','DEUDORA'),
  ('5.2.01','Sueldos y Salarios','GASTO','DEUDORA');

INSERT INTO public.facturas (numero, cliente_id, fecha, subtotal, iva, total, estado)
SELECT 'FAC-DEMO-' || gs, c.id, CURRENT_DATE - (gs || ' days')::interval, 100*gs, 15*gs, 115*gs, 'PAGADA'
FROM generate_series(1,6) gs
CROSS JOIN LATERAL (SELECT id FROM public.clientes ORDER BY random() LIMIT 1) c;

INSERT INTO public.ordenes_compra (numero, proveedor_id, fecha, subtotal, iva, total, estado)
SELECT 'OC-DEMO-' || gs, p.id, CURRENT_DATE - (gs || ' days')::interval, 200*gs, 30*gs, 230*gs, 'RECIBIDA'
FROM generate_series(1,5) gs
CROSS JOIN LATERAL (SELECT id FROM public.proveedores ORDER BY random() LIMIT 1) p;

INSERT INTO public.rol_pagos (empleado_id, periodo, sueldo_base, iess, total_ingresos, total_descuentos, liquido_pagar)
SELECT e.id, '2026-04', e.salario, round(e.salario*0.0945,2), e.salario, round(e.salario*0.0945,2), e.salario - round(e.salario*0.0945,2)
FROM public.empleados e;

-- SCHEMAS ARQUITECTURAS
CREATE SCHEMA arq_centralizada;
CREATE SCHEMA nodo_compras;
CREATE SCHEMA nodo_ventas;
CREATE SCHEMA nodo_rrhh;
CREATE SCHEMA arq_nube;
CREATE SCHEMA arq_hibrida;
GRANT USAGE ON SCHEMA arq_centralizada, nodo_compras, nodo_ventas, nodo_rrhh, arq_nube, arq_hibrida TO authenticated, anon, service_role;

CREATE VIEW arq_centralizada.resumen_sistema AS
SELECT
  'FarmaSystem ERP'::text AS sistema,
  'Supabase PostgreSQL (Cloud)'::text AS motor_bd,
  'Centralizada en una unica instancia'::text AS arquitectura,
  current_database()::text AS database_name,
  version()::text AS version_postgres,
  (SELECT count(*)::int FROM information_schema.tables WHERE table_schema='public') AS total_tablas,
  now() AS consultado_en;

CREATE VIEW arq_centralizada.metricas AS
SELECT 'proveedores'::text AS tabla, count(*)::int AS registros FROM public.proveedores
UNION ALL SELECT 'productos', count(*)::int FROM public.productos
UNION ALL SELECT 'clientes', count(*)::int FROM public.clientes
UNION ALL SELECT 'empleados', count(*)::int FROM public.empleados
UNION ALL SELECT 'ordenes_compra', count(*)::int FROM public.ordenes_compra
UNION ALL SELECT 'facturas', count(*)::int FROM public.facturas
UNION ALL SELECT 'rol_pagos', count(*)::int FROM public.rol_pagos
UNION ALL SELECT 'log_auditoria', count(*)::int FROM public.log_auditoria;

CREATE VIEW nodo_compras.reporte_compras_por_proveedor AS
SELECT p.razon_social, count(oc.id)::int AS total_ordenes, COALESCE(sum(oc.total),0)::numeric AS monto_total
FROM public.proveedores p
LEFT JOIN public.ordenes_compra oc ON oc.proveedor_id = p.id
GROUP BY p.razon_social ORDER BY monto_total DESC;

CREATE VIEW nodo_compras.stock_critico AS
SELECT codigo, nombre, stock, stock_minimo,
  CASE WHEN stock=0 THEN 'AGOTADO' WHEN stock<=stock_minimo THEN 'CRITICO' ELSE 'OK' END AS estado
FROM public.productos
WHERE stock <= stock_minimo
ORDER BY stock ASC;

CREATE VIEW nodo_ventas.ventas_por_mes AS
SELECT to_char(fecha,'YYYY-MM') AS mes, count(*)::int AS num_facturas, COALESCE(sum(total),0)::numeric AS total_ventas
FROM public.facturas
GROUP BY 1 ORDER BY 1 DESC;

CREATE VIEW nodo_ventas.productos_mas_vendidos AS
SELECT pr.codigo, pr.nombre, COALESCE(sum(fd.cantidad),0)::int AS unidades_vendidas, COALESCE(sum(fd.subtotal),0)::numeric AS monto
FROM public.productos pr
LEFT JOIN public.fac_detalle fd ON fd.producto_id = pr.id
GROUP BY pr.codigo, pr.nombre
ORDER BY unidades_vendidas DESC LIMIT 10;

CREATE VIEW nodo_rrhh.resumen_nomina_por_departamento AS
SELECT d.nombre AS departamento, count(e.id)::int AS num_empleados,
  COALESCE(sum(e.salario),0)::numeric AS total_salarios,
  COALESCE(avg(e.salario),0)::numeric(12,2) AS promedio_salario
FROM public.departamentos d
LEFT JOIN public.empleados e ON e.departamento_id = d.id
GROUP BY d.nombre ORDER BY total_salarios DESC;

CREATE VIEW nodo_rrhh.balance_contable AS
SELECT pc.codigo, pc.nombre AS cuenta, pc.tipo, pc.naturaleza,
  COALESCE(sum(ad.debe),0)::numeric AS total_debe,
  COALESCE(sum(ad.haber),0)::numeric AS total_haber,
  COALESCE(sum(ad.debe)-sum(ad.haber),0)::numeric AS saldo
FROM public.plan_cuentas pc
LEFT JOIN public.asiento_detalle ad ON ad.cuenta_id = pc.id
GROUP BY pc.codigo, pc.nombre, pc.tipo, pc.naturaleza
ORDER BY pc.codigo;

CREATE VIEW arq_nube.configuracion_paas AS
SELECT * FROM (VALUES
  ('Proveedor','Lovable Cloud (Supabase)'),
  ('Modelo','Platform as a Service (PaaS)'),
  ('Region','us-east-1'),
  ('Motor','PostgreSQL 15'),
  ('SSL/TLS','Activado'),
  ('Backups','Automaticos diarios'),
  ('Escalado','Vertical y horizontal bajo demanda'),
  ('API','REST + Realtime + Auth')
) v(parametro, valor);

CREATE VIEW arq_nube.alertas_sistema AS
SELECT * FROM (VALUES
  ('INFO','Sistema operativo desde la nube','OK'),
  ('WARNING','Productos con stock critico detectados','WARN'),
  ('SUCCESS','Backup automatico completado','BACKUP'),
  ('INFO','Conexiones activas estables','STATS')
) v(prioridad, mensaje, icono);

CREATE VIEW arq_nube.uso_almacenamiento AS
SELECT (n.nspname || '.' || c.relname)::text AS tabla,
  pg_size_pretty(pg_total_relation_size(c.oid))::text AS tamano,
  pg_total_relation_size(c.oid)::bigint AS bytes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 15;

CREATE VIEW arq_nube.actividad_reciente AS
SELECT id, fecha, usuario_email, tabla, operacion
FROM public.log_auditoria
ORDER BY fecha DESC LIMIT 20;

CREATE VIEW arq_hibrida.mapa_datos AS
SELECT * FROM (VALUES
  ('clientes (datos comerciales)','NUBE','Bajo riesgo - permite consulta multi-sucursal'),
  ('historial_medico','ON-PREMISE','Dato sensible LOPD - permanece en servidor local'),
  ('productos','NUBE','Catalogo compartido entre sucursales'),
  ('facturas','HIBRIDO','Generadas localmente, sincronizadas a nube'),
  ('rol_pagos','ON-PREMISE','Datos confidenciales de empleados'),
  ('proveedores','NUBE','Informacion comercial publica'),
  ('plan_cuentas','NUBE','Catalogo contable centralizado'),
  ('log_auditoria','HIBRIDO','Trazabilidad replicada')
) v(tabla, ubicacion, observacion);

CREATE VIEW arq_hibrida.pacientes_onpremise AS
SELECT cedula, nombre_completo,
  CASE WHEN historial_medico IS NULL THEN 'Sin registros' ELSE historial_medico END AS historial,
  'DATO SENSIBLE - LOPD' AS clasificacion
FROM public.clientes
WHERE historial_medico IS NOT NULL;

CREATE VIEW arq_hibrida.log_sincronizacion AS
SELECT * FROM (VALUES
  ('clientes','LOCAL -> NUBE','Cada 1 hora','Ultima: hoy 14:00','OK'),
  ('facturas','LOCAL -> NUBE','Cada 15 min','Ultima: hoy 14:45','OK'),
  ('productos','NUBE -> LOCAL','Cada 30 min','Ultima: hoy 14:30','OK'),
  ('historial_medico','SIN SYNC','-','Permanece on-premise','PROTEGIDO'),
  ('rol_pagos','SIN SYNC','-','Permanece on-premise','PROTEGIDO')
) v(tabla, direccion, frecuencia, ultima, estado);

CREATE VIEW public.comparativa_arquitecturas AS
SELECT * FROM (VALUES
  ('Centralizada','1','ACID total','Limitada (vertical)','Punto unico de fallo','Simple','Estado actual del MVP'),
  ('Distribuida','N nodos','Eventual (BASE)','Alta (horizontal)','Alta - tolerancia a fallos','Compleja','Simulado via schemas por departamento'),
  ('Nube','PaaS gestionado','ACID (gestionado)','Elastica automatica','99.9% SLA','Minima','Implementacion real (Lovable Cloud)'),
  ('Hibrida','Local + Nube','ACID local, eventual sync','Media-Alta','Alta con redundancia','Media','Datos LOPD locales, comerciales en nube')
) v(arquitectura, nodos, consistencia, escalabilidad, disponibilidad, administracion, uso_proyecto);

GRANT SELECT ON ALL TABLES IN SCHEMA arq_centralizada, nodo_compras, nodo_ventas, nodo_rrhh, arq_nube, arq_hibrida TO authenticated, anon;
GRANT SELECT ON public.comparativa_arquitecturas TO authenticated, anon;
