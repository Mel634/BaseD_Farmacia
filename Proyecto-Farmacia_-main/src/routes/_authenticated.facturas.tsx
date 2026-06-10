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
import { Plus, Trash2, Ban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/facturas")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const checkStock = useServerFn(verificarAlertasStock);
  const [open, setOpen] = useState(false);
  const [cliId, setCliId] = useState("");
  const [items, setItems] = useState<{ producto_id: string; cantidad: number; precio_unitario: number }[]>([]);

  const list = useQuery({
    queryKey: ["facturas"],
    queryFn: async () => (await supabase.from("facturas").select("*, clientes(nombre_completo)").order("created_at", { ascending: false })).data ?? [],
  });
  const clis = useQuery({ queryKey: ["clientes-sel"], queryFn: async () => (await supabase.from("clientes").select("id,nombre_completo")).data ?? [] });
  const prods = useQuery({ queryKey: ["productos-sel"], queryFn: async () => (await supabase.from("productos").select("id,codigo,nombre,precio_venta,stock")).data ?? [] });

  const crear = useMutation({
    mutationFn: async () => {
      if (!cliId || items.length === 0) throw new Error("Selecciona cliente y items");
      const { error } = await supabase.rpc("proc_factura" as any, { p_cliente_id: cliId, p_items: items });
      if (error) throw error;
      return items.map((it) => it.producto_id);
    },
    onSuccess: async (productoIds) => {
      toast.success("Factura emitida");
      setOpen(false); setCliId(""); setItems([]);
      qc.invalidateQueries({ queryKey: ["facturas"] });
      try {
        const { enviados } = await checkStock({ data: { productoIds } });
        if (enviados.length) toast.warning(`Alerta Telegram: stock bajo en ${enviados.join(", ")}`);
      } catch { /* no bloquear factura */ }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const anular = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("proc_anular_factura" as any, { p_factura_id: id });
      if (error) throw error;
      if (typeof data === "string" && data.startsWith("ERROR")) throw new Error(data);
      return data;
    },
    onSuccess: (m: any) => { toast.success(String(m)); qc.invalidateQueries({ queryKey: ["facturas"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const addItem = () => setItems([...items, { producto_id: prods.data?.[0]?.id ?? "", cantidad: 1, precio_unitario: Number(prods.data?.[0]?.precio_venta ?? 0) }]);

  return (
    <div className="space-y-6">
      <PageHeader title="Facturación" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nueva Factura</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Nueva Factura</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Cliente</Label>
                <Select value={cliId} onValueChange={setCliId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
                  <SelectContent>{clis.data?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nombre_completo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex justify-between mb-2"><Label>Items</Label><Button size="sm" variant="outline" onClick={addItem}>+ Item</Button></div>
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                    <Select value={it.producto_id} onValueChange={(v) => { const c = [...items]; c[i].producto_id = v; const p = prods.data?.find((x: any) => x.id === v); if (p) c[i].precio_unitario = Number(p.precio_venta); setItems(c); }}>
                      <SelectTrigger className="col-span-6"><SelectValue /></SelectTrigger>
                      <SelectContent>{prods.data?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nombre} (stock {p.stock})</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="col-span-2" type="number" min={1} value={it.cantidad} onChange={(e) => { const c = [...items]; c[i].cantidad = Number(e.target.value); setItems(c); }} />
                    <Input className="col-span-3" type="number" step="0.01" value={it.precio_unitario} onChange={(e) => { const c = [...items]; c[i].precio_unitario = Number(e.target.value); setItems(c); }} />
                    <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter><Button onClick={() => crear.mutate()} disabled={crear.isPending}>Emitir factura</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Cliente</TableHead><TableHead>Fecha</TableHead><TableHead>Subtotal</TableHead><TableHead>IVA</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {(list.data ?? []).map((f: any) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono">{f.numero}</TableCell>
                <TableCell>{f.clientes?.nombre_completo ?? "—"}</TableCell>
                <TableCell>{f.fecha}</TableCell>
                <TableCell>${Number(f.subtotal).toFixed(2)}</TableCell>
                <TableCell>${Number(f.iva).toFixed(2)}</TableCell>
                <TableCell className="font-bold">${Number(f.total).toFixed(2)}</TableCell>
                <TableCell><Badge variant={f.estado === "ANULADA" ? "destructive" : "default"}>{f.estado}</Badge></TableCell>
                <TableCell>
                  {f.estado !== "ANULADA" && (
                    <Button size="sm" variant="outline" onClick={() => { if (confirm(`¿Anular factura ${f.numero}?`)) anular.mutate(f.id); }}>
                      <Ban className="h-3 w-3 mr-1" />Anular
                    </Button>
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
