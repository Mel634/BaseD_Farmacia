import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCentralizada } from "@/lib/arq.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, PrintButton } from "@/components/PageHeader";
import { Building2, Users, Package, Receipt, BadgeDollarSign, Truck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/arq/centralizada")({ component: Page });

function Page() {
  const fn = useServerFn(getCentralizada);
  const { data, isLoading } = useQuery({ queryKey: ["arq-cent"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <PageHeader title="🖥️ Arquitectura Centralizada" subtitle="Una sola base de datos PostgreSQL (esquema public) atiende todos los módulos del ERP" actions={<PrintButton />} />

      <Card className="bg-slate-50 border-slate-300">
        <CardHeader><CardTitle>Concepto</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Todos los datos del ERP (clientes, productos, ventas, compras, contabilidad, RRHH) residen en una <b>única instancia PostgreSQL</b> en Supabase, esquema <code className="bg-muted px-1">public</code>. Las aplicaciones cliente acceden vía REST/Realtime API con un único modelo de seguridad (RLS).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Diagrama</CardTitle></CardHeader>
        <CardContent>
          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            <rect x="220" y="100" width="200" height="80" rx="8" fill="#1e293b" />
            <text x="320" y="130" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">PostgreSQL · public</text>
            <text x="320" y="155" textAnchor="middle" fill="white" fontSize="11">15 tablas · funciones · RLS</text>
            <rect x="20" y="20" width="140" height="50" rx="6" fill="#3b82f6" />
            <text x="90" y="50" textAnchor="middle" fill="white" fontSize="12">Cliente Web</text>
            <rect x="20" y="115" width="140" height="50" rx="6" fill="#10b981" />
            <text x="90" y="145" textAnchor="middle" fill="white" fontSize="12">Supabase Auth</text>
            <rect x="20" y="210" width="140" height="50" rx="6" fill="#f59e0b" />
            <text x="90" y="240" textAnchor="middle" fill="white" fontSize="12">REST/Realtime</text>
            <line x1="160" y1="45" x2="220" y2="120" stroke="#64748b" strokeWidth="2" />
            <line x1="160" y1="140" x2="220" y2="140" stroke="#64748b" strokeWidth="2" />
            <line x1="160" y1="235" x2="220" y2="160" stroke="#64748b" strokeWidth="2" />
          </svg>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Productos",   icon: Package,         val: data?.productos,    color: "bg-blue-50 text-blue-700" },
          { label: "Clientes",    icon: Users,           val: data?.clientes,     color: "bg-green-50 text-green-700" },
          { label: "Facturas",    icon: Receipt,         val: data?.facturas,     color: "bg-amber-50 text-amber-700" },
          { label: "Empleados",   icon: Users,           val: data?.empleados,    color: "bg-purple-50 text-purple-700" },
          { label: "Proveedores", icon: Truck,           val: data?.proveedores,  color: "bg-cyan-50 text-cyan-700" },
          { label: "Ventas $",    icon: BadgeDollarSign, val: data?.ventas_total?.toFixed(2), color: "bg-rose-50 text-rose-700" },
        ].map((k) => (
          <Card key={k.label} className={k.color}>
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className="h-8 w-8" />
              <div>
                <div className="text-xs opacity-75">{k.label}</div>
                <div className="text-2xl font-bold">{isLoading ? "…" : (k.val ?? 0)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader><CardTitle className="text-green-900">✅ Ventajas</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-green-900">
            <p>• Consistencia ACID total entre módulos</p>
            <p>• Joins directos sin ETL</p>
            <p>• Administración simple (un backup, un upgrade)</p>
            <p>• Modelo de seguridad unificado (RLS)</p>
            <p>• Latencia mínima entre módulos</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader><CardTitle className="text-red-900">❌ Desventajas</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-red-900">
            <p>• Punto único de fallo (SPOF)</p>
            <p>• Escalabilidad solo vertical</p>
            <p>• Latencia para clientes geográficamente lejanos</p>
            <p>• Cuello de botella en alta concurrencia</p>
            <p>• Sin tolerancia a particiones de red</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
