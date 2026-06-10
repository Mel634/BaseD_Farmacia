CREATE OR REPLACE FUNCTION public.arq_nosql_resumen()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb; t int;
BEGIN
  SELECT count(*) INTO t FROM nosql_mongo.documents;
  SELECT COALESCE(jsonb_object_agg(collection, c), '{}'::jsonb) INTO r
    FROM (SELECT collection, count(*) c FROM nosql_mongo.documents GROUP BY collection) z;
  RETURN jsonb_build_object('total', t, 'colecciones', r);
END $$;
GRANT EXECUTE ON FUNCTION public.arq_nosql_resumen() TO authenticated, anon;