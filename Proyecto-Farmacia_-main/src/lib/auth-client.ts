import { supabase } from "@/integrations/supabase/client";
import { esCorreoPersonal } from "@/lib/auth-constants";

/** true = puede usar el ERP (personal autorizado con perfil). */
export async function esSesionPersonal(userId: string, email?: string | null): Promise<boolean> {
  if (!email || !esCorreoPersonal(email)) return false;
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  return !!profile;
}

/** true = puede comprar en la tienda (cliente registrado, no personal). */
export async function esSesionCliente(userId: string, email?: string | null): Promise<boolean> {
  if (!email) return false;
  if (esCorreoPersonal(email)) return false;
  if (await esSesionPersonal(userId, email)) return false;
  const { data: cliente } = await supabase.from("clientes").select("id").ilike("email", email).maybeSingle();
  return !!cliente;
}
