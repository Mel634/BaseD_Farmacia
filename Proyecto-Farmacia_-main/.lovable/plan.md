
# Plan de réplica 1:1 — ERP Farmacia + 4 Arquitecturas

Tu proyecto de referencia tiene **~5,000 líneas de SQL** (esquema + funciones + seeds), **~5,300 líneas de React** repartidas en ~20 páginas, un backend Node con 4 servidores (central, sucursal, bodega, cloud) + gateway, y 5 sucursales físicamente separadas (Quito, Guayaquil, Cuenca, Ambato, Portoviejo). Eso no entra en una sola tanda sin romperse y consumir todos tus créditos de golpe. Lo divido en **4 fases que apruebas por separado** — cada fase deja la app funcionando.

## Cómo se mapean las 4 arquitecturas en Lovable Cloud

En Lovable solo hay **un PostgreSQL**, no puedo levantar 6 servidores Node ni 5 bases físicas. Las 4 arquitecturas se replican **por esquema lógico**, que es lo que el tribunal entiende como "arquitectura distribuida sobre PostgreSQL":

```text
public                  → Arquitectura CENTRALIZADA (todos los módulos)
sucursal_quito          → Distribuida horizontal (fragmentación por sucursal)
sucursal_guayaquil      ↘
sucursal_cuenca          ├ cada esquema = nodo independiente
sucursal_ambato         ↗
sucursal_portoviejo
bodega_central          → Distribuida vertical (solo inventario)
cloud_ecommerce         → Nube (catálogo público + pedidos online)
arq_comparativa         → Vistas materializadas para la pantalla comparativa
```

El "API Gateway" se simula con un componente React que enruta a server-functions distintas según el esquema destino — exactamente la misma idea que tu `gateway.js`, pero en TanStack Start.

## Fase 1 — Esquema centralizado real (AlimaCorp / public)

Reemplazo las tablas actuales (`productos`, `clientes`, etc.) por el esquema real de tu referencia con los prefijos `ERP_`, `VEN_`, `COMP_`, `RH_`, `CONT_`, `SEG_`, `LOG_`. Migro las funciones críticas: `fn_facturar`, `fn_anular_factura`, `fn_generar_orden`, `fn_aprobar_orden`, `fn_generar_nomina`, `fn_anular_nomina`, `fn_asiento_contable`. Auth con roles (`admin`, `cajero`, `bodeguero`, `contador`, `rrhh`, `cliente`).

## Fase 2 — Módulos operativos completos (frontend 1:1)

Reescribo las páginas del sidebar para que se vean y funcionen como tu referencia:
- Ventas: Clientes, Facturas (con anulación), POS de cajero
- Compras: Proveedores, Órdenes (con aprobación)
- Inventario: Productos, Movimientos, Ajustes, vista de Bodeguero
- Contabilidad: Plan de cuentas, Asientos, Mayor/Balance
- RRHH: Empleados, Nómina (generar/anular por período)
- Dashboard ejecutivo con KPIs (mismas tarjetas y gráficos)

## Fase 3 — Arquitectura distribuida (5 sucursales + bodega)

Creo los esquemas `sucursal_quito`, `sucursal_guayaquil`, `sucursal_cuenca`, `sucursal_ambato`, `sucursal_portoviejo`, `bodega_central` con sus propias tablas `ven_clientes`, `ven_facturas`, `ven_facturas_det`, etc. Datos seed por sucursal (clientes, facturas históricas 6 meses, stock por bodega). Selector de sucursal en la UI. Buscador de disponibilidad cross-sucursal (consulta los 5 esquemas y devuelve dónde hay stock — tu funcionalidad estrella).

## Fase 4 — Nube + Comparativa + Status

- Esquema `cloud_ecommerce`: tienda pública, registro de cliente final, pedidos online (réplica de tu `Tienda.jsx`, `MisPedidos.jsx`, `cloud-deploy/`)
- Páginas `/arq/*` reales con datos vivos de cada esquema, no estáticas
- `/sistema-status` con cards de cada "servicio" lógico, latencias simuladas y el buscador de disponibilidad
- Comparativa con métricas reales: nº de tablas, filas, tiempo de query, replicación

---

## Detalles técnicos

- Stack: TanStack Start + Supabase (ya está). No agrego backend Node.
- Acceso a esquemas no-públicos: `createServerFn` + `supabaseAdmin` con `db: { schema: 'sucursal_quito' }`, expuesto a la UI vía `useServerFn`. RLS solo en `public`; los esquemas de arquitectura son read-mostly desde server.
- Tipos generados: cada migración regenera `types.ts` solo para `public`. Para los esquemas extra uso tipos manuales en `src/lib/arq/types.ts`.
- Auth: mantengo el usuario actual; agrego roles `cajero`/`bodeguero`/`contador`/`rrhh`/`cliente` con `has_role()`.
- Seeds: scripts SQL en migraciones (~6 meses de facturas, empleados por sucursal, productos demo) tal cual tus `02_seed_historico.sql` y `09_historico_completo.sql`.

## Lo que NO se replica (limitaciones reales del entorno)

- Servidores Node físicos separados (gateway, central, sucursal, bodega, cloud) — todo corre en un único runtime de TanStack Start.
- MongoDB Atlas para el cloud — uso esquema PostgreSQL `cloud_ecommerce` en su lugar.
- Failover real entre nodos — se simula apagando/encendiendo un esquema desde la UI.

---

**Esto es lo que vamos a hacer.** Apruebas el plan y arranco con la **Fase 1** (esquema + migración). Cuando esa fase quede verde y la app cargue sin errores, te pregunto si seguimos con la Fase 2. Si en algún punto quieres parar y exportar lo hecho, queda usable.
