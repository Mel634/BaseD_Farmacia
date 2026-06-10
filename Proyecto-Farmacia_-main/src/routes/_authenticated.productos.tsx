import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/PageHeader";
import { SimpleCrud } from "@/components/SimpleCrud";
import { Badge } from "@/components/ui/badge";
import { verificarAlertasStock } from "@/lib/stock-alert.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/productos")({ component: Page });

function Page() {
  const checkStock = useServerFn(verificarAlertasStock);

  return (
    <div className="space-y-6">
      <PageHeader title="Productos" subtitle="Inventario de medicamentos" />
      <SimpleCrud
        title="Producto" table="productos"
        fields={[
          { name: "codigo", label: "Código", required: true },
          { name: "nombre", label: "Nombre", required: true },
          { name: "categoria", label: "Categoría" },
          { name: "precio_compra", label: "Precio compra", type: "number", step: "0.01", required: true },
          { name: "precio_venta", label: "Precio venta", type: "number", step: "0.01", required: true },
          { name: "stock", label: "Stock", type: "number", required: true },
          { name: "stock_minimo", label: "Stock mínimo", type: "number", required: true },
        ]}
        columns={[
          { key: "codigo", label: "Código" },
          { key: "nombre", label: "Nombre" },
          { key: "categoria", label: "Categoría" },
          { key: "precio_venta", label: "P. Venta", render: (v) => `$${Number(v).toFixed(2)}` },
          { key: "stock", label: "Stock", render: (v, r) => <Badge variant={v <= r.stock_minimo ? "destructive" : "secondary"}>{v}</Badge> },
        ]}
        afterSave={async ({ id, payload }) => {
          if (!id || payload.stock === undefined) return;
          if (Number(payload.stock) > 5) return;
          try {
            const { enviados } = await checkStock({ data: { productoIds: [id] } });
            if (enviados.length) toast.warning(`Alerta Telegram: stock bajo en ${enviados.join(", ")}`);
          } catch { /* no bloquear guardado */ }
        }}
      />
    </div>
  );
}
