import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatBot } from "@/lib/chatbot.functions";
import { cart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Loader2, Bot, ImagePlus } from "lucide-react";
import { toast } from "sonner";

type ProductoSugerido = {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
};

type Msg = { role: "user" | "assistant"; content: string; imagen?: string; productos?: ProductoSugerido[] };

export function ChatBot() {
  const { t, lang } = useLang();
  const fn = useServerFn(chatBot);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingCart, setPendingCart] = useState<ProductoSugerido[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMsgs([{ role: "assistant", content: t("bot.welcome") + "\n\n" + (lang === "en"
      ? "📋 You can also upload a photo of your prescription and I'll tell you which medicines we have available."
      : "📋 También puedes subir una foto de tu receta médica y te diré qué medicamentos tenemos disponibles.") }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const send = async () => {
    const txt = input.trim() || (preview ? "Analiza mi receta médica y dime qué medicamentos tienes disponibles." : "");
    if (!txt || busy) return;

    // Detectar confirmaciÃ³n o rechazo del carrito pendiente
    const ultimoMensajeBot = [...msgs].reverse().find(m => m.role === "assistant");
    const preguntoPorCarrito = ultimoMensajeBot?.content?.toLowerCase().includes("carrito");
    if (pendingCart.length > 0 && preguntoPorCarrito) {
      const lower = txt.toLowerCase().trim();
      const esConfirmacion = ["sÃ­", "si", "yes", "claro", "ok", "dale",
        "agrÃ©galos", "agregalos", "por favor", "sÃ­ por favor", "si por favor"]
        .some((w) => lower.includes(w));
      const esRechazo = ["no", "nope", "no gracias", "nel", "negativo"]
        .some((w) => lower === w || lower.startsWith(w + " "));

      if (esConfirmacion) {
        pendingCart.forEach((p) =>
          cart.add({ id: p.id, codigo: p.codigo, nombre: p.nombre, precio: p.precio })
        );
        const nombres = pendingCart.map((p) => p.nombre).join(", ");
        toast.success(`Agregado al carrito: ${nombres}`);
        setMsgs((prev) => [
          ...prev,
          { role: "user", content: txt },
          { role: "assistant", content: `Listo, agregue ${pendingCart.length} producto(s) a tu carrito: ${nombres}. Puedes continuar comprando.` },
        ]);
        setPendingCart([]);
        setInput("");
        return;
      }

      if (esRechazo) {
        setMsgs((prev) => [
          ...prev,
          { role: "user", content: txt },
          { role: "assistant", content: "Entendido, cuando quieras puedes agregarlos desde la tienda. En que mas puedo ayudarte?" },
        ]);
        setPendingCart([]);
        setInput("");
        return;
      }
    }

    const next: Msg[] = [...msgs, { role: "user", content: txt, imagen: preview ?? undefined }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    const imagenEnviada = preview;
    setPreview(null);

    try {
      const mensajesLimpios = next.map(({ imagen: _, ...m }) => m);
      const res = await fn({ data: { messages: mensajesLimpios, lang, imagen: imagenEnviada ?? undefined } });
      const productosEncontrados = res.productos ?? [];
      setMsgs([...next, { role: "assistant", content: res.reply || t("bot.error"), productos: productosEncontrados }]);
      setPendingCart(productosEncontrados);
    } catch {
      setMsgs([...next, { role: "assistant", content: t("bot.error") }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center transition hover:scale-105"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-xl shadow-2xl border flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{t("bot.title")}</div>
              <div className="text-[10px] text-emerald-50">{t("bot.sub")}</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap space-y-2 ${
                  m.role === "user" ? "bg-emerald-600 text-white rounded-br-sm" : "bg-white border rounded-bl-sm"
                }`}>
                  {m.imagen && (
                    <img src={m.imagen} alt="receta" className="rounded-lg max-h-40 w-full object-cover" />
                  )}
                  <span>{m.content}</span>
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                </div>
              </div>
            )}
          </div>

          {preview && (
            <div className="px-3 pt-2 flex items-center gap-2">
              <div className="relative">
                <img src={preview} alt="preview" className="h-14 w-14 rounded-lg object-cover border" />
                <button
                  onClick={() => setPreview(null)}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center"
                >×</button>
              </div>
              <span className="text-xs text-muted-foreground">Receta lista para analizar</span>
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t p-2 flex gap-2 bg-white"
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagen} />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              title="Subir receta médica"
            >
              <ImagePlus className="h-4 w-4 text-emerald-600" />
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={preview ? "Enviar receta…" : t("bot.placeholder")}
              disabled={busy}
              className="flex-1"
            />
            <Button type="submit" size="icon" className="bg-emerald-600 hover:bg-emerald-700" disabled={busy || (!input.trim() && !preview)}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
