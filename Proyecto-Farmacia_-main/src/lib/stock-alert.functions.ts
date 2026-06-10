import { createServerFn } from "@tanstack/react-start";
import { enviarTelegram, mensajeStockBajo, UMBRAL_STOCK } from "@/lib/telegram";

export async function verificarAlertasStockInterno(productoIds: string[]) {
  if (!productoIds.length) return { enviados: [] as string[] };

  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const enviados: string[] = [];

  const ids = [...new Set(productoIds)];
  const { data: productos, error } = await sb
    .from("productos")
    .select("id, codigo, nombre, stock")
    .in("id", ids);

  if (error) throw error;

  for (const p of productos ?? []) {
    if (p.stock > UMBRAL_STOCK) {
      try {
        await sb.from("stock_alertas" as never).delete().eq("producto_id", p.id);
      } catch { /* tabla opcional */ }
      continue;
    }

    try {
      const { data: prev } = await sb
        .from("stock_alertas" as never)
        .select("producto_id")
        .eq("producto_id", p.id)
        .maybeSingle();
      if (prev) continue;
    } catch { /* continuar */ }

    const mensaje = mensajeStockBajo(p.codigo, p.nombre, p.stock);
    const ok = await enviarTelegram(mensaje);

    try {
      await sb.from("stock_alertas" as never).upsert({
        producto_id: p.id,
        stock_alerta: p.stock,
        notificado_at: new Date().toISOString(),
      });
    } catch { /* tabla opcional */ }

    if (ok) enviados.push(p.nombre);
  }

  return { enviados };
}

export const verificarAlertasStock = createServerFn({ method: "POST" })
  .inputValidator((d: { productoIds: string[] }) => d)
  .handler(async ({ data }) => verificarAlertasStockInterno(data.productoIds));
