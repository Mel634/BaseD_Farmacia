// Carrito de compras simple basado en localStorage
import { useEffect, useState } from "react";
import medParacetamol from "@/assets/med-paracetamol.jpg";
import medIbuprofeno from "@/assets/med-ibuprofeno.jpg";
import medAmoxicilina from "@/assets/med-amoxicilina.jpg";
import medOmeprazol from "@/assets/med-omeprazol.jpg";
import medLoratadina from "@/assets/med-loratadina.jpg";
import medVitaminaC from "@/assets/med-vitaminac.jpg";
import medAspirina from "@/assets/med-aspirina.jpg";
import medInsulina from "@/assets/med-insulina.jpg";
import medSalbutamol from "@/assets/med-salbutamol.jpg";
import medEnalapril from "@/assets/med-enalapril.jpg";
import medDiclofenaco from "@/assets/med-diclofenaco.jpg";
import medComplejoB from "@/assets/med-complejob.jpg";

export type CartItem = {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
};

const KEY = "farmasystem_cart";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:changed"));
}

export const cart = {
  get: read,
  add(p: Omit<CartItem, "cantidad">, qty = 1) {
    const items = read();
    const ex = items.find((x) => x.id === p.id);
    if (ex) ex.cantidad += qty;
    else items.push({ ...p, cantidad: qty });
    write(items);
  },
  set(id: string, qty: number) {
    const items = read().map((x) => (x.id === id ? { ...x, cantidad: Math.max(1, qty) } : x));
    write(items);
  },
  remove(id: string) { write(read().filter((x) => x.id !== id)); },
  clear() { write([]); },
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const h = () => setItems(read());
    window.addEventListener("cart:changed", h);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener("cart:changed", h); window.removeEventListener("storage", h); };
  }, []);
  const subtotal = items.reduce((s, x) => s + x.precio * x.cantidad, 0);
  const iva = +(subtotal * 0.15).toFixed(2);
  const total = +(subtotal + iva).toFixed(2);
  const count = items.reduce((s, x) => s + x.cantidad, 0);
  return { items, subtotal, iva, total, count };
}

// Mapeo nombre → imagen real generada del producto
const NAME_IMG: { match: RegExp; url: string }[] = [
  { match: /paracetamol|acetaminof/i, url: medParacetamol },
  { match: /ibuprofeno/i, url: medIbuprofeno },
  { match: /amoxicilina|azitromicina/i, url: medAmoxicilina },
  { match: /omeprazol|ranitidina/i, url: medOmeprazol },
  { match: /loratadina|cetirizina/i, url: medLoratadina },
  { match: /vitamina c/i, url: medVitaminaC },
  { match: /complejo b/i, url: medComplejoB },
  { match: /aspirina/i, url: medAspirina },
  { match: /insulina/i, url: medInsulina },
  { match: /salbutamol|inhalador/i, url: medSalbutamol },
  { match: /enalapril/i, url: medEnalapril },
  { match: /diclofenaco|naproxeno/i, url: medDiclofenaco },
  { match: /vitamina/i, url: medComplejoB },
];

const FALLBACK = medParacetamol;

export function productImage(_categoria?: string | null, nombre?: string | null): string {
  if (nombre) {
    const hit = NAME_IMG.find((n) => n.match.test(nombre));
    if (hit) return hit.url;
  }
  return FALLBACK;
}
