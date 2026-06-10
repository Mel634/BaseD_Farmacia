import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { SimpleCrud } from "@/components/SimpleCrud";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/plan-cuentas")({ component: Page });
function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Plan de Cuentas" />
      <SimpleCrud
        title="Cuenta" table="plan_cuentas"
        fields={[
          { name: "codigo", label: "Código", required: true },
          { name: "nombre", label: "Nombre", required: true },
          { name: "tipo", label: "Tipo (ACTIVO/PASIVO/PATRIMONIO/INGRESO/GASTO)", required: true },
          { name: "naturaleza", label: "Naturaleza (DEUDORA/ACREEDORA)", required: true },
        ]}
        columns={[
          { key: "codigo", label: "Código" },
          { key: "nombre", label: "Nombre" },
          { key: "tipo", label: "Tipo", render: (v) => <Badge variant="outline">{v}</Badge> },
          { key: "naturaleza", label: "Naturaleza" },
        ]}
      />
    </div>
  );
}
