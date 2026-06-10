import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rol-pagos")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", periodo: "2026-05", horas_extras: 0, bonos: 0 });

  const list = useQuery({
    queryKey: ["rol_pagos"],
    queryFn: async () => (await supabase.from("rol_pagos").select("*, empleados(nombre_completo,cedula)").order("created_at", { ascending: false })).data ?? [],
  });
  const emps = useQuery({ queryKey: ["empleados-sel"], queryFn: async () => (await supabase.from("empleados").select("id,nombre_completo")).data ?? [] });

  const crear = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("proc_rol_pago" as any, {
        p_empleado_id: form.empleado_id, p_periodo: form.periodo,
        p_horas_extras: form.horas_extras, p_bonos: form.bonos,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rol generado"); setOpen(false); qc.invalidateQueries({ queryKey: ["rol_pagos"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Rol de Pagos" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Generar rol</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generar rol de pagos</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Empleado</Label>
                <Select value={form.empleado_id} onValueChange={(v) => setForm({ ...form, empleado_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Empleado" /></SelectTrigger>
                  <SelectContent>{emps.data?.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Periodo (YYYY-MM)</Label><Input value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} /></div>
              <div><Label>Horas extras ($)</Label><Input type="number" step="0.01" value={form.horas_extras} onChange={(e) => setForm({ ...form, horas_extras: Number(e.target.value) })} /></div>
              <div><Label>Bonos ($)</Label><Input type="number" step="0.01" value={form.bonos} onChange={(e) => setForm({ ...form, bonos: Number(e.target.value) })} /></div>
            </div>
            <DialogFooter><Button onClick={() => crear.mutate()} disabled={crear.isPending}>Generar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead>Periodo</TableHead><TableHead>Sueldo</TableHead><TableHead>Extras</TableHead><TableHead>Bonos</TableHead><TableHead>IESS</TableHead><TableHead>Líquido</TableHead></TableRow></TableHeader>
          <TableBody>
            {(list.data ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{r.empleados?.nombre_completo}</TableCell>
                <TableCell>{r.periodo}</TableCell>
                <TableCell>${Number(r.sueldo_base).toFixed(2)}</TableCell>
                <TableCell>${Number(r.horas_extras).toFixed(2)}</TableCell>
                <TableCell>${Number(r.bonos).toFixed(2)}</TableCell>
                <TableCell>${Number(r.iess).toFixed(2)}</TableCell>
                <TableCell className="font-bold">${Number(r.liquido_pagar).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
