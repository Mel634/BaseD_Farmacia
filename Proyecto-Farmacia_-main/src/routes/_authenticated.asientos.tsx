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
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/asientos")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [concepto, setConcepto] = useState("");
  const [lineas, setLineas] = useState<{ cuenta_id: string; debe: number; haber: number }[]>([]);

  const list = useQuery({
    queryKey: ["asientos"],
    queryFn: async () => (await supabase.from("asientos_contables").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const cuentas = useQuery({ queryKey: ["pc-sel"], queryFn: async () => (await supabase.from("plan_cuentas").select("id,codigo,nombre")).data ?? [] });

  const crear = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("proc_asiento_contable" as any, { p_concepto: concepto, p_lineas: lineas });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Asiento registrado"); setOpen(false); setConcepto(""); setLineas([]); qc.invalidateQueries({ queryKey: ["asientos"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const addLinea = () => setLineas([...lineas, { cuenta_id: cuentas.data?.[0]?.id ?? "", debe: 0, haber: 0 }]);
  const totDebe = lineas.reduce((a, l) => a + Number(l.debe), 0);
  const totHaber = lineas.reduce((a, l) => a + Number(l.haber), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Asientos Contables" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nuevo asiento</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Nuevo asiento contable</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Concepto</Label><Input value={concepto} onChange={(e) => setConcepto(e.target.value)} /></div>
              <div>
                <div className="flex justify-between mb-2"><Label>Líneas</Label><Button size="sm" variant="outline" onClick={addLinea}>+ Línea</Button></div>
                {lineas.map((l, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                    <Select value={l.cuenta_id} onValueChange={(v) => { const c = [...lineas]; c[i].cuenta_id = v; setLineas(c); }}>
                      <SelectTrigger className="col-span-6"><SelectValue /></SelectTrigger>
                      <SelectContent>{cuentas.data?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.codigo} - {c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="col-span-2" type="number" step="0.01" placeholder="Debe" value={l.debe} onChange={(e) => { const c = [...lineas]; c[i].debe = Number(e.target.value); setLineas(c); }} />
                    <Input className="col-span-3" type="number" step="0.01" placeholder="Haber" value={l.haber} onChange={(e) => { const c = [...lineas]; c[i].haber = Number(e.target.value); setLineas(c); }} />
                    <Button size="icon" variant="ghost" onClick={() => setLineas(lineas.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <div className="text-sm font-mono mt-2 flex justify-between">
                  <span>Debe: ${totDebe.toFixed(2)}</span>
                  <span>Haber: ${totHaber.toFixed(2)}</span>
                  <span className={totDebe === totHaber ? "text-green-600" : "text-red-600"}>{totDebe === totHaber ? "✓ Cuadrado" : "✗ Descuadrado"}</span>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={() => crear.mutate()} disabled={crear.isPending || totDebe !== totHaber}>Guardar asiento</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Fecha</TableHead><TableHead>Concepto</TableHead><TableHead>Debe</TableHead><TableHead>Haber</TableHead></TableRow></TableHeader>
          <TableBody>
            {(list.data ?? []).map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono">{a.numero}</TableCell>
                <TableCell>{a.fecha}</TableCell>
                <TableCell>{a.concepto}</TableCell>
                <TableCell>${Number(a.total_debe).toFixed(2)}</TableCell>
                <TableCell>${Number(a.total_haber).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
