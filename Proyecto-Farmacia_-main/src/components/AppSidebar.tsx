import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, Package, Truck, Receipt, ShoppingCart, Boxes,
  Wallet, BookOpen, ClipboardList, UserCog, FileSearch, LogOut,
} from "lucide-react";

type Item = { title: string; url: string; icon?: any; emoji?: string };

const groups: { label: string; items: Item[] }[] = [
  {
    label: "GENERAL",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "COMPRAS",
    items: [
      { title: "Proveedores", url: "/proveedores", icon: Truck },
      { title: "Órdenes de Compra", url: "/ordenes-compra", icon: ShoppingCart },
    ],
  },
  {
    label: "INVENTARIO",
    items: [
      { title: "Productos", url: "/productos", icon: Package },
      { title: "Ajuste Inventario", url: "/ajustes-inventario", icon: Boxes },
    ],
  },
  {
    label: "VENTAS",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Facturación", url: "/facturas", icon: Receipt },
      { title: "Ventas por Provincia", url: "/ventas-provincia", emoji: "🗺️" },
    ],
  },

  {
    label: "RRHH",
    items: [
      { title: "Empleados", url: "/empleados", icon: UserCog },
      { title: "Rol de Pagos", url: "/rol-pagos", icon: Wallet },
    ],
  },
  {
    label: "CONTABILIDAD",
    items: [
      { title: "Plan de Cuentas", url: "/plan-cuentas", icon: BookOpen },
      { title: "Asientos Contables", url: "/asientos", icon: ClipboardList },
    ],
  },
  {
    label: "ADMINISTRACIÓN",
    items: [
      { title: "Usuarios del Sistema", url: "/usuarios", icon: UserCog },
      { title: "Log de Auditoría", url: "/auditoria", icon: FileSearch },
    ],
  },
  {
    label: "ARQUITECTURAS DB",
    items: [
      { title: "Centralizada", url: "/arq/centralizada", emoji: "🖥️" },
      { title: "Distribuida", url: "/arq/distribuida", emoji: "🌐" },
      { title: "Nube", url: "/arq/nube", emoji: "☁️" },
      { title: "Híbrida", url: "/arq/hibrida", emoji: "🔀" },
      { title: "NoSQL (Documental)", url: "/arq/nosql", emoji: "🍃" },
      { title: "Comparativa", url: "/arq/comparativa", emoji: "📊" },
    ],
  },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user, signOut } = useAuth();

  return (
    <Sidebar className="print:hidden">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <span className="text-2xl">💊</span>
          <div>
            <div className="font-bold text-base leading-tight">FarmaSystem</div>
            <div className="text-xs text-muted-foreground">ERP Farmacéutico</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-[10px] tracking-wider font-bold">
              {g.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => {
                  const active = path === it.url;
                  return (
                    <SidebarMenuItem key={it.url}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link to={it.url} className="flex items-center gap-2">
                          {it.emoji ? (
                            <span className="text-base w-4 text-center">{it.emoji}</span>
                          ) : it.icon ? (
                            <it.icon className="h-4 w-4" />
                          ) : null}
                          <span>{it.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <div className="text-xs text-muted-foreground px-2 truncate">{user?.email}</div>
        <Button variant="ghost" size="sm" onClick={signOut} className="justify-start">
          <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
