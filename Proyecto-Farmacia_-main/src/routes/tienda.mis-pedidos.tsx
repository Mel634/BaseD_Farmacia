import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listarMisPedidos } from "@/lib/tienda.functions";
import { esSesionCliente, esSesionPersonal } from "@/lib/auth-client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LangProvider, useLang } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { ClienteAuthPanel } from "@/components/ClienteAuthPanel";
import { ChatBot } from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft, Loader2, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/tienda/mis-pedidos")({
  head: () => ({ meta: [{ title: "Mis pedidos — FarmaSystem" }] }),
  component: MisPedidosWrapper,
});

function MisPedidosWrapper() {
  return (
    <LangProvider>
      <MisPedidosPage />
    </LangProvider>
  );
}

function MisPedidosPage() {
  const { t } = useLang();
  const fn = useServerFn(listarMisPedidos);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const validar = async (u: any) => {
      if (!u) { setUser(null); return; }
      if (await esSesionCliente(u.id, u.email)) { setUser(u); return; }
      if (await esSesionPersonal(u.id, u.email)) {
        toast.warning("Sesión de personal cerrada.");
        await supabase.auth.signOut();
      }
      setUser(null);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { validar(s?.user ?? null); });
    supabase.auth.getSession().then(({ data: { session } }) => {
      validar(session?.user ?? null).finally(() => setAuthLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const pedidos = useQuery({
    queryKey: ["mis-pedidos", user?.id],
    queryFn: () => fn(),
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster richColors position="top-right" />
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/tienda"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.store")}</Button></Link>
          <span className="font-bold flex items-center gap-2"><Package className="h-4 w-4 text-emerald-700" /> {t("orders.title")}</span>
          <div className="ml-auto"><LangToggle /></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {!user ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>{t("orders.login_title")}</CardTitle>
              <CardDescription>{t("orders.login_sub")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ClienteAuthPanel submitLoginLabel={t("auth.login")} />
            </CardContent>
          </Card>
        ) : pedidos.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
        ) : !pedidos.data?.length ? (
          <Card className="text-center p-10">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">{t("orders.empty")}</p>
            <Link to="/tienda"><Button className="bg-emerald-600 hover:bg-emerald-700">{t("orders.go_shop")}</Button></Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {pedidos.data.map((p: any) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-mono">{p.numero}</CardTitle>
                      <CardDescription>{p.fecha} · {new Date(p.created_at).toLocaleDateString()}</CardDescription>
                    </div>
                    <Badge variant={p.estado === "ANULADA" ? "destructive" : p.estado === "PAGADA" ? "default" : "secondary"}>
                      {p.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {p.items.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm gap-2">
                      <span className="truncate">{it.cantidad}× {it.nombre} <span className="text-muted-foreground font-mono text-xs">({it.codigo})</span></span>
                      <span className="font-mono shrink-0">${Number(it.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold text-emerald-700">
                    <span>{t("cart.total")}</span>
                    <span>${Number(p.total).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <ChatBot />
    </div>
  );
}
