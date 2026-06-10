import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { esCorreoPersonal, STAFF_EMAIL } from "@/lib/auth-constants";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
  sanitizeInput,
  validateEmail,
  validatePassword,
} from "@/lib/security";

function authClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Configuración de Supabase incompleta.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function sessionFromSignIn(email: string, password: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const auth = authClient();
  const mail = email.trim().toLowerCase();

  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const user = existing.users.find((u) => u.email?.toLowerCase() === mail);
  if (user) await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });

  const { data, error } = await auth.auth.signInWithPassword({ email: mail, password });
  if (error) return { error: error.message.includes("Invalid") ? "Correo o contraseña incorrectos." : error.message };
  if (!data.session) return { error: "No se pudo iniciar sesión." };

  return {
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
    userId: data.user!.id,
  };
}

async function esPersonal(sb: { from: (t: string) => any }, userId: string) {
  const { data: profile } = await sb.from("profiles").select("id").eq("id", userId).maybeSingle();
  return !!profile;
}

/** Registro de clientes de la tienda online */
export const registroCliente = createServerFn({ method: "POST" })
  .inputValidator((d: {
    email: string;
    password: string;
    nombre: string;
    cedula: string;
    telefono?: string;
    direccion?: string;
  }) => d)
  .handler(async ({ data }) => {
    const email = sanitizeInput(data.email).toLowerCase();
    const password = sanitizeInput(data.password);
    const nombre = sanitizeInput(data.nombre);
    const cedula = sanitizeInput(data.cedula);
    const telefono = data.telefono ? sanitizeInput(data.telefono) : "";
    const direccion = data.direccion ? sanitizeInput(data.direccion) : "";

    if (!validateEmail(email)) {
      return { error: "Formato de correo inválido." };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { error: passwordValidation.message };
    }

    if (!/^\d{10}$/.test(cedula)) {
      return { error: "La cédula debe contener exactamente 10 dígitos." };
    }

    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(nombre)) {
      return { error: "El nombre solo puede contener letras y espacios." };
    }

    if (esCorreoPersonal(email)) {
      return { error: "Este correo es de personal. Usa Ingreso interno en la página principal." };
    }

    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");

    const { data: cedulaEx } = await sb.from("clientes").select("id").eq("cedula", cedula).maybeSingle();
    if (cedulaEx) return { error: "Ya existe una cuenta con esta cédula." };

    const { data: mailEx } = await sb.from("clientes").select("id").ilike("email", email).maybeSingle();
    if (mailEx) return { error: "Ya existe una cuenta con este correo." };

    const { data: authUser, error: authErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre_completo: nombre, tipo: "cliente" },
    });
    if (authErr) {
      const msg = authErr.message.toLowerCase();
      if (msg.includes("already")) return { error: "Este correo ya está registrado." };
      return { error: authErr.message };
    }

    const userId = authUser.user!.id;
    const baseCliente = {
      cedula,
      nombre_completo: nombre,
      email,
      telefono: telefono || null,
      direccion: direccion || null,
    };

    let { error: cliErr } = await sb.from("clientes").insert({ ...baseCliente, auth_user_id: userId } as never);
    if (cliErr?.message?.includes("auth_user_id")) {
      ({ error: cliErr } = await sb.from("clientes").insert(baseCliente));
    }

    if (cliErr) {
      await sb.auth.admin.deleteUser(userId);
      return { error: cliErr.message };
    }

    const login = await sessionFromSignIn(email, password);
    if (login.error) return { error: login.error };
    return { session: login.session };
  });

/** Login de clientes de la tienda */
export const loginCliente = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const email = sanitizeInput(data.email).toLowerCase();
    const password = sanitizeInput(data.password);
    if (!validateEmail(email)) return { error: "Formato de correo inválido." };

    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed && rateLimit.waitSeconds > 0) {
      return {
        error: `Cuenta bloqueada por intentos fallidos. Espera ${Math.ceil(rateLimit.waitSeconds / 60)} minutos e intenta de nuevo.`,
      };
    }

    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");

    if (esCorreoPersonal(email)) {
      return { error: "El personal debe ingresar por Ingreso interno (/login), no por la tienda." };
    }

    const { data: cliente } = await sb.from("clientes").select("id, email").ilike("email", email).maybeSingle();
    if (!cliente) {
      return { error: "No tienes cuenta de cliente. Regístrate en la tienda primero." };
    }

    const login = await sessionFromSignIn(email, password);
    if (login.error) {
      if (login.error.includes("incorrectos")) {
        recordFailedAttempt(email);
        const remainingAttempts = checkRateLimit(email).remainingAttempts;
        return { error: `Contraseña incorrecta. Te quedan ${remainingAttempts} intento(s).` };
      }
      return { error: login.error };
    }

    if (await esPersonal(sb, login.userId)) {
      return { error: "Esta cuenta es de personal del sistema. Usa Ingreso interno." };
    }

    resetAttempts(email);
    return { session: login.session };
  });

/** Login ERP — solo personal autorizado */
export const loginInterno = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const email = sanitizeInput(data.email).toLowerCase();
    const password = sanitizeInput(data.password);

    if (!email || !password) return { error: "Ingresa correo y contraseña." };

    if (!validateEmail(email)) return { error: "Formato de correo inválido." };

    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed && rateLimit.waitSeconds > 0) {
      return {
        error: `Cuenta bloqueada por intentos fallidos. Espera ${Math.ceil(rateLimit.waitSeconds / 60)} minutos e intenta de nuevo.`,
      };
    }

    if (!esCorreoPersonal(email)) {
      return { error: `Acceso restringido. Solo personal autorizado (${STAFF_EMAIL}).` };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, nombre_completo, activo")
      .ilike("email", email)
      .maybeSingle();

    if (!profile) {
      return { error: "Este correo no está registrado como usuario del sistema." };
    }
    if (!profile.activo) {
      return { error: "Esta cuenta está desactivada. Contacta al administrador." };
    }

    await supabaseAdmin.auth.admin.updateUserById(profile.id, { email_confirm: true });

    const login = await sessionFromSignIn(profile.email ?? email, password);
    if (login.error) {
      if (login.error.includes("incorrectos")) {
        recordFailedAttempt(email);
        const remainingAttempts = checkRateLimit(email).remainingAttempts;
        return { error: `Contraseña incorrecta. Te quedan ${remainingAttempts} intento(s).` };
      }
      return { error: login.error };
    }
    resetAttempts(email);
    return { session: login.session };
  });
