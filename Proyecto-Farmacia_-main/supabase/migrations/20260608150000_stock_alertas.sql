-- Registro de alertas de stock bajo enviadas (evita spam de WhatsApp)
CREATE TABLE IF NOT EXISTS public.stock_alertas (
  producto_id uuid PRIMARY KEY REFERENCES public.productos(id) ON DELETE CASCADE,
  stock_alerta integer NOT NULL,
  notificado_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_alertas TO service_role;
GRANT SELECT ON public.stock_alertas TO authenticated;
