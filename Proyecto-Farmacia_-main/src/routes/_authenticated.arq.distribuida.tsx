import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDistribuida, buscarDisponibilidad } from "@/lib/arq.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PrintButton } from "@/components/PageHeader";
import { useState } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/arq/distribuida")({ component: Page });

function Page() {
  const fn = useServerFn(getDistribuida);
  const buscar = useServerFn(buscarDisponibilidad);
  const { data: sucs, isLoading } = useQuery({ queryKey: ["arq-dist"], queryFn: () => fn() });

  const [termino, setTermino] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);

  const onBuscar = async () => {
    if (!termino.trim()) return;
    setBuscando(true);
    try { setResultado(await buscar({ data: { termino } })); } finally { setBuscando(false); }
  };

  const totalVentas = (sucs ?? []).reduce((s, x) => s + Number(x.ventas_total ?? 0), 0);
  const totalFacturas = (sucs ?? []).reduce((s, x) => s + Number(x.facturas ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="🌐 Arquitectura Distribuida (Horizontal)" subtitle="5 nodos PostgreSQL independientes — fragmentación geográfica por sucursal" actions={<PrintButton />} />

      <Card className="bg-amber-50 border-amber-300">
        <CardHeader><CardTitle>Concepto · Fragmentación horizontal por sucursal</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Cada sucursal mantiene su <b>propio esquema PostgreSQL</b> con clientes y facturas locales. El catálogo de productos reside en el servidor central; las ventas se ejecutan localmente para máxima autonomía y baja latencia.</p>
          <p className="text-xs text-muted-foreground font-mono">sucursal_quito · sucursal_guayaquil · sucursal_cuenca · sucursal_ambato · sucursal_portoviejo</p>
        </CardContent>
      </Card>

      {/* Mapa de nodos */}
      <Card>
        <CardHeader>
          <CardTitle>Nodos de la red</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            {(sucs ?? []).map((s) => (
              <Card key={s.schema} style={{ borderColor: s.color, borderWidth: 2 }}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{s.nombre}</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{s.schema}</div>
                  <div className="text-xs space-y-0.5">
                    <div>👥 Clientes: <b>{s.clientes}</b></div>
                    <div>🧾 Facturas: <b>{s.facturas}</b> <span className="text-muted-foreground">({s.facturas_anuladas} anul.)</span></div>
                    <div>💰 Ventas: <b>${Number(s.ventas_total).toFixed(2)}</b></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm border-t pt-3">
            <div>Total facturas red: <b>{totalFacturas}</b></div>
            <div>Total ventas red: <b className="text-green-700">${totalVentas.toFixed(2)}</b></div>
            <div>Disponibilidad: <Badge className="bg-green-600">5/5 nodos en línea</Badge></div>
          </div>
        </CardContent>
      </Card>

      {/* Buscador cross-sucursal */}
      <Card className="border-amber-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Buscador de disponibilidad cross-sucursal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Buscar producto (ej: paracetamol)" value={termino} onChange={(e) => setTermino(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onBuscar()} />
            <Button onClick={onBuscar} disabled={buscando}>{buscando ? "Buscando…" : "Buscar en red"}</Button>
          </div>
          {resultado && (resultado.productos?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Sin resultados.</p>}
          {resultado?.productos?.length > 0 && (
            <div className="space-y-3">
              {resultado.productos.map((p: any) => {
                const totalRed = p.sucursales.reduce((a: number, s: any) => a + Number(s.stock), 0);
                return (
                  <Card key={p.codigo} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-bold">{p.nombre} <span className="text-xs text-muted-foreground">({p.codigo})</span></div>
                          <div className="text-xs text-muted-foreground">Disponible en {p.sucursales.length} / 5 sucursales · Stock total red: <b>{totalRed}</b></div>
                        </div>
                      </div>
                      <Table>
                        <TableHeader><TableRow><TableHead>Sucursal</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Stock local</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {p.sucursales.map((s: any) => (
                            <TableRow key={s.sucursal}>
                              <TableCell className="capitalize">{s.sucursal}</TableCell>
                              <TableCell className="text-right font-mono">${Number(s.precio).toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono">{s.stock}</TableCell>
                              <TableCell>{s.stock > 10 ? <Badge className="bg-green-600">Disponible</Badge> : s.stock > 0 ? <Badge className="bg-amber-500">Stock bajo</Badge> : <Badge variant="destructive">Sin stock</Badge>}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader><CardTitle className="text-green-900">✅ Ventajas</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-green-900">
            <p>• Sin punto único de fallo</p>
            <p>• Baja latencia local (cada sucursal autónoma)</p>
            <p>• Escalabilidad horizontal real</p>
            <p>• Sigue operando si cae un nodo (CAP: AP)</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader><CardTitle className="text-red-900">❌ Desventajas</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-red-900">
            <p>• Consistencia eventual entre nodos</p>
            <p>• Joins cross-sucursal costosos</p>
            <p>• Administración compleja (5 bases × backups, upgrades)</p>
            <p>• Reportes consolidados requieren agregación</p>
          </CardContent>
        </Card>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Consultando nodos…</p>}
    </div>
  );
}
