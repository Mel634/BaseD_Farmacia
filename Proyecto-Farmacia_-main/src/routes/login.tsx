import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { loginInterno } from "@/lib/auth.functions";
import { esSesionPersonal } from "@/lib/auth-client";
import { STAFF_EMAIL } from "@/lib/auth-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "FarmaSystem — Acceso" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const fn = useServerFn(loginInterno);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const ok = await esSesionPersonal(session.user.id, session.user.email);
      if (ok) navigate({ to: "/dashboard" });
      else await supabase.auth.signOut();
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fn({ data: { email, password } });
      if (res.error) {
        toast.error(res.error);
        setAttempts((a) => a + 1);
        return;
      }
      if (!res.session) {
        toast.error("No se pudo iniciar sesión.");
        return;
      }
      const { error } = await supabase.auth.setSession(res.session);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Bienvenido");
      setAttempts(0);
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-5xl mb-2">💊</div>
          <CardTitle className="text-2xl">FarmaSystem ERP</CardTitle>
          <CardDescription>Acceso exclusivo para personal autorizado · {STAFF_EMAIL}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Correo</Label>
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || attempts >= 3}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
            {attempts >= 3 && (
              <p className="text-red-500 text-sm text-center">
                Has superado el límite de intentos. Espera 15 minutos antes de intentar de nuevo.
              </p>
            )}
          </form>
          <div className="flex justify-between text-xs text-muted-foreground mt-4">
            <Link to="/" className="hover:underline">← Inicio</Link>
            <Link to="/tienda" className="hover:underline text-emerald-700">¿Eres cliente? Ir a la tienda →</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
