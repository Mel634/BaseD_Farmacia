import { ReactNode, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export type Field = { name: string; label: string; type?: "text" | "number" | "date" | "email"; required?: boolean; step?: string; pattern?: "solo-letras" | "solo-numeros" | "cedula" };

export function SimpleCrud({
  table, fields, columns, title, afterSave,
}: {
  table: string;
  fields: Field[];
  columns: { key: string; label: string; render?: (v: any, row: any) => ReactNode }[];
  title: string;
  afterSave?: (ctx: { id?: string; payload: Record<string, unknown> }) => void | Promise<void>;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const list = useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) {
        const { error } = await supabase.from(table as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async (_data, payload) => {
      toast.success(editing ? "Actualizado" : "Creado");
      const savedId = editing?.id as string | undefined;
      setOpen(false); setEditing(null); setForm({});
      qc.invalidateQueries({ queryKey: [table] });
      if (afterSave) await afterSave({ id: savedId, payload });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Eliminado"); qc.invalidateQueries({ queryKey: [table] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (row: any) => {
    setEditing(row);
    const f: any = {}; fields.forEach((x) => f[x.name] = row[x.name] ?? "");
    setForm(f); setOpen(true);
  };
  const openNew = () => { setEditing(null); setForm({}); setOpen(true); };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{list.data?.length ?? 0} registros</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nuevo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} {title}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-3">
                {fields.map((f) => (
                  <div key={f.name}>
                    <Label>{f.label}</Label>
                    <Input
                      type={f.type ?? "text"} required={f.required} step={f.step}
                      value={form[f.name] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (f.pattern === "solo-letras" && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(value)) {
                          toast.error(`${f.label}: solo se permiten letras`);
                          return;
                        }
                        if (f.pattern === "solo-numeros" && !/^[0-9]*$/.test(value)) {
                          toast.error(`${f.label}: solo se permiten números`);
                          return;
                        }
                        if (f.pattern === "cedula") {
                          if (!/^[0-9]*$/.test(value) || value.length > 10) {
                            toast.error(`${f.label}: solo números, máximo 10 dígitos`);
                            return;
                          }
                        }
                        setForm({ ...form, [f.name]: f.type === "number" ? Number(value) : value });
                      }}
                    />
                  </div>
                ))}
                <DialogFooter><Button type="submit" disabled={save.isPending}>{save.isPending ? "Guardando..." : "Guardar"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader><TableRow>
            {columns.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
            <TableHead className="w-24 text-right">Acciones</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(list.data ?? []).map((row: any) => (
              <TableRow key={row.id}>
                {columns.map((c) => <TableCell key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</TableCell>)}
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>¿Eliminar?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(row.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
