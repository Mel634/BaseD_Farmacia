const UMBRAL_STOCK = 5;

export { UMBRAL_STOCK };

/** Envía mensaje por Telegram Bot API (solo necesitas bot token + chat id). */
export async function enviarTelegram(mensaje: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram] Configura TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en .env");
    return false;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: mensaje,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    console.error("[Telegram] Error", res.status, await res.text());
    return false;
  }
  return true;
}

export function mensajeStockBajo(codigo: string, nombre: string, stock: number): string {
  return (
    `⚠️ <b>FarmaSystem — Alerta de inventario</b>\n\n` +
    `¡Ya mismo se nos acaban! El producto <b>${nombre}</b> (${codigo}) ` +
    `solo tiene <b>${stock}</b> unidad${stock === 1 ? "" : "es"} en stock.\n\n` +
    `Se requiere reposición urgente.`
  );
}
