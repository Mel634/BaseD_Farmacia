import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { esSesionPersonal } from "@/lib/auth-client";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <AuthProvider>
      <Inner />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

function Inner() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [staffOk, setStaffOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    esSesionPersonal(user.id, user.email).then(async (ok) => {
      if (!ok) {
        toast.error("Esta sesión es de cliente. El ERP es solo para personal autorizado.");
        await supabase.auth.signOut();
        navigate({ to: "/tienda" });
        return;
      }
      setStaffOk(true);
    });
  }, [loading, user, navigate]);

  if (loading || staffOk === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando…</div>;
  }
  if (!user || !staffOk) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 border-b bg-background flex items-center px-4 print:hidden">
            <SidebarTrigger />
            <span className="ml-3 text-sm font-medium text-muted-foreground">FarmaSystem ERP</span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
