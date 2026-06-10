
-- Detalle por sucursal (distribuida)
CREATE OR REPLACE FUNCTION public.arq_distribuida_detalle()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  s text;
  schemas text[] := ARRAY['sucursal_quito','sucursal_guayaquil','sucursal_cuenca','sucursal_ambato','sucursal_portoviejo'];
  cli int; emi int; anu int; tot numeric;
  result jsonb := '[]'::jsonb;
BEGIN
  FOREACH s IN ARRAY schemas LOOP
    EXECUTE format('SELECT count(*) FROM %I.ven_clientes', s) INTO cli;
    EXECUTE format('SELECT count(*) FILTER (WHERE estado_fac=''EMI''), count(*) FILTER (WHERE estado_fac<>''EMI''), COALESCE(sum(fac_total) FILTER (WHERE estado_fac=''EMI''),0) FROM %I.ven_facturas', s) INTO emi, anu, tot;
    result := result || jsonb_build_array(jsonb_build_object(
      'schema', s, 'clientes', cli, 'facturas', emi, 'facturas_anuladas', anu, 'ventas_total', tot
    ));
  END LOOP;
  RETURN result;
END $$;

-- Bodega
CREATE OR REPLACE FUNCTION public.arq_bodega_detalle()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE prods jsonb; movs jsonb; st numeric; vt numeric;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.prd_codigo),'[]'::jsonb), COALESCE(sum(p.prd_stock),0), COALESCE(sum(p.prd_stock*p.prd_costo),0)
    INTO prods, st, vt FROM bodega_central.inv_productos p;
  SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.mov_fecha DESC),'[]'::jsonb) INTO movs
    FROM (SELECT * FROM bodega_central.inv_movimientos ORDER BY mov_fecha DESC LIMIT 20) m;
  RETURN jsonb_build_object('productos',prods,'movimientos',movs,'stock_total',st,'valor_total',vt);
END $$;

-- Nube
CREATE OR REPLACE FUNCTION public.arq_nube_detalle()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE prods jsonb; peds jsonb; cli int; vt numeric; estados jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.prd_codigo),'[]'::jsonb) INTO prods FROM cloud_ecommerce.cl_productos p;
  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.ped_fecha DESC),'[]'::jsonb) INTO peds
    FROM (SELECT * FROM cloud_ecommerce.cl_pedidos ORDER BY ped_fecha DESC) x;
  SELECT count(*) INTO cli FROM cloud_ecommerce.cl_clientes;
  SELECT COALESCE(sum(ped_total),0) INTO vt FROM cloud_ecommerce.cl_pedidos WHERE ped_estado<>'CAN';
  SELECT COALESCE(jsonb_object_agg(ped_estado, c),'{}'::jsonb) INTO estados
    FROM (SELECT ped_estado, count(*) c FROM cloud_ecommerce.cl_pedidos GROUP BY ped_estado) z;
  RETURN jsonb_build_object('productos',prods,'pedidos',peds,'clientes_count',cli,'ventas_total',vt,'por_estado',estados);
END $$;

GRANT EXECUTE ON FUNCTION public.arq_distribuida_detalle() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.arq_bodega_detalle() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.arq_nube_detalle() TO authenticated, anon;
