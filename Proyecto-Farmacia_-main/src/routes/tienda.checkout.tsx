import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { crearPedidoTienda, obtenerPerfilCliente } from "@/lib/tienda.functions";
import { ClienteAuthPanel } from "@/components/ClienteAuthPanel";
import { esSesionCliente, esSesionPersonal } from "@/lib/auth-client";
import {
  detectarMarca,
  marcaLabel,
  simularPagoTarjeta,
  validarTarjeta,
  type PaymentStep,
} from "@/lib/payment";
import { cart, useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { LangProvider, useLang } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { ChatBot } from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, Lock, LogOut, User as UserIcon } from "lucide-react";

// Formatea número de tarjeta en grupos de 4
const fmtCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const fmtExp = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export const Route = createFileRoute("/tienda/checkout")({
  head: () => ({ meta: [{ title: "Finalizar compra — FarmaSystem" }] }),
  component: CheckoutWrapper,
});

function CheckoutWrapper() {
  return (
    <LangProvider>
      <CheckoutPage />
    </LangProvider>
  );
}

function CheckoutPage() {
  const { t } = useLang();
  const { items, subtotal, iva, total, count } = useCart();
  const fn = useServerFn(crearPedidoTienda);
  const perfilFn = useServerFn(obtenerPerfilCliente);

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [form, setForm] = useState({ cedula: "", nombre: "", email: "", telefono: "", direccion: "" });
  const [card, setCard] = useState({ numero: "", nombre: "", exp: "", cvv: "" });
  const [procesando, setProcesando] = useState(false);
  const [pasoPago, setPasoPago] = useState<PaymentStep | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [ok, setOk] = useState<{ numero: string; total: number; authCode?: string; last4?: string } | null>(null);

  const cargarPerfil = async () => {
    try {
      const perfil = await perfilFn();
      if (perfil) {
        setForm((f) => ({
          cedula: perfil.cedula || f.cedula,
          nombre: perfil.nombre_completo || f.nombre,
          email: perfil.email || f.email,
          telefono: perfil.telefono || f.telefono,
          direccion: perfil.direccion || f.direccion,
        }));
      }
    } catch { /* sin perfil aún */ }
  };

  const aplicarUsuario = async (u: any) => {
    if (!u) { setUser(null); return; }
    const esCliente = await esSesionCliente(u.id, u.email);
    if (!esCliente) {
      if (await esSesionPersonal(u.id, u.email)) {
        toast.warning("Sesión de personal cerrada. Ingresa como cliente para comprar.");
        await supabase.auth.signOut();
      }
      setUser(null);
      return;
    }
    setUser(u);
    setForm((f) => ({
      ...f,
      email: f.email || u.email || "",
      nombre: f.nombre || (u.user_metadata?.nombre_completo as string) || "",
    }));
    cargarPerfil();
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { aplicarUsuario(s?.user ?? null); });
    supabase.auth.getSession().then(({ data: { session } }) => {
      aplicarUsuario(session?.user ?? null).finally(() => setAuthLoading(false));
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const m = useMutation({
    mutationFn: () => fn({ data: {
      cliente: form,
      items: items.map((i) => ({ id: i.id, cantidad: i.cantidad })),
      authUserId: user?.id,
    } }),
    onSuccess: () => {
      cart.clear();
    },
    onError: (e: any) => toast.error(e?.message ?? "Error"),
  });

  if (ok) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Toaster richColors position="top-right" />
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto" />
            <h1 className="text-2xl font-bold">{t("checkout.ok")}</h1>
            <p className="text-muted-foreground">
              {t("checkout.ok_desc")} <b className="font-mono">{ok.numero}</b> {t("checkout.ok_desc2")} <b>${ok.total.toFixed(2)}</b>. {t("checkout.ok_desc3")}
            </p>
            {ok.authCode && (
              <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
                <div>Pago aprobado · tarjeta •••• {ok.last4}</div>
                <div className="font-mono text-emerald-800">Autorización: {ok.authCode}</div>
              </div>
            )}
            <Link to="/tienda/mis-pedidos"><Button className="w-full bg-emerald-600 hover:bg-emerald-700">{t("orders.view")}</Button></Link>
            <Link to="/tienda"><Button variant="outline" className="w-full">{t("checkout.continue")}</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-3">
            <p className="text-muted-foreground">{t("checkout.cart_empty")}</p>
            <Link to="/tienda"><Button>{t("checkout.to_store")}</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>;
  }

  if (!user) {
    return <AuthGate total={total} count={count} />;
  }

  const cardOk = !validarTarjeta(card);
  const valido = form.cedula && form.nombre && form.email && form.telefono && form.direccion && cardOk;
  const marca = detectarMarca(card.numero);

  const pagar = async () => {
    const err = validarTarjeta(card);
    if (err) { setCardError(err); toast.error(err); return; }
    setCardError(null);
    setProcesando(true);
    setPasoPago("validando");

    const resultado = await simularPagoTarjeta(card, total, setPasoPago);

    if (!resultado.ok) {
      setProcesando(false);
      setPasoPago(null);
      setCardError(resultado.error);
      toast.error(resultado.error);
      return;
    }

    m.mutate(undefined, {
      onSuccess: (res) => {
        setOk({
          numero: res.numero ?? "",
          total: res.total,
          authCode: resultado.authCode,
          last4: resultado.last4,
        });
        setProcesando(false);
        setPasoPago(null);
      },
      onError: () => {
        setProcesando(false);
        setPasoPago(null);
      },
    });
  };

  const pasoLabel = (p: PaymentStep | null) => {
    if (p === "validando") return "Validando tarjeta…";
    if (p === "banco") return "Contactando banco emisor…";
    if (p === "3ds") return "Verificación 3D Secure…";
    if (p === "confirmando") return "Confirmando transacción…";
    return "";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster richColors position="top-right" />
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/tienda"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.store")}</Button></Link>
          <span className="font-bold">{t("checkout.title")}</span>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <LangToggle />
            <UserIcon className="h-3.5 w-3.5 text-emerald-700" />
            <span className="text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              <LogOut className="h-3 w-3 mr-1" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>{t("checkout.shipping")}</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <div><Label>{t("checkout.cedula")}</Label><Input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} maxLength={13} /></div>
              <div><Label>{t("checkout.name")}</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
              <div><Label>{t("checkout.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>{t("checkout.phone")}</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>{t("checkout.address")}</Label><Textarea rows={2} value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-emerald-700" /> {t("checkout.payment")}</CardTitle>
              <CardDescription>
                Pasarela simulada · Visa/Mastercard válidas con Luhn · Prueba: 4242 4242 4242 4242 (éxito)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Vista previa tarjeta */}
              <div className="rounded-xl p-5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs uppercase tracking-widest opacity-80">FarmaSystem Pay</span>
                  <div className="text-right text-xs opacity-90">
                    <CreditCard className="h-6 w-6 ml-auto mb-1" />
                    {card.numero.length >= 4 && <span>{marcaLabel(marca)}</span>}
                  </div>
                </div>
                <div className="font-mono text-lg tracking-widest mb-4">
                  {card.numero || "•••• •••• •••• ••••"}
                </div>
                <div className="flex justify-between text-xs">
                  <div>
                    <div className="opacity-60">TITULAR</div>
                    <div className="uppercase">{card.nombre || "NOMBRE APELLIDO"}</div>
                  </div>
                  <div>
                    <div className="opacity-60">VENCE</div>
                    <div>{card.exp || "MM/AA"}</div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label>Número de tarjeta</Label>
                  <Input inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.numero} onChange={(e) => setCard({ ...card, numero: fmtCard(e.target.value) })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Nombre en la tarjeta</Label>
                  <Input placeholder="Como aparece en la tarjeta" value={card.nombre} onChange={(e) => setCard({ ...card, nombre: e.target.value })} />
                </div>
                <div>
                  <Label>Vencimiento</Label>
                  <Input inputMode="numeric" placeholder="MM/AA" value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input inputMode="numeric" placeholder="123" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                </div>
              </div>
              {cardError && <p className="text-sm text-red-600">{cardError}</p>}
              <p className="text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3 inline mr-1" />
                Simulación segura · Rechazo: 4000 0000 0000 0002 (sin fondos) · 4000 0000 0000 9995 (rechazada)
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader><CardTitle>{t("checkout.summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
                {items.map((it) => (
                  <div key={it.id} className="flex justify-between gap-2">
                    <span className="truncate flex-1">{it.cantidad}× {it.nombre}</span>
                    <span className="font-mono">${(it.precio * it.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 text-sm space-y-1">
                <div className="flex justify-between"><span>{t("cart.subtotal")}</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>{t("cart.iva")}</span><span>${iva.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t"><span>{t("cart.total")}</span><span className="text-emerald-700">${total.toFixed(2)}</span></div>
              </div>
              {procesando && pasoPago && (
                <div className="text-xs text-center text-emerald-700 bg-emerald-50 rounded-md py-2 px-2 flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {pasoLabel(pasoPago)}
                </div>
              )}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={!valido || procesando || m.isPending} onClick={pagar}>
                {(procesando || m.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {procesando ? pasoLabel(pasoPago) || "Procesando…" : m.isPending ? "Registrando pedido…" : `Pagar $${total.toFixed(2)}`}
              </Button>
              {!valido && (
                <p className="text-[11px] text-center text-amber-700">Completa todos los datos de envío y la tarjeta para continuar.</p>
              )}
              <p className="text-[10px] text-center text-muted-foreground">{t("checkout.terms")}</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <ChatBot />
    </div>
  );
}

function AuthGate({ total, count }: { total: number; count: number }) {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Toaster richColors position="top-right" />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-end"><LangToggle /></div>
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <Lock className="h-6 w-6 text-emerald-700" />
          </div>
          <CardTitle className="mt-2">{t("auth.title")}</CardTitle>
          <CardDescription>
            {t("auth.cart_has")} {count} {t("auth.products")}{count !== 1 ? "s" : ""} {t("auth.in_cart")} · {t("cart.total")} <b className="text-emerald-700">${total.toFixed(2)}</b>
            <br />{t("auth.subtitle_client")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClienteAuthPanel submitLoginLabel={t("auth.login_btn")} />
          <div className="text-center mt-4">
            <Link to="/tienda" className="text-xs text-muted-foreground hover:underline">{t("auth.back_store")}</Link>
          </div>
        </CardContent>
      </Card>
      <ChatBot />
    </div>
  );
}
