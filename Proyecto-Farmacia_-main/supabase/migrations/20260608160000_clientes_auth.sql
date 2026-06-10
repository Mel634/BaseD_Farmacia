-- Vincular clientes de la tienda con cuentas de autenticación
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clientes_auth_user_id_idx
  ON public.clientes(auth_user_id) WHERE auth_user_id IS NOT NULL;
