import { createServerFn } from "@tanstack/react-start";

// Lee cada esquema con el admin client (las tablas viven fuera de `public`).
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ---------- CENTRALIZADA (public) ----------
export const getCentralizada = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [productos, clientes, facturas, empleados, proveedores] = await Promise.all([
    sb.from("productos").select("*", { count: "exact", head: true }),
    sb.from("clientes").select("*", { count: "exact", head: true }),
    sb.from("facturas").select("total,estado,fecha"),
    sb.from("empleados").select("*", { count: "exact", head: true }),
    sb.from("proveedores").select("*", { count: "exact", head: true }),
  ]);
  const ventas = (facturas.data ?? [])
    .filter((f: any) => f.estado !== "ANULADA")
    .reduce((s: number, f: any) => s + Number(f.total ?? 0), 0);
  return {
    productos: productos.count ?? 0,
    clientes: clientes.count ?? 0,
    facturas: facturas.data?.length ?? 0,
    empleados: empleados.count ?? 0,
    proveedores: proveedores.count ?? 0,
    ventas_total: ventas,
  };
});

// ---------- DISTRIBUIDA (5 sucursales) ----------
const SUCS = [
  { schema: "sucursal_quito",      nombre: "Quito (Matriz)",  ciudad: "Quito",      color: "#3b82f6" },
  { schema: "sucursal_guayaquil",  nombre: "Guayaquil",        ciudad: "Guayaquil",  color: "#ef4444" },
  { schema: "sucursal_cuenca",     nombre: "Cuenca",           ciudad: "Cuenca",     color: "#10b981" },
  { schema: "sucursal_ambato",     nombre: "Ambato",           ciudad: "Ambato",     color: "#f59e0b" },
  { schema: "sucursal_portoviejo", nombre: "Portoviejo",       ciudad: "Portoviejo", color: "#8b5cf6" },
];

export const getDistribuida = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb.rpc("arq_distribuida_detalle" as any);
  if (error) throw error;
  const rows = (data ?? []) as Array<{ schema: string; clientes: number; facturas: number; facturas_anuladas: number; ventas_total: number }>;
  return SUCS.map((s) => {
    const r = rows.find((x) => x.schema === s.schema);
    return {
      ...s,
      clientes: Number(r?.clientes ?? 0),
      facturas: Number(r?.facturas ?? 0),
      facturas_anuladas: Number(r?.facturas_anuladas ?? 0),
      ventas_total: Number(r?.ventas_total ?? 0),
    };
  });
});

// ---------- BODEGA (vertical) ----------
export const getBodega = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb.rpc("arq_bodega_detalle" as any);
  if (error) throw error;
  const d = (data ?? {}) as any;
  return {
    productos: d.productos ?? [],
    movimientos: d.movimientos ?? [],
    stock_total: Number(d.stock_total ?? 0),
    valor_total: Number(d.valor_total ?? 0),
  };
});

// ---------- NUBE ----------
export const getNube = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb.rpc("arq_nube_detalle" as any);
  if (error) throw error;
  const d = (data ?? {}) as any;
  return {
    productos: d.productos ?? [],
    clientes_count: Number(d.clientes_count ?? 0),
    pedidos: d.pedidos ?? [],
    ventas_total: Number(d.ventas_total ?? 0),
    por_estado: d.por_estado ?? {},
  };
});


// ---------- COMPARATIVA GLOBAL ----------
export const getResumenGlobal = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb.rpc("arq_resumen_global" as any);
  if (error) throw error;
  return data as any;
});

// ---------- BUSCADOR DE DISPONIBILIDAD CROSS-SUCURSAL ----------
export const buscarDisponibilidad = createServerFn({ method: "POST" })
  .inputValidator((d: { termino: string }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: rows, error } = await sb.rpc("arq_buscar_disponibilidad" as any, { p_query: data.termino });
    if (error) throw error;
    const items = (rows ?? []) as Array<{ sucursal: string; codigo: string; nombre: string; precio: number; stock: number }>;
    // Agrupar por producto
    const porProducto: Record<string, { codigo: string; nombre: string; sucursales: Array<{ sucursal: string; precio: number; stock: number }> }> = {};
    items.forEach((r) => {
      const k = r.codigo;
      if (!porProducto[k]) porProducto[k] = { codigo: r.codigo, nombre: r.nombre, sucursales: [] };
      porProducto[k].sucursales.push({ sucursal: r.sucursal, precio: Number(r.precio), stock: Number(r.stock) });
    });
    return { productos: Object.values(porProducto) };
  });

// ---------- NOSQL (estilo MongoDB con JSONB) ----------
export const getNoSQL = createServerFn({ method: "POST" })
  .inputValidator((d: { collection: string; limit?: number }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: docs, error } = await sb.rpc("arq_nosql_query" as any, { p_collection: data.collection, p_limit: data.limit ?? 50 });
    if (error) {
      console.error("NoSQL query failed", error);
      return [];
    }
    return (docs ?? []) as Array<{ _id: string; doc: any; created_at: string }>;
  });

export const getNoSQLResumen = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb.rpc("arq_nosql_resumen" as any);
  if (error) {
    console.error("NoSQL summary failed", error);
    return { total: 0, colecciones: {} };
  }
  const r = (data ?? {}) as { total?: number; colecciones?: Record<string, number> };
  return { total: r.total ?? 0, colecciones: r.colecciones ?? {} };
});

