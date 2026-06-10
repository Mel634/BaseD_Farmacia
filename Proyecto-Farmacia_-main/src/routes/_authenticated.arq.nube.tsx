import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getNube } from "@/lib/arq.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PrintButton } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/arq/nube")({ component: Page });

const ESTADO_BADGE: Record<string, { label: string; cls: string }> = {
  PEN: { label: "Pendiente", cls: "bg-amber-500" },
  PAG: { label: "Pagado",    cls: "bg-blue-500" },
  ENV: { label: "Enviado",   cls: "bg-indigo-500" },
  ENT: { label: "Entregado", cls: "bg-green-600" },
  CAN: { label: "Cancelado", cls: "bg-red-500" },
};

function Page() {
  const fn = useServerFn(getNube);
  const { data, isLoading } = useQuery({ queryKey: ["arq-nube"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <PageHeader title="☁️ Arquitectura en la Nube" subtitle="Catálogo público y pedidos eCommerce — esquema cloud_ecommerce" actions={<PrintButton />} />

      <Card className="bg-blue-50 border-blue-300">
        <CardHeader><CardTitle>Concepto · Servicio en la nube</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Esta capa expone el <b>catálogo público</b> y maneja los <b>pedidos online</b> de clientes finales. Está desacoplada del ERP interno: el cliente final nunca toca facturas ni nómina; el ERP recibe los pedidos como órdenes pendientes de despacho.</p>
          <p className="text-xs font-mono text-muted-foreground">Esquema: cloud_ecommerce · Tablas: cl_productos, cl_clientes, cl_pedidos, cl_pedidos_det</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50"><CardContent className="p-4"><div className="text-xs">Productos publicados</div><div className="text-2xl font-bold">{isLoading ? "…" : data?.productos.length ?? 0}</div></CardContent></Card>
        <Card className="bg-green-50"><CardContent className="p-4"><div className="text-xs">Clientes registrados</div><div className="text-2xl font-bold">{isLoading ? "…" : data?.clientes_count ?? 0}</div></CardContent></Card>
        <Card className="bg-amber-50"><CardContent className="p-4"><div className="text-xs">Pedidos totales</div><div className="text-2xl font-bold">{isLoading ? "…" : data?.pedidos.length ?? 0}</div></CardContent></Card>
        <Card className="bg-rose-50"><CardContent className="p-4"><div className="text-xs">Ventas online</div><div className="text-2xl font-bold">${(data?.ventas_total ?? 0).toFixed(2)}</div></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Catálogo publicado</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Producto</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Stock</TableHead></TableRow></TableHeader>
              <TableBody>
                {(data?.productos ?? []).map((p: any) => (
                  <TableRow key={p.id_producto}>
                    <TableCell className="font-mono text-xs">{p.prd_codigo}</TableCell>
                    <TableCell>{p.prd_nombre}</TableCell>
                    <TableCell className="text-right">${Number(p.prd_precio).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{p.prd_stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Últimos pedidos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>
                {(data?.pedidos ?? []).slice(0, 15).map((p: any) => {
                  const b = ESTADO_BADGE[p.ped_estado] ?? { label: p.ped_estado, cls: "bg-gray-500" };
                  return (
                    <TableRow key={p.id_pedido}>
                      <TableCell className="font-mono text-xs">{p.ped_numero}</TableCell>
                      <TableCell className="text-xs">{new Date(p.ped_fecha).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">${Number(p.ped_total).toFixed(2)}</TableCell>
                      <TableCell><Badge className={b.cls}>{b.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader><CardTitle className="text-green-900">✅ Ventajas</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-green-900">
            <p>• Escalabilidad elástica automática</p>
            <p>• Alta disponibilidad multi-región</p>
            <p>• Sin gestión de infraestructura</p>
            <p>• Pago por uso · CDN integrado</p>
            <p>• Backups automáticos</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader><CardTitle className="text-red-900">❌ Desventajas</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-red-900">
            <p>• Dependencia del proveedor (vendor lock-in)</p>
            <p>• Costos variables impredecibles</p>
            <p>• Requiere internet permanente</p>
            <p>• Datos sensibles fuera del país</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
