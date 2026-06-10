import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Building2, ShieldCheck, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "FarmaSystem — Farmacia de confianza" },
    { name: "description", content: "Compra medicamentos online con entrega a domicilio o accede al sistema administrativo de FarmaSystem." },
  ] }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-3xl">💊</span>
          <div>
            <div className="font-bold leading-tight">FarmaSystem</div>
            <div className="text-xs text-muted-foreground">Salud al alcance de todos</div>
          </div>
        </div>
        <nav className="flex gap-2 text-sm">
          <Link to="/tienda"><Button variant="ghost" size="sm">Tienda</Button></Link>
          <Link to="/login"><Button variant="outline" size="sm">Ingreso interno</Button></Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <section className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium mb-4">
            <MapPin className="inline h-3 w-3 mr-1" /> 5 sucursales en Ecuador · Entrega 24h
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Tu farmacia, donde la necesites
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Más de 2 mil medicamentos disponibles. Compra online o gestiona tu farmacia
            con nuestro sistema empresarial integrado.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          {/* Cliente */}
          <Card className="border-2 border-emerald-200 hover:shadow-xl transition overflow-hidden group">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white">
                <ShoppingBag className="h-12 w-12 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Soy cliente</h2>
                <p className="text-emerald-50 text-sm">Quiero comprar medicamentos online</p>
              </div>
              <div className="p-6 space-y-3">
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>✓ Catálogo con fotos y precios actualizados</li>
                  <li>✓ Carrito de compras y pago contra entrega</li>
                  <li>✓ Envío a todo el Ecuador</li>
                  <li>✓ Sin necesidad de registro previo</li>
                </ul>
                <Link to="/tienda"><Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                  Entrar a la tienda →
                </Button></Link>
              </div>
            </CardContent>
          </Card>

          {/* Admin */}
          <Card className="border-2 border-slate-200 hover:shadow-xl transition overflow-hidden group">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-8 text-white">
                <Building2 className="h-12 w-12 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Personal interno</h2>
                <p className="text-slate-300 text-sm">Acceso al ERP y administración</p>
              </div>
              <div className="p-6 space-y-3">
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>✓ Dashboard ejecutivo y reportes</li>
                  <li>✓ Inventario, facturación y contabilidad</li>
                  <li>✓ Multi-sucursal y mapa de ventas</li>
                  <li className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Requiere credenciales</li>
                </ul>
                <Link to="/login"><Button variant="outline" className="w-full" size="lg">
                  Ingresar al sistema →
                </Button></Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="text-center text-xs text-muted-foreground mt-16 py-6 border-t">
          © 2026 FarmaSystem · Quito · Guayaquil · Cuenca · Ambato · Portoviejo
        </footer>
      </main>
    </div>
  );
}
