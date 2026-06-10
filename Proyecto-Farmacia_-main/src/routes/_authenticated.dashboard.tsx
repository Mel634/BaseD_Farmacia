import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import {
  Package, Users, Receipt, DollarSign, ShoppingCart,
  AlertTriangle, TrendingUp, FileText,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const q = useQuery({
    queryKey: ["dashboard-exec"],
    queryFn: async () => {
      const [prods, clis, emps, facs, ocs] = await Promise.all([
        supabase.from("productos").select("id,codigo,nombre,stock,stock_minimo,precio_venta,categoria"),
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase.from("empleados").select("id", { count: "exact", head: true }),
        supabase.from("facturas").select("total,estado,fecha,cliente_id"),
        supabase.from("ordenes_compra").select("total,estado"),
      ]);
      const productos = prods.data ?? [];
      const facturas = facs.data ?? [];
      const ordenes = ocs.data ?? [];
      const mesActual = new Date().toISOString().slice(0, 7);
      const ventasMes = facturas
        .filter((f: any) => f.estado !== "ANULADA" && String(f.fecha).startsWith(mesActual))
        .reduce((a: number, f: any) => a + Number(f.total), 0);
      const ventasTotal = facturas
        .filter((f: any) => f.estado !== "ANULADA")
        .reduce((a: number, f: any) => a + Number(f.total), 0);
      const comprasTotal = ordenes
        .filter((o: any) => o.estado !== "ANULADA")
        .reduce((a: number, o: any) => a + Number(o.total), 0);
      const ocPendientes = ordenes.filter((o: any) => o.estado === "PENDIENTE").length;
      const stockBajo = productos.filter((p: any) => Number(p.stock) <= Number(p.stock_minimo));
      const resumenFinanciero = [
        { concepto: "Ventas mes", valor: ventasMes },
        { concepto: "Ventas total", valor: ventasTotal },
        { concepto: "Compras", valor: comprasTotal },
      ];
      return {
        productos: productos.length,
        clientes: clis.count ?? 0,
        empleados: emps.count ?? 0,
        facturas: facturas.length,
        facturasAnuladas: facturas.filter((f: any) => f.estado === "ANULADA").length,
        ventasMes,
        ventasTotal,
        comprasTotal,
        ocPendientes,
        stockBajo,
        ventasPorEstado: facturas.reduce((acc: any[], f: any) => {
          const ex = acc.find(x => x.estado === f.estado);
          if (ex) ex.cantidad++;
          else acc.push({ estado: f.estado, cantidad: 1 });
          return acc;
        }, []),
        topProductosPrecio: [...(prods.data ?? [])]
          .sort((a: any, b: any) => Number(b.precio_venta) - Number(a.precio_venta))
          .slice(0, 5)
          .map((p: any) => ({ nombre: p.nombre.slice(0, 12), precio: Number(p.precio_venta) })),
        stockPorCategoria: (prods.data ?? []).reduce((acc: any[], p: any) => {
          const cat = p.categoria ?? "Sin categoria";
          const ex = acc.find(x => x.categoria === cat);
          if (ex) ex.stock += Number(p.stock);
          else acc.push({ categoria: cat, stock: Number(p.stock) });
          return acc;
        }, []).slice(0, 6),
        sparklineVentas: (() => {
          const meses: Record<string, number> = {};
          facturas
            .filter((f: any) => f.estado !== "ANULADA")
            .forEach((f: any) => {
              const mes = String(f.fecha).slice(0, 7);
              meses[mes] = (meses[mes] ?? 0) + Number(f.total);
            });
          return Object.entries(meses)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([mes, total]) => ({ mes: mes.slice(5), total }));
        })(),
        resumenFinanciero,
      };
    },
  });

  const Kpi = ({ icon: Icon, label, value, color, sub }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );

  const d = q.data;
  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Ejecutivo" subtitle="Resumen operativo y financiero de FarmaSystem" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={TrendingUp} label="Ventas del mes" value={fmt(d?.ventasMes ?? 0)} color="text-emerald-500" sub="Mes en curso" />
        <Kpi icon={DollarSign} label="Ventas totales" value={fmt(d?.ventasTotal ?? 0)} color="text-purple-500" sub={`${d?.facturas ?? 0} facturas`} />
        <Kpi icon={ShoppingCart} label="Compras totales" value={fmt(d?.comprasTotal ?? 0)} color="text-orange-500" sub={`${d?.ocPendientes ?? 0} OC pendientes`} />
        <Kpi icon={AlertTriangle} label="Stock bajo" value={d?.stockBajo.length ?? 0} color="text-red-500" sub="Productos en alerta" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={Package} label="Productos" value={d?.productos ?? 0} color="text-blue-500" />
        <Kpi icon={Users} label="Clientes" value={d?.clientes ?? 0} color="text-green-500" />
        <Kpi icon={Users} label="Empleados" value={d?.empleados ?? 0} color="text-indigo-500" />
        <Kpi icon={FileText} label="Facturas anuladas" value={d?.facturasAnuladas ?? 0} color="text-gray-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Alerta de Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!d?.stockBajo.length ? (
              <p className="text-sm text-muted-foreground">Sin productos bajo el mínimo 👌</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Código</TableHead><TableHead>Producto</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Mín.</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {d.stockBajo.slice(0, 8).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                      <TableCell>{p.nombre}</TableCell>
                      <TableCell className="text-right"><Badge variant="destructive">{p.stock}</Badge></TableCell>
                      <TableCell className="text-right text-muted-foreground">{p.stock_minimo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-purple-500" /> Accesos rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Link to="/facturas" className="border rounded-md p-3 hover:bg-muted/50 transition">
              <div className="font-semibold">Nueva factura</div>
              <div className="text-xs text-muted-foreground">Emitir venta a cliente</div>
            </Link>
            <Link to="/ordenes-compra" className="border rounded-md p-3 hover:bg-muted/50 transition">
              <div className="font-semibold">Nueva OC</div>
              <div className="text-xs text-muted-foreground">Compra a proveedor</div>
            </Link>
            <Link to="/ajustes-inventario" className="border rounded-md p-3 hover:bg-muted/50 transition">
              <div className="font-semibold">Ajuste inventario</div>
              <div className="text-xs text-muted-foreground">Entrada / salida manual</div>
            </Link>
            <Link to="/arq/comparativa" className="border rounded-md p-3 hover:bg-muted/50 transition">
              <div className="font-semibold">Arquitecturas DB</div>
              <div className="text-xs text-muted-foreground">Comparativa académica</div>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* GRAFICO 1 — Barras: Facturas por estado */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Facturas por Estado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d?.ventasPorEstado ?? []}>
                <XAxis dataKey="estado" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GRAFICO 2 — Sparkline (Area): Tendencia de ventas últimos 6 meses */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Tendencia de Ventas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={d?.sparklineVentas ?? []}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                <Area type="monotone" dataKey="total" stroke="#6366f1"
                  strokeWidth={2} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GRAFICO 3 — Radar: Stock por categoría */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Stock por Categoría</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={d?.stockPorCategoria ?? []}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <PolarGrid />
                <PolarAngleAxis dataKey="categoria" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fontSize: 8 }} />
                <Radar name="Stock" dataKey="stock" stroke="#f59e0b"
                  fill="#f59e0b" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
