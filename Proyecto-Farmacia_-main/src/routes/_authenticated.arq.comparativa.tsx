import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getResumenGlobal } from "@/lib/arq.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, PrintButton } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/arq/comparativa")({ component: Page });

const CRITERIOS: { criterio: string; cent: string; dist: string; nube: string; hibr: string; nosql: string }[] = [
  { criterio: "Topología",            cent: "1 nodo",           dist: "N nodos pares",    nube: "Multi-región",     hibr: "Mixto + gateway",  nosql: "Cluster documental" },
  { criterio: "Modelo de datos",      cent: "Relacional",       dist: "Relacional",       nube: "Relacional",       hibr: "Relacional",       nosql: "Documental (JSON)" },
  { criterio: "Esquema",              cent: "Rígido",           dist: "Rígido",           nube: "Rígido",           hibr: "Rígido",           nosql: "Flexible" },
  { criterio: "Escalabilidad",        cent: "Vertical",         dist: "Horizontal",       nube: "Elástica",         hibr: "Híbrida",          nosql: "Horizontal (sharding)" },
  { criterio: "Consistencia",         cent: "Fuerte (ACID)",    dist: "Eventual",         nube: "Eventual / fuerte", hibr: "Por capa",        nosql: "Eventual (BASE)" },
  { criterio: "Disponibilidad",       cent: "Baja (SPOF)",      dist: "Alta",             nube: "Muy alta",         hibr: "Alta",             nosql: "Muy alta" },
  { criterio: "Tolerancia a fallos",  cent: "❌",               dist: "✅",               nube: "✅",               hibr: "✅",               nosql: "✅" },
  { criterio: "Latencia local",       cent: "Variable",         dist: "Baja",             nube: "Variable",         hibr: "Baja",             nosql: "Muy baja" },
  { criterio: "Administración",       cent: "Simple",           dist: "Compleja",         nube: "Gestionada",       hibr: "Muy compleja",     nosql: "Media" },
  { criterio: "Joins entre módulos",  cent: "Directos",         dist: "Costosos",         nube: "Limitados",        hibr: "Por capa",         nosql: "No nativos" },
  { criterio: "Reportería global",    cent: "Simple",           dist: "Agregación",       nube: "Centralizada",     hibr: "Vía gateway",      nosql: "Map-Reduce" },
  { criterio: "Modelo CAP",           cent: "CA",               dist: "AP",               nube: "AP",               hibr: "Mixto",            nosql: "AP" },
];

function Page() {
  const fn = useServerFn(getResumenGlobal);
  const { data } = useQuery({ queryKey: ["arq-global"], queryFn: () => fn() });
  const m: any = data ?? {};

  return (
    <div className="space-y-6">
      <PageHeader title="📊 Comparativa de Arquitecturas" subtitle="Métricas reales y criterios de diseño" actions={<PrintButton />} />

      {/* Métricas reales */}
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "🖥️ Centralizada", color: "bg-slate-100",   rows: m.centralizada },
          { label: "🌐 Distribuida",  color: "bg-amber-100",   rows: m.distribuida },
          { label: "📦 Bodega",       color: "bg-purple-100",  rows: m.bodega },
          { label: "☁️ Nube",         color: "bg-blue-100",    rows: m.nube },
          { label: "🍃 NoSQL",        color: "bg-emerald-100", rows: m.nosql },
        ].map((c) => (
          <Card key={c.label} className={c.color}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{c.label}</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <dl className="text-xs space-y-1">
                {c.rows && Object.entries(c.rows).map(([k, v]: any) => (
                  <div key={k} className="flex justify-between border-b border-black/5 py-0.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-mono font-bold">{typeof v === "number" ? v.toLocaleString() : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla de criterios */}
      <Card>
        <CardHeader><CardTitle>Tabla comparativa por criterio</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criterio</TableHead>
                  <TableHead className="bg-slate-50">🖥️ Centralizada</TableHead>
                  <TableHead className="bg-amber-50">🌐 Distribuida</TableHead>
                  <TableHead className="bg-blue-50">☁️ Nube</TableHead>
                  <TableHead className="bg-purple-50">🔀 Híbrida</TableHead>
                  <TableHead className="bg-emerald-50">🍃 NoSQL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CRITERIOS.map((c) => (
                  <TableRow key={c.criterio}>
                    <TableCell className="font-medium">{c.criterio}</TableCell>
                    <TableCell className="text-sm">{c.cent}</TableCell>
                    <TableCell className="text-sm">{c.dist}</TableCell>
                    <TableCell className="text-sm">{c.nube}</TableCell>
                    <TableCell className="text-sm">{c.hibr}</TableCell>
                    <TableCell className="text-sm">{c.nosql}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-emerald-50 border-emerald-300">
        <CardHeader><CardTitle className="text-emerald-900">🎯 Conclusión</CardTitle></CardHeader>
        <CardContent className="text-sm text-emerald-900 space-y-2">
          <p>Para FarmaSystem (cadena de farmacias con 5 sucursales + canal eCommerce), la arquitectura recomendada es la <b>híbrida</b>:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li><b>Central</b> para contabilidad, RRHH y catálogo maestro de productos.</li>
            <li><b>Distribuida horizontal</b> para ventas locales de cada sucursal (autonomía y baja latencia).</li>
            <li><b>Distribuida vertical (bodega)</b> para inventario consolidado y despachos.</li>
            <li><b>Nube</b> para el canal eCommerce público.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
