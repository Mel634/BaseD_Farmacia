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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ordenes-compra")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [provId, setProvId] = useState("");
  const [items, setItems] = useState<{ producto_id: string; cantidad: number; precio_unitario: number }[]>([]);

  const list = useQuery({
    queryKey: ["ordenes_compra"],
    queryFn: async () => {
      const { data } = await supabase.from("ordenes_compra").select("*, proveedores(razon_social)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const provs = useQuery({ queryKey: ["proveedores-sel"], queryFn: async () => (await supabase.from("proveedores").select("id,razon_social")).data ?? [] });
  const prods = useQuery({ queryKey: ["productos-sel"], queryFn: async () => (await supabase.from("productos").select("id,codigo,nombre,precio_compra")).data ?? [] });

  const crear = useMutation({
    mutationFn: async () => {
      if (!provId || items.length === 0) throw new Error("Selecciona proveedor y al menos un item");
      const { error } = await supabase.rpc("proc_orden_compra" as any, { p_proveedor_id: provId, p_items: items });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("OC creada"); setOpen(false); setProvId(""); setItems([]); qc.invalidateQueries({ queryKey: ["ordenes_compra"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const mkAction = (rpc: string, label: string) => useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc(rpc as any, { p_oc_id: id });
      if (error) throw error;
      if (typeof data === "string" && data.startsWith("ERROR")) throw new Error(data);
      return data;
    },
    onSuccess: (m: any) => { toast.success(String(m)); qc.invalidateQueries({ queryKey: ["ordenes_compra"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const aprobar = mkAction("proc_aprobar_orden", "Aprobar");
  const recibir = mkAction("proc_recibir_orden", "Recibir");

  const addItem = () => setItems([...items, { producto_id: prods.data?.[0]?.id ?? "", cantidad: 1, precio_unitario: Number(prods.data?.[0]?.precio_compra ?? 0) }]);

  return (
    <div className="space-y-6">
      <PageHeader title="Órdenes de Compra" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nueva OC</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Nueva Orden de Compra</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Proveedor</Label>
                <Select value={provId} onValueChange={setProvId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona proveedor" /></SelectTrigger>
                  <SelectContent>{provs.data?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.razon_social}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex justify-between mb-2"><Label>Items</Label><Button size="sm" variant="outline" onClick={addItem}>+ Item</Button></div>
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                    <Select value={it.producto_id} onValueChange={(v) => { const c = [...items]; c[i].producto_id = v; const p = prods.data?.find((x: any) => x.id === v); if (p) c[i].precio_unitario = Number(p.precio_compra); setItems(c); }}>
                      <SelectTrigger className="col-span-6"><SelectValue /></SelectTrigger>
                      <SelectContent>{prods.data?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="col-span-2" type="number" min={1} value={it.cantidad} onChange={(e) => { const c = [...items]; c[i].cantidad = Number(e.target.value); setItems(c); }} />
                    <Input className="col-span-3" type="number" step="0.01" value={it.precio_unitario} onChange={(e) => { const c = [...items]; c[i].precio_unitario = Number(e.target.value); setItems(c); }} />
                    <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter><Button onClick={() => crear.mutate()} disabled={crear.isPending}>Crear OC</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Proveedor</TableHead><TableHead>Fecha</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {(list.data ?? []).map((o: any) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono">{o.numero}</TableCell>
                <TableCell>{o.proveedores?.razon_social ?? "—"}</TableCell>
                <TableCell>{o.fecha}</TableCell>
                <TableCell>${Number(o.total).toFixed(2)}</TableCell>
                <TableCell><Badge variant={o.estado === "RECIBIDA" ? "default" : o.estado === "APROBADA" ? "secondary" : "outline"}>{o.estado}</Badge></TableCell>
                <TableCell className="space-x-1">
                  {o.estado === "PENDIENTE" && (
                    <Button size="sm" variant="outline" onClick={() => aprobar.mutate(o.id)}><CheckCircle2 className="h-3 w-3 mr-1" />Aprobar</Button>
                  )}
                  {o.estado === "APROBADA" && (
                    <Button size="sm" onClick={() => recibir.mutate(o.id)}><PackageCheck className="h-3 w-3 mr-1" />Recibir</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
