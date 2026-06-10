import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/usuarios")({ component: Page });

function Page() {
  const q = useQuery({
    queryKey: ["usuarios-sistema"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profiles ?? []).map((p: any) => ({
        ...p,
        roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      }));
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios del Sistema" subtitle="Perfiles registrados y sus roles" />
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Roles</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
          <TableBody>
            {(q.data ?? []).map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>{u.nombre_completo || "—"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell className="space-x-1">{u.roles.map((r: string) => <Badge key={r}>{r}</Badge>)}</TableCell>
                <TableCell><Badge variant={u.activo ? "default" : "secondary"}>{u.activo ? "Activo" : "Inactivo"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
