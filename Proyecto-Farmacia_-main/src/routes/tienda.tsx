import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listarProductosTienda } from "@/lib/tienda.functions";
import { ClienteAuthPanel } from "@/components/ClienteAuthPanel";
import { esSesionCliente, esSesionPersonal } from "@/lib/auth-client";
import { cart, useCart, productImage } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { LangProvider, useLang } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { ChatBot } from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ShoppingCart, Search, Plus, Minus, Trash2, Pill, Home, Lock, LogOut, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/tienda")({
  head: () => ({ meta: [
    { title: "Tienda FarmaSystem — Compra medicamentos online" },
    { name: "description", content: "Catálogo de medicamentos con entrega a domicilio. Compra fácil y segura." },
  ] }),
  component: TiendaWrapper,
});

function TiendaWrapper() {
  return (
    <LangProvider>
      <TiendaPage />
    </LangProvider>
  );
}

function TiendaPage() {
  const { t } = useLang();
  const fn = useServerFn(listarProductosTienda);
  const { data: productos = [], isLoading } = useQuery({ queryKey: ["tienda-productos"], queryFn: () => fn() });
  const { count, total } = useCart();
  const [q, setQ] = useState("");
  const [catSel, setCatSel] = useState<string>("__all__");

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => {
    const validar = async (u: typeof user) => {
      if (!u) { setUser(null); return; }
      const esCliente = await esSesionCliente(u.id, u.email);
      if (!esCliente) {
        const personal = await esSesionPersonal(u.id, u.email);
        if (personal) {
          toast.warning("Sesión de personal cerrada. Ingresa o regístrate como cliente.");
          await supabase.auth.signOut();
        }
        setUser(null);
        return;
      }
      setUser(u);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { validar(s?.user ?? null); });
    supabase.auth.getSession().then(({ data: { session } }) => validar(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    productos.forEach((p: any) => p.categoria && set.add(p.categoria));
    return ["__all__", ...Array.from(set).sort()];
  }, [productos]);

  const lista = useMemo(() => {
    const term = q.trim().toLowerCase();
    return productos.filter((p: any) => {
      if (catSel !== "__all__" && p.categoria !== catSel) return false;
      if (!term) return true;
      return p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term);
    });
  }, [productos, q, catSel]);

  const requireAuth = () => {
    if (!user) { setAuthOpen(true); return false; }
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster richColors position="top-right" />

      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">💊</span>
            <div className="hidden sm:block">
              <div className="font-bold leading-tight">FarmaSystem</div>
              <div className="text-[10px] text-muted-foreground">{t("store.tagline")}</div>
            </div>
          </Link>

          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("store.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <LangToggle />

          <Link to="/" className="hidden lg:block"><Button variant="ghost" size="sm"><Home className="h-4 w-4 mr-1" /> {t("nav.home")}</Button></Link>

          {user ? (
            <>
              <Link to="/tienda/mis-pedidos" className="hidden md:block">
                <Button variant="ghost" size="sm"><Package className="h-4 w-4 mr-1" /> {t("orders.title")}</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="hidden md:inline-flex">
                <LogOut className="h-4 w-4 mr-1" /> {user.email?.split("@")[0]}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)} className="hidden md:inline-flex">
              <Lock className="h-4 w-4 mr-1" /> {t("auth.login")}
            </Button>
          )}

          <CartSheet />
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {categorias.map((c) => (
            <button key={c} onClick={() => setCatSel(c)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition ${
                catSel === c ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-slate-100"
              }`}>{c === "__all__" ? t("store.all") : c}</button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 mb-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("store.hero.title")}</h1>
            <p className="text-emerald-50 text-sm mt-1">{t("store.hero.sub")}</p>
          </div>
          <Pill className="h-16 w-16 opacity-30 hidden md:block" />
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">{t("store.loading")}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">{lista.length} {t("store.results")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {lista.map((p: any) => <ProductCard key={p.id} producto={p} requireAuth={requireAuth} />)}
            </div>
            {lista.length === 0 && <p className="text-center text-muted-foreground py-12">{t("store.empty")}</p>}
          </>
        )}
      </main>

      {count > 0 && (
        <div className="md:hidden fixed bottom-20 inset-x-0 bg-white border-t p-3 shadow-lg z-40">
          <Link to="/tienda/checkout">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              {t("cart.checkout")} · ${total.toFixed(2)} ({count})
            </Button>
          </Link>
        </div>
      )}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <ChatBot />
    </div>
  );
}

function ProductCard({ producto, requireAuth }: { producto: any; requireAuth: () => boolean }) {
  const { t } = useLang();
  const img = productImage(producto.categoria, producto.nombre);
  const bajoStock = producto.stock <= 10;
  return (
    <Card className="overflow-hidden hover:shadow-md transition">
      <div className="aspect-square bg-white relative overflow-hidden">
        <img src={img} alt={producto.nombre} loading="lazy" width={512} height={512} className="w-full h-full object-cover hover:scale-105 transition" />
        {bajoStock && (
          <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-[10px]">{t("store.last")} {producto.stock}{t("store.last2")}</Badge>
        )}
        {producto.categoria && (
          <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">{producto.categoria}</Badge>
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <div>
          <div className="text-[10px] text-muted-foreground font-mono">{producto.codigo}</div>
          <div className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">{producto.nombre}</div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-emerald-700">${Number(producto.precio_venta).toFixed(2)}</span>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => {
            if (!requireAuth()) {
              toast.warning(t("cart.login_required"));
              return;
            }
            cart.add({ id: producto.id, codigo: producto.codigo, nombre: producto.nombre, precio: Number(producto.precio_venta), imagen: img });
            toast.success(`${producto.nombre} ${t("cart.added")}`);
          }}>
            <Plus className="h-3 w-3 mr-1" /> {t("store.add")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CartSheet() {
  const { t } = useLang();
  const { items, count, subtotal, iva, total } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">{t("store.cart")}</span>
          {count > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 bg-emerald-600 text-white text-[10px]">{count}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader><SheetTitle>{t("cart.title")} ({count})</SheetTitle></SheetHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-3">
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">{t("cart.empty")}</p>}
          {items.map((it) => (
            <div key={it.id} className="flex gap-3 border-b pb-3">
              <img src={it.imagen} alt="" className="w-16 h-16 rounded object-cover bg-white" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-2">{it.nombre}</div>
                <div className="text-xs text-muted-foreground">${it.precio.toFixed(2)}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => cart.set(it.id, it.cantidad - 1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-8 text-center text-sm">{it.cantidad}</span>
                  <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => cart.set(it.id, it.cantidad + 1)}><Plus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto text-destructive" onClick={() => cart.remove(it.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="text-sm font-semibold">${(it.precio * it.cantidad).toFixed(2)}</div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>{t("cart.subtotal")}</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>{t("cart.iva")}</span><span>${iva.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t"><span>{t("cart.total")}</span><span className="text-emerald-700">${total.toFixed(2)}</span></div>
            <Button className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setOpen(false); navigate({ to: "/tienda/checkout" }); }}>
              {t("cart.checkout")}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useLang();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-emerald-700" />
          </div>
          <DialogTitle className="text-center">{t("auth.title")}</DialogTitle>
          <DialogDescription className="text-center">{t("auth.subtitle_client")}</DialogDescription>
        </DialogHeader>
        <ClienteAuthPanel onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
