import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getNoSQL, getNoSQLResumen } from "@/lib/arq.functions";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, PrintButton } from "@/components/PageHeader";
import { Database, FileJson } from "lucide-react";

export const Route = createFileRoute("/_authenticated/arq/nosql")({ component: Page });

function Page() {
  const fnDocs = useServerFn(getNoSQL);
  const fnRes = useServerFn(getNoSQLResumen);
  const [tab, setTab] = useState<"catalogo" | "resenas" | "logs">("catalogo");

  const resumen = useQuery({ queryKey: ["nosql-res"], queryFn: () => fnRes() });
  const docs = useQuery({
    queryKey: ["nosql-docs", tab],
    queryFn: () => fnDocs({ data: { collection: tab, limit: 50 } }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="🍃 Arquitectura NoSQL (Documental)"
        subtitle="Base estilo MongoDB · documentos JSON con esquema flexible"
        actions={<PrintButton />}
      />

      <Card className="bg-emerald-50 border-emerald-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <FileJson className="h-5 w-5" /> Concepto · Modelo Documental
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-emerald-950 space-y-2">
          <p>
            Cada registro es un <b>documento JSON autónomo</b> con estructura libre, agrupado en{" "}
            <b>colecciones</b> (equivalente a tablas). No requiere esquema fijo: cada documento puede
            tener campos distintos. Ideal para catálogos con variantes, reseñas con votos opcionales
            y logs de telemetría con metadatos heterogéneos.
          </p>
          <p className="text-xs font-mono bg-white/60 p-2 rounded border">
            nosql_mongo.documents (_id uuid, collection text, doc jsonb)
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total documentos</CardTitle>
            <Database className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{resumen.data?.total ?? "—"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Colección catalogo</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{resumen.data?.colecciones.catalogo ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Colección resenas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{resumen.data?.colecciones.resenas ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Colección logs</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{resumen.data?.colecciones.logs ?? 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Explorador de colecciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="catalogo">catalogo</TabsTrigger>
              <TabsTrigger value="resenas">resenas</TabsTrigger>
              <TabsTrigger value="logs">logs</TabsTrigger>
            </TabsList>
            {(["catalogo", "resenas", "logs"] as const).map((c) => (
              <TabsContent key={c} value={c} className="space-y-3 mt-4">
                {docs.isLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando documentos…</p>
                ) : (
                  (docs.data ?? []).map((d) => (
                    <Card key={d._id} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="font-mono text-[10px]">_id: {d._id.slice(0, 8)}…</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("es-EC")}</span>
                        </div>
                        <pre className="text-xs bg-background border rounded p-3 overflow-auto max-h-64 font-mono">
{JSON.stringify(d.doc, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader><CardTitle className="text-green-900">✅ Ventajas NoSQL Documental</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-green-900">
            <p>• Esquema flexible (cada documento puede ser distinto)</p>
            <p>• Escalabilidad horizontal por sharding nativo</p>
            <p>• Lectura rápida de objetos complejos (sin JOINs)</p>
            <p>• Ideal para catálogos, perfiles, logs, IoT</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader><CardTitle className="text-red-900">❌ Desventajas</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-red-900">
            <p>• Sin integridad referencial obligatoria</p>
            <p>• Transacciones ACID limitadas</p>
            <p>• Duplicación de datos (denormalización)</p>
            <p>• Reportes complejos requieren agregaciones costosas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
