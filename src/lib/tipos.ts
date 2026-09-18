import type { Estado } from "./formulario";

export type Perfil = {
  id: string;
  nombre: string;
  correo: string;
  rol: "solicitante" | "innovacion";
  activo: boolean;
  debe_cambiar_password: boolean;
};

export type RequerimientoResumen = {
  id: string;
  folio: string;
  estado: Estado;
  tipo_requerimiento: string;
  prioridad_sugerida: string;
  prioridad_final: string | null;
  nombre_solicitante: string;
  empresa_area: string;
  creado_en: string;
};

export type Requerimiento = RequerimientoResumen & {
  solicitante_id: string;
  empresa_id: string | null;
  departamento_id: string | null;
  area_id: string | null;
  fecha_estimada_entrega: string | null;
  notas_innovacion: string | null;
  actualizado_en: string;
  [campo: string]: string | string[] | null;
};

/** Miembro del equipo de Innovación (para asignación). */
export type MiembroEquipo = Pick<Perfil, "id" | "nombre">;

export type Adjunto = {
  id: string;
  requerimiento_id: string;
  nombre: string;
  ruta: string;
  tamano: number | null;
  tipo_mime: string | null;
};
