import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant" | "system"; content: string };

type ProductoSugerido = {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
};

function extraerProductosMencionados(
  reply: string,
  prods: { id: string; codigo: string; nombre: string; precio_venta: number; stock: number }[]
): ProductoSugerido[] {
  const replyLower = reply.toLowerCase();
  return prods
    .filter((p) => replyLower.includes(p.nombre.toLowerCase()))
    .map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      precio: Number(p.precio_venta),
      stock: p.stock,
    }));
}

export const chatBot = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: Msg[]; lang: "es" | "en"; imagen?: string }) => d)
  .handler(async ({ data }) => {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error("GROQ_API_KEY no configurada");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prods } = await supabaseAdmin
      .from("productos")
      .select("id, codigo, nombre, categoria, precio_venta, stock")
      .eq("activo", true)
      .gt("stock", 0)
      .order("nombre")
      .limit(40);

    const catalogo = (prods ?? [])
      .map((p) => `- ${p.codigo} | ${p.nombre} (${p.categoria ?? "—"}) — $${Number(p.precio_venta).toFixed(2)} · stock ${p.stock}`)
      .join("\n");

    const systemEs = `Eres "FarmaBot", asistente virtual de la farmacia FarmaSystem.
Responde SIEMPRE en español, breve (máximo 4 frases), amable y profesional.
Ayudas a los clientes a encontrar medicamentos, explicar usos generales y guiarlos en el proceso de compra.
NUNCA des diagnósticos médicos ni reemplaces la consulta a un profesional.
Si el usuario pide recomendaciones sobre síntomas o qué medicamento tomar, responde SIEMPRE primero con: '⚠️ No soy médico. Para diagnósticos consulta un profesional de la salud.' y luego puedes dar información general sobre el medicamento.

Cuando el usuario envíe una imagen de receta médica:
1. Identifica los medicamentos mencionados en la receta.
2. Busca cuáles de esos medicamentos están en el catálogo disponible.
3. Responde con una lista clara de los medicamentos disponibles con su precio, y menciona cuáles NO están disponibles.
4. Al final de tu respuesta, si encontraste productos disponibles, pregunta EXACTAMENTE: '¿Deseas que agregue estos productos a tu carrito?'

CATÁLOGO ACTUAL DISPONIBLE:
${catalogo}`;

    const systemEn = `You are "FarmaBot", virtual assistant of FarmaSystem pharmacy.
ALWAYS reply in English, short (max 4 sentences), friendly and professional.
Help customers find medicines and guide them through purchase.
NEVER give medical diagnoses or replace a professional consultation.
If the user asks for recommendations about symptoms or what medicine to take, ALWAYS reply first with: '⚠️ No soy médico. Para diagnósticos consulta un profesional de la salud.' and then you may provide general information about the medicine.

When the user sends a prescription image:
1. Identify the medicines mentioned in the prescription.
2. Check which ones are in the available catalog.
3. Reply with a clear list of available medicines with price, and mention which ones are NOT available.
4. At the end of your response, if you found available products, ask EXACTLY: '¿Deseas que agregue estos productos a tu carrito?'

CURRENT AVAILABLE CATALOG:
${catalogo}`;

    const system = data.lang === "en" ? systemEn : systemEs;

    if (data.imagen) {
      const base64 = data.imagen.split(",")[1];
      const mimeMatch = data.imagen.match(/data:(image\/[a-zA-Z]+);base64/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const textoUsuario = data.messages[data.messages.length - 1]?.content
        || "Analiza esta receta médica y dime qué medicamentos tienes disponibles en tu catálogo.";

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
                { type: "text", text: textoUsuario },
              ],
            },
          ],
          max_tokens: 1024,
        }),
      });

      if (res.status === 429) return { reply: "Demasiadas solicitudes, intenta en un momento.", productos: [] };
      if (!res.ok) {
        const txt = await res.text();
        console.error("Groq vision error", res.status, txt);
        throw new Error("Error al analizar la imagen");
      }

      const json = await res.json();
      const replyText = json?.choices?.[0]?.message?.content ?? "";
      const productos = extraerProductosMencionados(replyText, prods ?? []);
      return { reply: replyText, productos };
    }

    const mensajes = data.messages.map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: system }, ...mensajes],
        max_tokens: 1024,
      }),
    });

    if (res.status === 429) return { reply: "Demasiadas solicitudes, intenta en un momento.", productos: [] };
    if (!res.ok) throw new Error("Error del servidor");

    const json = await res.json();
    const replyText = json?.choices?.[0]?.message?.content ?? "";
    const productos = extraerProductosMencionados(replyText, prods ?? []);
    return { reply: replyText, productos };
  });
