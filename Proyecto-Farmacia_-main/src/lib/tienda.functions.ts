import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verificarAlertasStockInterno } from "@/lib/stock-alert.functions";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// Catálogo público para la tienda
export const listarProductosTienda = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("productos")
    .select("id, codigo, nombre, descripcion, categoria, precio_venta, stock, activo")
    .eq("activo", true)
    .gt("stock", 0)
    .order("nombre");
  if (error) throw error;
  return data ?? [];
});

// Perfil del cliente autenticado (para prellenar checkout)
export const obtenerPerfilCliente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await admin();
    if (!context.claims?.email) return null;

    const { data: cliente } = await sb
      .from("clientes")
      .select("cedula, nombre_completo, email, telefono, direccion")
      .ilike("email", String(context.claims.email))
      .maybeSingle();

    return cliente ?? null;
  });

// Historial de compras del cliente autenticado
export const listarMisPedidos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await admin();
    if (!context.claims?.email) return [];

    const { data: cliente } = await sb
      .from("clientes")
      .select("id")
      .ilike("email", String(context.claims.email))
      .maybeSingle();
    if (!cliente) return [];

    const { data: facturas, error } = await sb
      .from("facturas")
      .select("id, numero, fecha, subtotal, iva, total, estado, created_at")
      .eq("cliente_id", cliente.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!facturas?.length) return [];

    const ids = facturas.map((f) => f.id);
    const { data: detalles } = await sb
      .from("fac_detalle")
      .select("factura_id, cantidad, subtotal, productos(codigo, nombre)")
      .in("factura_id", ids);

    return facturas.map((f) => ({
      ...f,
      items: (detalles ?? [])
        .filter((d: any) => d.factura_id === f.id)
        .map((d: any) => ({
          cantidad: d.cantidad,
          subtotal: Number(d.subtotal),
          codigo: d.productos?.codigo,
          nombre: d.productos?.nombre,
        })),
    }));
  });

// Crear pedido — descuenta stock y crea factura
export const crearPedidoTienda = createServerFn({ method: "POST" })
  .inputValidator((d: {
    cliente: { cedula: string; nombre: string; email: string; telefono: string; direccion: string };
    items: { id: string; cantidad: number }[];
    authUserId?: string;
  }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();

    let clienteId: string;
    const { data: ex } = await sb.from("clientes").select("id").eq("cedula", data.cliente.cedula).maybeSingle();
    if (ex) {
      clienteId = ex.id;
      await sb.from("clientes").update({
        nombre_completo: data.cliente.nombre,
        email: data.cliente.email,
        telefono: data.cliente.telefono,
        direccion: data.cliente.direccion,
      }).eq("id", clienteId);
    } else {
      const { data: nuevo, error: e1 } = await sb.from("clientes").insert({
        cedula: data.cliente.cedula,
        nombre_completo: data.cliente.nombre,
        email: data.cliente.email,
        telefono: data.cliente.telefono,
        direccion: data.cliente.direccion,
      }).select("id").single();
      if (e1) throw e1;
      clienteId = nuevo!.id;
    }

    // armar items con precio actual
    const ids = data.items.map((x) => x.id);
    const { data: prods, error: e2 } = await sb.from("productos").select("id,precio_venta,stock,nombre").in("id", ids);
    if (e2) throw e2;

    const itemsRpc = data.items.map((it) => {
      const p = prods!.find((x) => x.id === it.id)!;
      if (it.cantidad > p.stock) throw new Error(`Stock insuficiente para ${p.nombre}`);
      return { producto_id: it.id, cantidad: it.cantidad, precio_unitario: Number(p.precio_venta) };
    });

    const { data: facId, error: e3 } = await sb.rpc("proc_factura" as any, {
      p_cliente_id: clienteId, p_items: itemsRpc,
    });
    if (e3) throw e3;

    const { data: fac } = await sb.from("facturas").select("numero,total").eq("id", facId).single();

    try {
      await verificarAlertasStockInterno(data.items.map((it) => it.id));
    } catch (e) {
      console.error("[stock-alert] Error al verificar alertas:", e);
    }

    return { facturaId: facId, numero: fac?.numero, total: Number(fac?.total ?? 0) };
  });

// Ventas por provincia (para mapa)
export const getVentasProvincia = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [vp, jefes] = await Promise.all([
    sb.rpc("arq_ventas_por_provincia" as any),
    sb.from("jefes_zona").select("*, sucursales(codigo,nombre,provincia,ciudad)"),
  ]);
  if (vp.error) throw vp.error;
  const rows = (vp.data ?? []) as Array<{ codigo: string; provincia: string; ciudad: string; lat: number; lng: number; facturas: number; ventas: number }>;
  const jefesByCodigo: Record<string, any> = {};
  (jefes.data ?? []).forEach((j: any) => {
    const cod = j.sucursales?.codigo;
    if (cod) jefesByCodigo[cod] = j;
  });
  return rows.map((r) => ({ ...r, jefe: jefesByCodigo[r.codigo] ?? null }));
});

// Ranking productos (más / menos vendidos)
export const getRankingProductos = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb.rpc("arq_ranking_productos" as any);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; codigo: string; nombre: string; precio_venta: number; stock: number; total_vendido: number; ingresos: number }>;
});
