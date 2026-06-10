import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { SimpleCrud } from "@/components/SimpleCrud";

export const Route = createFileRoute("/_authenticated/clientes")({ component: Page });
function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" />
      <SimpleCrud
        title="Cliente" table="clientes"
        fields={[
          { name: "cedula", label: "Cédula", required: true },
          { name: "nombre_completo", label: "Nombre completo", required: true },
          { name: "telefono", label: "Teléfono" },
          { name: "email", label: "Email", type: "email" },
          { name: "direccion", label: "Dirección" },
          { name: "historial_medico", label: "Historial médico (LOPD)" },
        ]}
        columns={[
          { key: "cedula", label: "Cédula" },
          { key: "nombre_completo", label: "Nombre" },
          { key: "telefono", label: "Teléfono" },
          { key: "email", label: "Email" },
        ]}
      />
    </div>
  );
}
