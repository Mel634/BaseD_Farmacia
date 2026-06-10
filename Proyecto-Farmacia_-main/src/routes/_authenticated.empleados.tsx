import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { SimpleCrud } from "@/components/SimpleCrud";

export const Route = createFileRoute("/_authenticated/empleados")({ component: Page });
function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Empleados" />
      <SimpleCrud
        title="Empleado" table="empleados"
        fields={[
          { name: "cedula", label: "Cédula", required: true },
          { name: "nombre_completo", label: "Nombre completo", required: true },
          { name: "cargo", label: "Cargo", required: true },
          { name: "salario", label: "Salario", type: "number", step: "0.01", required: true },
          { name: "fecha_ingreso", label: "Fecha de ingreso", type: "date" },
        ]}
        columns={[
          { key: "cedula", label: "Cédula" },
          { key: "nombre_completo", label: "Nombre" },
          { key: "cargo", label: "Cargo" },
          { key: "salario", label: "Salario", render: (v) => `$${Number(v).toFixed(2)}` },
        ]}
      />
    </div>
  );
}
