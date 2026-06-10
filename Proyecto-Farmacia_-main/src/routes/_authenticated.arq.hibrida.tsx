import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBodega, getCentralizada, getDistribuida, getNube } from "@/lib/arq.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PrintButton } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/arq/hibrida")({ component: Page });

function Page() {
  const c = useServerFn(getCentralizada);
  const d = useServerFn(getDistribuida);
  const b = useServerFn(getBodega);
  const n = useServerFn(getNube);
  const qc = useQuery({ queryKey: ["arq-cent"], queryFn: () => c() });
  const qd = useQuery({ queryKey: ["arq-dist"], queryFn: () => d() });
  const qb = useQuery({ queryKey: ["arq-bod"],  queryFn: () => b() });
  const qn = useQuery({ queryKey: ["arq-nube"], queryFn: () => n() });

  return (
    <div className="space-y-6">
      <PageHeader title="🔀 Arquitectura Híbrida" subtitle="ERP central + 5 sucursales distribuidas + bodega vertical + nube — integradas vía gateway lógico" actions={<PrintButton />} />

      <Card className="bg-purple-50 border-purple-300">
        <CardHeader><CardTitle>Concepto · Gateway de integración</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>La arquitectura híbrida combina los mejores aspectos de cada modelo: <b>centralizada</b> para reportería y contabilidad, <b>distribuida</b> para autonomía operativa local, <b>bodega vertical</b> para inventario consolidado, y <b>nube</b> para canal eCommerce. Un componente gateway (en este proyecto: server functions con routing por esquema) enruta cada petición al nodo correcto.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Diagrama lógico</CardTitle></CardHeader>
        <CardContent>
          <svg viewBox="0 0 700 360" className="w-full">
            <rect x="280" y="20" width="140" height="50" rx="8" fill="#0891b2" />
            <text x="350" y="50" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">🌐 Gateway</text>

            <rect x="20" y="110" width="160" height="60" rx="8" fill="#16a34a" />
            <text x="100" y="135" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">🖥️ Central</text>
            <text x="100" y="152" textAnchor="middle" fill="white" fontSize="10">public</text>

            <rect x="200" y="110" width="160" height="60" rx="8" fill="#d97706" />
            <text x="280" y="135" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">🏪 5 Sucursales</text>
            <text x="280" y="152" textAnchor="middle" fill="white" fontSize="10">sucursal_*</text>

            <rect x="380" y="110" width="160" height="60" rx="8" fill="#7c3aed" />
            <text x="460" y="135" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">📦 Bodega</text>
            <text x="460" y="152" textAnchor="middle" fill="white" fontSize="10">bodega_central</text>

            <rect x="560" y="110" width="120" height="60" rx="8" fill="#2563eb" />
            <text x="620" y="135" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">☁️ Nube</text>
            <text x="620" y="152" textAnchor="middle" fill="white" fontSize="10">cloud_ecommerce</text>

            <line x1="350" y1="70" x2="100" y2="110" stroke="#64748b" strokeWidth="2" />
            <line x1="350" y1="70" x2="280" y2="110" stroke="#64748b" strokeWidth="2" />
            <line x1="350" y1="70" x2="460" y2="110" stroke="#64748b" strokeWidth="2" />
            <line x1="350" y1="70" x2="620" y2="110" stroke="#64748b" strokeWidth="2" />

            <rect x="100" y="240" width="500" height="60" rx="8" fill="#1e293b" />
            <text x="350" y="265" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">Dashboard Ejecutivo · Reportes Consolidados</text>
            <text x="350" y="285" textAnchor="middle" fill="white" fontSize="10">Agrega datos de los 4 nodos vía gateway</text>

            <line x1="100" y1="170" x2="200" y2="240" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="280" y1="170" x2="300" y2="240" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="460" y1="170" x2="420" y2="240" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="620" y1="170" x2="540" y2="240" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
          </svg>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Estado de los nodos en vivo</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nodo</TableHead><TableHead>Esquema</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Registros clave</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell>🖥️ Servidor Central</TableCell><TableCell className="font-mono text-xs">public</TableCell><TableCell>Centralizada</TableCell><TableCell className="text-right">{qc.data ? `${qc.data.facturas} fac · ${qc.data.empleados} emp` : "…"}</TableCell><TableCell><Badge className="bg-green-600">EN LÍNEA</Badge></TableCell></TableRow>
              {(qd.data ?? []).map((s) => (
                <TableRow key={s.schema}><TableCell>🏪 {s.nombre}</TableCell><TableCell className="font-mono text-xs">{s.schema}</TableCell><TableCell>Distribuida</TableCell><TableCell className="text-right">{s.facturas} fac · {s.clientes} cli</TableCell><TableCell><Badge className="bg-green-600">EN LÍNEA</Badge></TableCell></TableRow>
              ))}
              <TableRow><TableCell>📦 Bodega Central</TableCell><TableCell className="font-mono text-xs">bodega_central</TableCell><TableCell>Dist. vertical</TableCell><TableCell className="text-right">{qb.data ? `${qb.data.productos.length} prod · ${qb.data.movimientos.length} mov` : "…"}</TableCell><TableCell><Badge className="bg-green-600">EN LÍNEA</Badge></TableCell></TableRow>
              <TableRow><TableCell>☁️ Cloud eCommerce</TableCell><TableCell className="font-mono text-xs">cloud_ecommerce</TableCell><TableCell>Nube</TableCell><TableCell className="text-right">{qn.data ? `${qn.data.pedidos.length} pedidos` : "…"}</TableCell><TableCell><Badge className="bg-green-600">EN LÍNEA</Badge></TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader><CardTitle className="text-green-900">✅ Ventajas</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-green-900">
            <p>• Aprovecha lo mejor de cada modelo</p>
            <p>• Autonomía local + reportería global</p>
            <p>• Canal eCommerce desacoplado</p>
            <p>• Migración gradual posible</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader><CardTitle className="text-red-900">❌ Desventajas</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-red-900">
            <p>• Complejidad operativa máxima</p>
            <p>• Requiere gateway robusto (SPOF si falla)</p>
            <p>• Sincronización compleja entre capas</p>
            <p>• Mayor costo de mantenimiento</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
