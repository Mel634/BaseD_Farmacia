export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

export type CardInput = {
  numero: string;
  nombre: string;
  exp: string;
  cvv: string;
};

export type PaymentResult =
  | { ok: true; authCode: string; last4: string; brand: CardBrand }
  | { ok: false; error: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function soloDigitos(num: string): string {
  return num.replace(/\D/g, "");
}

export function luhnValido(num: string): boolean {
  const d = soloDigitos(num);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function detectarMarca(num: string): CardBrand {
  const d = soloDigitos(num);
  if (/^4/.test(d)) return "visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  return "unknown";
}

export function marcaLabel(brand: CardBrand): string {
  if (brand === "visa") return "Visa";
  if (brand === "mastercard") return "Mastercard";
  if (brand === "amex") return "American Express";
  return "Tarjeta";
}

export function vencimientoValido(exp: string): boolean {
  const m = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expDate = new Date(year, month, 0, 23, 59, 59);
  return expDate >= new Date(now.getFullYear(), now.getMonth(), 1);
}

export function validarTarjeta(card: CardInput): string | null {
  const digits = soloDigitos(card.numero);
  const brand = detectarMarca(digits);

  if (digits.length !== 16 && !(brand === "amex" && digits.length === 15)) {
    return "Número de tarjeta incompleto.";
  }
  if (!luhnValido(digits)) return "Número de tarjeta inválido.";
  if (card.nombre.trim().length < 3) return "Ingresa el nombre del titular.";
  if (!vencimientoValido(card.exp)) return "Fecha de vencimiento inválida o expirada.";
  const cvvLen = brand === "amex" ? 4 : 3;
  if (card.cvv.length !== cvvLen) return `CVV debe tener ${cvvLen} dígitos.`;
  return null;
}

export type PaymentStep = "validando" | "banco" | "3ds" | "confirmando";

/** Simula pasarela de pago con tarjetas de prueba. */
export async function simularPagoTarjeta(
  card: CardInput,
  amount: number,
  onStep?: (step: PaymentStep) => void,
): Promise<PaymentResult> {
  const err = validarTarjeta(card);
  if (err) return { ok: false, error: err };

  const digits = soloDigitos(card.numero);
  const brand = detectarMarca(digits);

  onStep?.("validando");
  await sleep(900);

  // Tarjetas de prueba (estilo Stripe)
  if (digits.startsWith("4000000000000002")) {
    return { ok: false, error: "Fondos insuficientes en la tarjeta." };
  }
  if (digits.startsWith("4000000000009995")) {
    return { ok: false, error: "Tarjeta rechazada por el banco emisor." };
  }
  if (digits.startsWith("4000000000000127")) {
    return { ok: false, error: "CVV incorrecto." };
  }

  onStep?.("banco");
  await sleep(1400);

  onStep?.("3ds");
  await sleep(1200);

  onStep?.("confirmando");
  await sleep(800);

  const authCode = `FS${Date.now().toString(36).toUpperCase().slice(-8)}`;
  return { ok: true, authCode, last4: digits.slice(-4), brand };
}
