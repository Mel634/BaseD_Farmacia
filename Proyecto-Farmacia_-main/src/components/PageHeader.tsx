import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 print:mb-3">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="flex gap-2 print:hidden">{actions}</div>
    </div>
  );
}

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} variant="outline">
      <Printer className="h-4 w-4 mr-2" /> 📥 Exportar para defensa (PDF)
    </Button>
  );
}
