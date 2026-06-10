
-- 1. Jefes de zona
CREATE TABLE IF NOT EXISTS public.jefes_zona (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  cargo text NOT NULL DEFAULT 'Jefe de Zona',
  telefono text,
  whatsapp text,
  email text,
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jefes_zona TO authenticated;
GRANT SELECT ON public.jefes_zona TO anon;
GRANT ALL ON public.jefes_zona TO service_role;
ALTER TABLE public.jefes_zona ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jz_all ON public.jefes_zona;
DROP POLICY IF EXISTS jz_read_anon ON public.jefes_zona;
CREATE POLICY jz_all ON public.jefes_zona FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY jz_read_anon ON public.jefes_zona FOR SELECT TO anon USING (true);

INSERT INTO public.jefes_zona (sucursal_id, nombre, cargo, telefono, whatsapp, email)
SELECT s.id, j.nombre, j.cargo, j.tel, j.wa, j.email FROM public.sucursales s
JOIN (VALUES
  ('QUITO',  'Carlos Mendoza Vargas',  'Jefe Zonal Sierra Norte', '022345678', '593987654321', 'cmendoza@farmasystem.ec'),
  ('GYE',    'María Fernanda Loor',    'Jefe Zonal Costa',         '042334455', '593998877665', 'mloor@farmasystem.ec'),
  ('CUE',    'Roberto Ávila Cárdenas', 'Jefe Zonal Sierra Sur',    '072811234', '593995544332', 'ravila@farmasystem.ec'),
  ('AMB',    'Lucía Salazar Naranjo',  'Jefe Zonal Centro',        '032844556', '593996677889', 'lsalazar@farmasystem.ec'),
  ('PTV',    'Jorge Cedeño Macías',    'Jefe Zonal Manabí',        '052633445', '593994411223', 'jcedeno@farmasystem.ec'),
  ('BODEGA', 'Andrea Pinto Cabrera',   'Jefe de Bodega Central',   '022999000', '593990001122', 'apinto@farmasystem.ec')
) AS j(cod,nombre,cargo,tel,wa,email) ON s.codigo = j.cod
WHERE NOT EXISTS (SELECT 1 FROM public.jefes_zona z WHERE z.sucursal_id = s.id);

-- 2. Plan de cuentas (skip existentes)
INSERT INTO public.plan_cuentas (codigo, nombre, tipo, naturaleza) VALUES
('1','ACTIVO','ACTIVO','DEUDORA'),
('1.1','ACTIVO CORRIENTE','ACTIVO','DEUDORA'),
('1.1.01','Caja General','ACTIVO','DEUDORA'),
('1.1.02','Caja Chica','ACTIVO','DEUDORA'),
('1.1.03','Bancos','ACTIVO','DEUDORA'),
('1.1.04','Cuentas por Cobrar Clientes','ACTIVO','DEUDORA'),
('1.1.05','IVA Pagado','ACTIVO','DEUDORA'),
('1.1.06','Inventario de Mercaderías','ACTIVO','DEUDORA'),
('1.2','ACTIVO NO CORRIENTE','ACTIVO','DEUDORA'),
('1.2.01','Muebles y Enseres','ACTIVO','DEUDORA'),
('1.2.02','Equipo de Computación','ACTIVO','DEUDORA'),
('1.2.03','Vehículos','ACTIVO','DEUDORA'),
('2','PASIVO','PASIVO','ACREEDORA'),
('2.1','PASIVO CORRIENTE','PASIVO','ACREEDORA'),
('2.1.01','Cuentas por Pagar Proveedores','PASIVO','ACREEDORA'),
('2.1.02','IVA Cobrado','PASIVO','ACREEDORA'),
('2.1.03','IESS por Pagar','PASIVO','ACREEDORA'),
('2.1.04','Sueldos por Pagar','PASIVO','ACREEDORA'),
('3','PATRIMONIO','PATRIMONIO','ACREEDORA'),
('3.1','Capital Social','PATRIMONIO','ACREEDORA'),
('3.2','Utilidad del Ejercicio','PATRIMONIO','ACREEDORA'),
('4','INGRESOS','INGRESO','ACREEDORA'),
('4.1','Ventas de Mercaderías','INGRESO','ACREEDORA'),
('4.2','Ingresos por Servicios','INGRESO','ACREEDORA'),
('5','GASTOS','GASTO','DEUDORA'),
('5.1','Costo de Ventas','GASTO','DEUDORA'),
('5.2','Sueldos y Salarios','GASTO','DEUDORA'),
('5.3','Servicios Básicos','GASTO','DEUDORA'),
('5.4','Arriendos','GASTO','DEUDORA'),
('5.5','Publicidad','GASTO','DEUDORA')
ON CONFLICT (codigo) DO NOTHING;

-- 3. Asientos contables
DO $$
DECLARE
  c_caja uuid; c_bancos uuid; c_iva_p uuid; c_iva_c uuid; c_inv uuid; c_cxc uuid; c_cxp uuid;
  c_vtas uuid; c_sueldos uuid; c_iess uuid; c_sxp uuid; c_serv uuid; c_arr uuid;
  a_id uuid; v_n int; v_num text;
BEGIN
  SELECT id INTO c_caja FROM public.plan_cuentas WHERE codigo='1.1.01';
  SELECT id INTO c_bancos FROM public.plan_cuentas WHERE codigo='1.1.03';
  SELECT id INTO c_iva_p FROM public.plan_cuentas WHERE codigo='1.1.05';
  SELECT id INTO c_inv FROM public.plan_cuentas WHERE codigo='1.1.06';
  SELECT id INTO c_cxc FROM public.plan_cuentas WHERE codigo='1.1.04';
  SELECT id INTO c_cxp FROM public.plan_cuentas WHERE codigo='2.1.01';
  SELECT id INTO c_iva_c FROM public.plan_cuentas WHERE codigo='2.1.02';
  SELECT id INTO c_iess FROM public.plan_cuentas WHERE codigo='2.1.03';
  SELECT id INTO c_sxp FROM public.plan_cuentas WHERE codigo='2.1.04';
  SELECT id INTO c_vtas FROM public.plan_cuentas WHERE codigo='4.1';
  SELECT id INTO c_sueldos FROM public.plan_cuentas WHERE codigo='5.2';
  SELECT id INTO c_serv FROM public.plan_cuentas WHERE codigo='5.3';
  SELECT id INTO c_arr FROM public.plan_cuentas WHERE codigo='5.4';

  FOR v_n IN 1..8 LOOP
    v_num := 'AS-2026-' || lpad(v_n::text,4,'0');
    CONTINUE WHEN EXISTS (SELECT 1 FROM public.asientos_contables WHERE numero = v_num);
    a_id := gen_random_uuid();
    INSERT INTO public.asientos_contables (id,numero,fecha,concepto,total_debe,total_haber) VALUES
      (a_id, v_num, (CURRENT_DATE - (v_n*5)),
       CASE v_n
         WHEN 1 THEN 'Venta de mercadería al contado factura FAC-001'
         WHEN 2 THEN 'Compra de medicamentos a proveedor Genfar'
         WHEN 3 THEN 'Pago de servicios básicos (luz, agua, internet)'
         WHEN 4 THEN 'Pago de arriendo local Quito Matriz'
         WHEN 5 THEN 'Provisión de sueldos del mes'
         WHEN 6 THEN 'Depósito bancario diario sucursal Guayaquil'
         WHEN 7 THEN 'Venta a crédito cliente corporativo'
         ELSE 'Pago de IESS aporte patronal y personal' END,
       0, 0);

    CASE v_n
      WHEN 1 THEN
        INSERT INTO public.asiento_detalle (asiento_id,cuenta_id,debe,haber) VALUES
          (a_id,c_caja,1150,0),(a_id,c_vtas,0,1000),(a_id,c_iva_c,0,150);
        UPDATE public.asientos_contables SET total_debe=1150,total_haber=1150 WHERE id=a_id;
      WHEN 2 THEN
        INSERT INTO public.asiento_detalle (asiento_id,cuenta_id,debe,haber) VALUES
          (a_id,c_inv,2000,0),(a_id,c_iva_p,300,0),(a_id,c_cxp,0,2300);
        UPDATE public.asientos_contables SET total_debe=2300,total_haber=2300 WHERE id=a_id;
      WHEN 3 THEN
        INSERT INTO public.asiento_detalle (asiento_id,cuenta_id,debe,haber) VALUES
          (a_id,c_serv,450,0),(a_id,c_bancos,0,450);
        UPDATE public.asientos_contables SET total_debe=450,total_haber=450 WHERE id=a_id;
      WHEN 4 THEN
        INSERT INTO public.asiento_detalle (asiento_id,cuenta_id,debe,haber) VALUES
          (a_id,c_arr,1200,0),(a_id,c_bancos,0,1200);
        UPDATE public.asientos_contables SET total_debe=1200,total_haber=1200 WHERE id=a_id;
      WHEN 5 THEN
        INSERT INTO public.asiento_detalle (asiento_id,cuenta_id,debe,haber) VALUES
          (a_id,c_sueldos,5000,0),(a_id,c_iess,0,472.50),(a_id,c_sxp,0,4527.50);
        UPDATE public.asientos_contables SET total_debe=5000,total_haber=5000 WHERE id=a_id;
      WHEN 6 THEN
        INSERT INTO public.asiento_detalle (asiento_id,cuenta_id,debe,haber) VALUES
          (a_id,c_bancos,3500,0),(a_id,c_caja,0,3500);
        UPDATE public.asientos_contables SET total_debe=3500,total_haber=3500 WHERE id=a_id;
      WHEN 7 THEN
        INSERT INTO public.asiento_detalle (asiento_id,cuenta_id,debe,haber) VALUES
          (a_id,c_cxc,920,0),(a_id,c_vtas,0,800),(a_id,c_iva_c,0,120);
        UPDATE public.asientos_contables SET total_debe=920,total_haber=920 WHERE id=a_id;
      ELSE
        INSERT INTO public.asiento_detalle (asiento_id,cuenta_id,debe,haber) VALUES
          (a_id,c_iess,945,0),(a_id,c_bancos,0,945);
        UPDATE public.asientos_contables SET total_debe=945,total_haber=945 WHERE id=a_id;
    END CASE;
  END LOOP;
END $$;

-- 4. Ajustes de inventario
INSERT INTO public.ajustes_inventario (producto_id, tipo, cantidad, motivo, fecha)
SELECT p.id, x.tipo, x.cant, x.motivo, CURRENT_DATE - x.dias
FROM (VALUES
  ('MED001','SALIDA',5,'Producto vencido descartado',2),
  ('MED004','ENTRADA',50,'Reposición desde bodega central',5),
  ('MED006','ENTRADA',30,'Compra urgente proveedor local',7),
  ('MED008','SALIDA',2,'Rotura accidental en estantería',10),
  ('MED010','ENTRADA',20,'Transferencia desde sucursal Guayaquil',12),
  ('MED012','SALIDA',3,'Donación campaña salud comunitaria',15),
  ('MED015','ENTRADA',40,'Reposición programada mensual',20)
) AS x(cod,tipo,cant,motivo,dias)
JOIN public.productos p ON p.codigo = x.cod
WHERE NOT EXISTS (SELECT 1 FROM public.ajustes_inventario WHERE producto_id = p.id AND motivo = x.motivo);

-- 5. RPC: ventas por provincia (suma facturas + agrupa por sucursal/provincia)
CREATE OR REPLACE FUNCTION public.arq_ventas_por_provincia()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  s text; out_arr jsonb := '[]'::jsonb;
  schemas text[][] := ARRAY[
    ARRAY['sucursal_quito','Pichincha','Quito (Matriz)','-0.18','-78.47','QUITO'],
    ARRAY['sucursal_guayaquil','Guayas','Guayaquil','-2.17','-79.92','GYE'],
    ARRAY['sucursal_cuenca','Azuay','Cuenca','-2.90','-79.00','CUE'],
    ARRAY['sucursal_ambato','Tungurahua','Ambato','-1.25','-78.62','AMB'],
    ARRAY['sucursal_portoviejo','Manabí','Portoviejo','-1.05','-80.45','PTV']
  ];
  i int; n_fac int; v_total numeric;
BEGIN
  FOR i IN 1..array_length(schemas,1) LOOP
    EXECUTE format('SELECT count(*) FILTER (WHERE estado_fac=''EMI''), COALESCE(sum(fac_total) FILTER (WHERE estado_fac=''EMI''),0) FROM %I.ven_facturas', schemas[i][1])
      INTO n_fac, v_total;
    out_arr := out_arr || jsonb_build_array(jsonb_build_object(
      'schema', schemas[i][1], 'provincia', schemas[i][2], 'ciudad', schemas[i][3],
      'lat', schemas[i][4]::numeric, 'lng', schemas[i][5]::numeric, 'codigo', schemas[i][6],
      'facturas', n_fac, 'ventas', v_total
    ));
  END LOOP;
  RETURN out_arr;
END $$;
GRANT EXECUTE ON FUNCTION public.arq_ventas_por_provincia() TO authenticated, anon;

-- 6. RPC: productos más y menos vendidos
CREATE OR REPLACE FUNCTION public.arq_ranking_productos()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r jsonb;
BEGIN
  SELECT jsonb_agg(t ORDER BY total_vendido DESC) INTO r FROM (
    SELECT p.id, p.codigo, p.nombre, p.precio_venta, p.stock,
           COALESCE(sum(d.cantidad),0)::int total_vendido,
           COALESCE(sum(d.subtotal),0)::numeric ingresos
    FROM productos p
    LEFT JOIN fac_detalle d ON d.producto_id = p.id
    LEFT JOIN facturas f ON f.id = d.factura_id AND f.estado <> 'ANULADA'
    GROUP BY p.id
  ) t;
  RETURN COALESCE(r,'[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.arq_ranking_productos() TO authenticated, anon;
