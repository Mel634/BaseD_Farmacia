import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/auditoria")({ component: Page });

function Page() {
  const q = useQuery({
    queryKey: ["log_auditoria"],
    queryFn: async () => {
      const { data, error } = await supabase.from("log_auditoria").select("*").order("fecha", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Log de Auditoría" subtitle="Últimas 200 operaciones (trigger automático)" />
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Fecha</TableHead><TableHead>Usuario</TableHead><TableHead>Tabla</TableHead>
            <TableHead>Operación</TableHead><TableHead>Registro</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(q.data ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{new Date(r.fecha).toLocaleString()}</TableCell>
                <TableCell>{r.usuario_email ?? "—"}</TableCell>
                <TableCell>{r.tabla}</TableCell>
                <TableCell><Badge variant={r.operacion === "DELETE" ? "destructive" : r.operacion === "INSERT" ? "default" : "secondary"}>{r.operacion}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{r.registro_id?.slice(0, 8)}...</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
