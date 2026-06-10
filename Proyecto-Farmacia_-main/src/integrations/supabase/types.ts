export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ajustes_inventario: {
        Row: {
          cantidad: number
          created_at: string
          fecha: string
          id: string
          motivo: string
          producto_id: string
          sucursal_id: string | null
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          fecha?: string
          id?: string
          motivo: string
          producto_id: string
          sucursal_id?: string | null
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          fecha?: string
          id?: string
          motivo?: string
          producto_id?: string
          sucursal_id?: string | null
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      asiento_detalle: {
        Row: {
          asiento_id: string
          cuenta_id: string
          debe: number
          haber: number
          id: string
        }
        Insert: {
          asiento_id: string
          cuenta_id: string
          debe?: number
          haber?: number
          id?: string
        }
        Update: {
          asiento_id?: string
          cuenta_id?: string
          debe?: number
          haber?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asiento_detalle_asiento_id_fkey"
            columns: ["asiento_id"]
            isOneToOne: false
            referencedRelation: "asientos_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asiento_detalle_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "plan_cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
      asientos_contables: {
        Row: {
          concepto: string
          created_at: string
          fecha: string
          id: string
          numero: string
          total_debe: number
          total_haber: number
        }
        Insert: {
          concepto: string
          created_at?: string
          fecha?: string
          id?: string
          numero: string
          total_debe?: number
          total_haber?: number
        }
        Update: {
          concepto?: string
          created_at?: string
          fecha?: string
          id?: string
          numero?: string
          total_debe?: number
          total_haber?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean
          cedula: string
          created_at: string
          direccion: string | null
          email: string | null
          historial_medico: string | null
          id: string
          nombre_completo: string
          sucursal_id: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          cedula: string
          created_at?: string
          direccion?: string | null
          email?: string | null
          historial_medico?: string | null
          id?: string
          nombre_completo: string
          sucursal_id?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          cedula?: string
          created_at?: string
          direccion?: string | null
          email?: string | null
          historial_medico?: string | null
          id?: string
          nombre_completo?: string
          sucursal_id?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      departamentos: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      empleados: {
        Row: {
          activo: boolean
          cargo: string
          cedula: string
          created_at: string
          departamento_id: string | null
          fecha_ingreso: string
          id: string
          nombre_completo: string
          salario: number
          sucursal_id: string | null
        }
        Insert: {
          activo?: boolean
          cargo: string
          cedula: string
          created_at?: string
          departamento_id?: string | null
          fecha_ingreso?: string
          id?: string
          nombre_completo: string
          salario?: number
          sucursal_id?: string | null
        }
        Update: {
          activo?: boolean
          cargo?: string
          cedula?: string
          created_at?: string
          departamento_id?: string | null
          fecha_ingreso?: string
          id?: string
          nombre_completo?: string
          salario?: number
          sucursal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empleados_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      fac_detalle: {
        Row: {
          cantidad: number
          factura_id: string
          id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Insert: {
          cantidad: number
          factura_id: string
          id?: string
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Update: {
          cantidad?: number
          factura_id?: string
          id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "fac_detalle_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fac_detalle_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          cliente_id: string
          created_at: string
          estado: string
          fecha: string
          id: string
          iva: number
          numero: string
          subtotal: number
          sucursal_id: string | null
          total: number
          usuario_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          iva?: number
          numero: string
          subtotal?: number
          sucursal_id?: string | null
          total?: number
          usuario_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          iva?: number
          numero?: string
          subtotal?: number
          sucursal_id?: string | null
          total?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      jefes_zona: {
        Row: {
          cargo: string
          created_at: string
          email: string | null
          foto_url: string | null
          id: string
          nombre: string
          sucursal_id: string | null
          telefono: string | null
          whatsapp: string | null
        }
        Insert: {
          cargo?: string
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          sucursal_id?: string | null
          telefono?: string | null
          whatsapp?: string | null
        }
        Update: {
          cargo?: string
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          sucursal_id?: string | null
          telefono?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jefes_zona_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      log_auditoria: {
        Row: {
          datos: Json | null
          fecha: string
          id: number
          operacion: string
          registro_id: string | null
          tabla: string
          usuario_email: string | null
          usuario_id: string | null
        }
        Insert: {
          datos?: Json | null
          fecha?: string
          id?: number
          operacion: string
          registro_id?: string | null
          tabla: string
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Update: {
          datos?: Json | null
          fecha?: string
          id?: number
          operacion?: string
          registro_id?: string | null
          tabla?: string
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      oc_detalle: {
        Row: {
          cantidad: number
          id: string
          oc_id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Insert: {
          cantidad: number
          id?: string
          oc_id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Update: {
          cantidad?: number
          id?: string
          oc_id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "oc_detalle_oc_id_fkey"
            columns: ["oc_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oc_detalle_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_compra: {
        Row: {
          created_at: string
          estado: string
          fecha: string
          id: string
          iva: number
          numero: string
          proveedor_id: string
          subtotal: number
          sucursal_id: string | null
          total: number
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          iva?: number
          numero: string
          proveedor_id: string
          subtotal?: number
          sucursal_id?: string | null
          total?: number
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          iva?: number
          numero?: string
          proveedor_id?: string
          subtotal?: number
          sucursal_id?: string | null
          total?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_cuentas: {
        Row: {
          activo: boolean
          codigo: string
          id: string
          naturaleza: string
          nombre: string
          tipo: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          id?: string
          naturaleza: string
          nombre: string
          tipo: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          id?: string
          naturaleza?: string
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean
          categoria: string | null
          codigo: string
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          precio_compra: number
          precio_venta: number
          proveedor_id: string | null
          stock: number
          stock_minimo: number
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          codigo: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          precio_compra?: number
          precio_venta?: number
          proveedor_id?: string | null
          stock?: number
          stock_minimo?: number
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          codigo?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          precio_compra?: number
          precio_venta?: number
          proveedor_id?: string | null
          stock?: number
          stock_minimo?: number
        }
        Relationships: [
          {
            foreignKeyName: "productos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          created_at: string
          email: string | null
          id: string
          nombre_completo: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email?: string | null
          id: string
          nombre_completo?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nombre_completo?: string
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          activo: boolean
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          razon_social: string
          ruc: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          razon_social: string
          ruc: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          razon_social?: string
          ruc?: string
          telefono?: string | null
        }
        Relationships: []
      }
      rol_pagos: {
        Row: {
          bonos: number
          created_at: string
          empleado_id: string
          fecha: string
          horas_extras: number
          id: string
          iess: number
          liquido_pagar: number
          periodo: string
          sueldo_base: number
          total_descuentos: number
          total_ingresos: number
        }
        Insert: {
          bonos?: number
          created_at?: string
          empleado_id: string
          fecha?: string
          horas_extras?: number
          id?: string
          iess?: number
          liquido_pagar?: number
          periodo: string
          sueldo_base: number
          total_descuentos?: number
          total_ingresos?: number
        }
        Update: {
          bonos?: number
          created_at?: string
          empleado_id?: string
          fecha?: string
          horas_extras?: number
          id?: string
          iess?: number
          liquido_pagar?: number
          periodo?: string
          sueldo_base?: number
          total_descuentos?: number
          total_ingresos?: number
        }
        Relationships: [
          {
            foreignKeyName: "rol_pagos_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_sucursal: {
        Row: {
          id: string
          producto_id: string
          stock: number
          stock_minimo: number
          sucursal_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          producto_id: string
          stock?: number
          stock_minimo?: number
          sucursal_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          producto_id?: string
          stock?: number
          stock_minimo?: number
          sucursal_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sucursales: {
        Row: {
          activo: boolean
          ciudad: string
          codigo: string
          created_at: string
          direccion: string | null
          id: string
          nombre: string
          provincia: string
          schema_db: string
          telefono: string | null
          tipo: string
        }
        Insert: {
          activo?: boolean
          ciudad: string
          codigo: string
          created_at?: string
          direccion?: string | null
          id?: string
          nombre: string
          provincia: string
          schema_db: string
          telefono?: string | null
          tipo?: string
        }
        Update: {
          activo?: boolean
          ciudad?: string
          codigo?: string
          created_at?: string
          direccion?: string | null
          id?: string
          nombre?: string
          provincia?: string
          schema_db?: string
          telefono?: string | null
          tipo?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      comparativa_arquitecturas: {
        Row: {
          administracion: string | null
          arquitectura: string | null
          consistencia: string | null
          disponibilidad: string | null
          escalabilidad: string | null
          nodos: string | null
          uso_proyecto: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      arq_bodega_detalle: { Args: never; Returns: Json }
      arq_buscar_disponibilidad: {
        Args: { p_query: string }
        Returns: {
          codigo: string
          nombre: string
          precio: number
          stock: number
          sucursal: string
        }[]
      }
      arq_distribuida_detalle: { Args: never; Returns: Json }
      arq_nosql_query: {
        Args: { p_collection: string; p_limit?: number }
        Returns: {
          _id: string
          created_at: string
          doc: Json
        }[]
      }
      arq_nosql_resumen: { Args: never; Returns: Json }
      arq_nube_detalle: { Args: never; Returns: Json }
      arq_ranking_productos: { Args: never; Returns: Json }
      arq_resumen_global: { Args: never; Returns: Json }
      arq_ventas_por_provincia: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      proc_ajuste_inventario: {
        Args: {
          p_cantidad: number
          p_motivo: string
          p_producto_id: string
          p_tipo: string
        }
        Returns: string
      }
      proc_anular_factura: { Args: { p_factura_id: string }; Returns: string }
      proc_aprobar_orden: { Args: { p_oc_id: string }; Returns: string }
      proc_asiento_contable: {
        Args: { p_concepto: string; p_lineas: Json }
        Returns: string
      }
      proc_factura: {
        Args: { p_cliente_id: string; p_items: Json }
        Returns: string
      }
      proc_orden_compra: {
        Args: { p_items: Json; p_proveedor_id: string }
        Returns: string
      }
      proc_recibir_orden: { Args: { p_oc_id: string }; Returns: string }
      proc_rol_pago: {
        Args: {
          p_bonos?: number
          p_empleado_id: string
          p_horas_extras?: number
          p_periodo: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "contador"
        | "vendedor"
        | "bodeguero"
        | "rrhh"
        | "cajero"
        | "cliente_final"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "contador",
        "vendedor",
        "bodeguero",
        "rrhh",
        "cajero",
        "cliente_final",
      ],
    },
  },
} as const
