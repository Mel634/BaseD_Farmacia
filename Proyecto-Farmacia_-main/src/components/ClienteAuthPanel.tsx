import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loginCliente, registroCliente } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  onSuccess?: () => void;
  submitLoginLabel?: string;
  submitSignupLabel?: string;
};

export function ClienteAuthPanel({ onSuccess, submitLoginLabel, submitSignupLabel }: Props) {
  const { t } = useLang();
  const loginFn = useServerFn(loginCliente);
  const signupFn = useServerFn(registroCliente);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const setSession = async (session: { access_token: string; refresh_token: string }) => {
    const { error } = await supabase.auth.setSession(session);
    if (error) throw error;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "login") {
        if (attempts >= 3) {
          toast.error("Has superado el límite de intentos. Espera 15 minutos.");
          return;
        }
        const res = await loginFn({ data: { email, password } });
        if (res.error) { toast.error(res.error); setAttempts((a) => a + 1); return; }
        if (!res.session) { toast.error(t("auth.error")); return; }
        await setSession(res.session);
        setAttempts(0);
        toast.success(t("auth.session_ok"));
      } else {
        if (!cedula.trim()) { toast.error(t("auth.cedula_required")); return; }
        const res = await signupFn({
          data: { email, password, nombre, cedula, telefono: telefono || undefined },
        });
        if (res.error) { toast.error(res.error); return; }
        if (!res.session) { toast.error(t("auth.error")); return; }
        await setSession(res.session);
        toast.success(t("auth.signup_ok_client"));
      }
      onSuccess?.();
    } catch {
      toast.error(t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex border-b mb-3">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`flex-1 py-2 text-sm font-medium ${tab === "login" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-muted-foreground"}`}
        >
          {t("auth.login")}
        </button>
        <button
          type="button"
          onClick={() => setTab("signup")}
          className={`flex-1 py-2 text-sm font-medium ${tab === "signup" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-muted-foreground"}`}
        >
          {t("auth.signup")}
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {tab === "signup" && (
          <>
            <div>
              <Label>{t("auth.full_name")}</Label>
              <Input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label>{t("checkout.cedula")}</Label>
              <Input required value={cedula} onChange={(e) => setCedula(e.target.value)} maxLength={13} />
            </div>
            <div>
              <Label>{t("checkout.phone")}</Label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
          </>
        )}
        <div>
          <Label>Email</Label>
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>{t("auth.password")}</Label>
          <Input
            type="password"
            required
            minLength={6}
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading || attempts >= 3}>
          {loading
            ? (tab === "login" ? t("auth.logging") : t("auth.creating"))
            : (tab === "login"
              ? (submitLoginLabel ?? t("auth.login_btn"))
              : (submitSignupLabel ?? t("auth.signup_btn")))}
        </Button>
      </form>
    </div>
  );
}
