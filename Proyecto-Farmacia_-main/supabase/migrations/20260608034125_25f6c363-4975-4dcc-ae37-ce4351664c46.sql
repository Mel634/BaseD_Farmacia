
CREATE OR REPLACE FUNCTION public.arq_nube_detalle()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE prods jsonb; peds jsonb; cli int; vt numeric; estados jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.prd_sku),'[]'::jsonb) INTO prods FROM cloud_ecommerce.cl_productos p;
  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.ped_fecha DESC),'[]'::jsonb) INTO peds
    FROM (SELECT * FROM cloud_ecommerce.cl_pedidos ORDER BY ped_fecha DESC) x;
  SELECT count(*) INTO cli FROM cloud_ecommerce.cl_clientes;
  SELECT COALESCE(sum(ped_total),0) INTO vt FROM cloud_ecommerce.cl_pedidos WHERE ped_estado<>'CAN';
  SELECT COALESCE(jsonb_object_agg(ped_estado, c),'{}'::jsonb) INTO estados
    FROM (SELECT ped_estado, count(*) c FROM cloud_ecommerce.cl_pedidos GROUP BY ped_estado) z;
  RETURN jsonb_build_object('productos',prods,'pedidos',peds,'clientes_count',cli,'ventas_total',vt,'por_estado',estados);
END $$;
