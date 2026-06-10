import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getVentasProvincia, getRankingProductos } from "@/lib/tienda.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, PrintButton } from "@/components/PageHeader";
import { useState, useMemo } from "react";
import { Phone, Mail, MessageCircle, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import ecuadorMap from "@/assets/ecuador-map.jpg";

export const Route = createFileRoute("/_authenticated/ventas-provincia")({ component: Page });

// Coordenadas relativas (en %) sobre la imagen del mapa de Ecuador
const POS: Record<string, { top: string; left: string }> = {
  QUITO:  { top: "26%", left: "42%" },
  GYE:    { top: "62%", left: "33%" },
  CUE:    { top: "75%", left: "48%" },
  AMB:    { top: "44%", left: "44%" },
  PTV:    { top: "50%", left: "26%" },
};

function Page() {
  const fnVp = useServerFn(getVentasProvincia);
  const fnRk = useServerFn(getRankingProductos);
  const { data: provs = [] } = useQuery({ queryKey: ["ventas-provincia"], queryFn: () => fnVp() });
  const { data: ranking = [] } = useQuery({ queryKey: ["ranking-prod"], queryFn: () => fnRk() });

  const [sel, setSel] = useState<any>(null);

  const promedioVentas = useMemo(() => {
    const ventas = provs.map((p: any) => Number(p.ventas));
    return ventas.length ? ventas.reduce((s, x) => s + x, 0) / ventas.length : 0;
  }, [provs]);

  // Top y flop
  const top = ranking.slice(0, 10);
  const flop = [...ranking].filter((r: any) => r.total_vendido === 0 || r.total_vendido < 3).slice(0, 10);
  const maxVtas = Math.max(...provs.map((p: any) => Number(p.ventas)), 1);

  return (
    <div className="space-y-6">
      <PageHeader title="🗺️ Ventas por Provincia" subtitle="Distribución geográfica de la red de sucursales + ranking de productos" actions={<PrintButton />} />

      {/* Mapa interactivo */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de sucursales · Ecuador</CardTitle>
          <p className="text-xs text-muted-foreground">Doble clic en una sucursal para ver el detalle y contactar al jefe de zona.</p>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-[1fr,320px] gap-6">
            {/* Mapa */}
            <div className="relative bg-amber-50 rounded-lg overflow-hidden border-2 border-amber-200" style={{ aspectRatio: "1/1", maxWidth: 600 }}>
              <img src={ecuadorMap} alt="Mapa de Ecuador" className="w-full h-full object-cover opacity-80" width={1024} height={1024} />
              {provs.map((p: any) => {
                const pos = POS[p.codigo];
                if (!pos) return null;
                const ratio = Number(p.ventas) / maxVtas;
                const size = 24 + Math.round(ratio * 28);
                const bajo = Number(p.ventas) < promedioVentas;
                return (
                  <button key={p.codigo}
                    onDoubleClick={() => setSel(p)}
                    onClick={() => setSel(p)}
                    title={`${p.ciudad} (${p.provincia}) — Doble clic para detalle`}
                    style={{ top: pos.top, left: pos.left, width: size, height: size }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white hover:scale-110 transition cursor-pointer ${
                      bajo ? "bg-red-500 animate-pulse" : "bg-emerald-600"
                    }`}>
                    {p.codigo}
                  </button>
                );
              })}
            </div>

            {/* Resumen por provincia */}
            <div className="space-y-2">
              {provs.sort((a: any, b: any) => Number(b.ventas) - Number(a.ventas)).map((p: any) => {
                const bajo = Number(p.ventas) < promedioVentas;
                return (
                  <button key={p.codigo} onClick={() => setSel(p)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${bajo ? "bg-red-500" : "bg-emerald-600"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{p.ciudad}</div>
                      <div className="text-xs text-muted-foreground">{p.provincia} · {p.facturas} facturas</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-emerald-700">${Number(p.ventas).toFixed(0)}</div>
                      {bajo && <Badge variant="destructive" className="text-[9px]">Bajo</Badge>}
                    </div>
                  </button>
                );
              })}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Promedio de red: <b>${promedioVentas.toFixed(2)}</b></p>
                <p className="text-red-600">🔴 = sucursales por debajo del promedio (requieren atención)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking productos */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <TrendingUp className="h-5 w-5" /> Más vendidos (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Vendidos</TableHead><TableHead className="text-right">Ingresos</TableHead></TableRow></TableHeader>
              <TableBody>
                {top.map((p: any, i: number) => (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="secondary" className="mr-2">{i + 1}</Badge>{p.nombre}</TableCell>
                    <TableCell className="text-right font-mono">{p.total_vendido}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-700">${Number(p.ingresos).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <TrendingDown className="h-5 w-5" /> Menos vendidos · acción requerida
            </CardTitle>
            <p className="text-xs text-muted-foreground">Productos con baja rotación. Considere promociones o transferencias entre sucursales.</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Vendidos</TableHead><TableHead className="text-right">Stock</TableHead></TableRow></TableHeader>
              <TableBody>
                {flop.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell className="text-right font-mono">{p.total_vendido}</TableCell>
                    <TableCell className="text-right font-mono">{p.stock}</TableCell>
                  </TableRow>
                ))}
                {flop.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin productos rezagados ✨</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal detalle sucursal con jefe de zona */}
      <Dialog open={!!sel} onOpenChange={(v) => !v && setSel(null)}>
        <DialogContent className="max-w-lg">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">📍 {sel.ciudad} <span className="text-sm font-normal text-muted-foreground">— {sel.provincia}</span></DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-emerald-700">${Number(sel.ventas).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Ventas acumuladas</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{sel.facturas}</div>
                    <div className="text-xs text-muted-foreground">Facturas emitidas</div>
                  </div>
                </div>

                {Number(sel.ventas) < promedioVentas && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-sm flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900">Sucursal bajo el promedio de red</p>
                      <p className="text-xs text-amber-800">Las ventas están por debajo del promedio (${promedioVentas.toFixed(2)}). Contacta al jefe de zona para coordinar acciones.</p>
                    </div>
                  </div>
                )}

                {sel.jefe ? (
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                        {sel.jefe.nombre.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-semibold">{sel.jefe.nombre}</div>
                        <div className="text-xs text-muted-foreground">{sel.jefe.cargo}</div>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <a href={`tel:${sel.jefe.telefono}`} className="border rounded-lg p-2 text-center hover:bg-muted text-xs">
                        <Phone className="h-4 w-4 mx-auto mb-1" />
                        Llamar
                      </a>
                      <a href={`https://wa.me/${sel.jefe.whatsapp}?text=${encodeURIComponent(`Hola ${sel.jefe.nombre}, te contacto por las ventas de la sucursal ${sel.ciudad}.`)}`} target="_blank" rel="noreferrer"
                         className="border rounded-lg p-2 text-center hover:bg-green-50 text-xs text-green-700 border-green-300">
                        <MessageCircle className="h-4 w-4 mx-auto mb-1" />
                        WhatsApp
                      </a>
                      <a href={`mailto:${sel.jefe.email}?subject=Sucursal ${sel.ciudad}`} className="border rounded-lg p-2 text-center hover:bg-muted text-xs">
                        <Mail className="h-4 w-4 mx-auto mb-1" />
                        Email
                      </a>
                    </div>
                    <div className="text-xs space-y-0.5 text-muted-foreground">
                      <div><b>Tel:</b> {sel.jefe.telefono}</div>
                      <div><b>Email:</b> {sel.jefe.email}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay jefe asignado a esta sucursal.</p>
                )}

                <Button variant="outline" className="w-full" onClick={() => setSel(null)}>Cerrar</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
