import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { verificarAlertasStock } from "@/lib/stock-alert.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ajustes-inventario")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const checkStock = useServerFn(verificarAlertasStock);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ producto_id: "", tipo: "ENTRADA", cantidad: 1, motivo: "" });

  const list = useQuery({
    queryKey: ["ajustes_inventario"],
    queryFn: async () => (await supabase.from("ajustes_inventario").select("*, productos(codigo,nombre)").order("created_at", { ascending: false })).data ?? [],
  });
  const prods = useQuery({ queryKey: ["productos-sel"], queryFn: async () => (await supabase.from("productos").select("id,codigo,nombre,stock")).data ?? [] });

  const crear = useMutation({
    mutationFn: async () => {
      const { producto_id, tipo, cantidad, motivo } = form;
      const { error } = await supabase.rpc("proc_ajuste_inventario" as any, {
        p_producto_id: producto_id, p_tipo: tipo, p_cantidad: cantidad, p_motivo: motivo,
      });
      if (error) throw error;
      return { productoId: producto_id, tipo };
    },
    onSuccess: async ({ productoId, tipo }) => {
      toast.success("Ajuste registrado");
      setOpen(false); setForm({ producto_id: "", tipo: "ENTRADA", cantidad: 1, motivo: "" });
      qc.invalidateQueries({ queryKey: ["ajustes_inventario"] });
      qc.invalidateQueries({ queryKey: ["productos"] });
      if (tipo === "SALIDA") {
        try {
          const { enviados } = await checkStock({ data: { productoIds: [productoId] } });
          if (enviados.length) toast.warning(`Alerta Telegram: stock bajo en ${enviados.join(", ")}`);
        } catch { /* no bloquear ajuste */ }
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Ajustes de Inventario" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nuevo ajuste</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo ajuste</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Producto</Label>
                <Select value={form.producto_id} onValueChange={(v) => setForm({ ...form, producto_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                  <SelectContent>{prods.data?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nombre} (stock {p.stock})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ENTRADA">ENTRADA</SelectItem><SelectItem value="SALIDA">SALIDA</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Cantidad</Label><Input type="number" min={1} value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} /></div>
              <div><Label>Motivo</Label><Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => crear.mutate()} disabled={crear.isPending}>Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Producto</TableHead><TableHead>Tipo</TableHead><TableHead>Cantidad</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
          <TableBody>
            {(list.data ?? []).map((a: any) => (
              <TableRow key={a.id}>
                <TableCell>{a.fecha}</TableCell>
                <TableCell>{a.productos?.codigo} - {a.productos?.nombre}</TableCell>
                <TableCell><Badge variant={a.tipo === "ENTRADA" ? "default" : "destructive"}>{a.tipo}</Badge></TableCell>
                <TableCell>{a.cantidad}</TableCell>
                <TableCell>{a.motivo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
