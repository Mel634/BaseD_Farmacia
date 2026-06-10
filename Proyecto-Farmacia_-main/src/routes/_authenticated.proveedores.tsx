import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { SimpleCrud } from "@/components/SimpleCrud";

export const Route = createFileRoute("/_authenticated/proveedores")({ component: Page });
function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Proveedores" />
      <SimpleCrud
        title="Proveedor" table="proveedores"
        fields={[
          { name: "ruc", label: "RUC", required: true },
          { name: "razon_social", label: "Razón Social", required: true },
          { name: "telefono", label: "Teléfono" },
          { name: "email", label: "Email", type: "email" },
          { name: "direccion", label: "Dirección" },
        ]}
        columns={[
          { key: "ruc", label: "RUC" },
          { key: "razon_social", label: "Razón Social" },
          { key: "telefono", label: "Teléfono" },
          { key: "email", label: "Email" },
        ]}
      />
    </div>
  );
}
