import type { MiembroEquipo } from "@/lib/tipos";

/** Ambientes de una credencial, en el orden en que se muestran. */
export const AMBIENTES = ["produccion", "pruebas", "desarrollo"] as const;
export type Ambiente = (typeof AMBIENTES)[number];

export const ETIQUETAS_AMBIENTE: Record<Ambiente, string> = {
  produccion: "Producción",
  pruebas: "Pruebas",
  desarrollo: "Desarrollo",
};

// Mismo criterio que las demás etiquetas del portal: Verde sólido para lo que
// está en uso real, Cobre para avisar (pruebas) y neutro para desarrollo.
export const CLASES_AMBIENTE: Record<Ambiente, string> = {
  produccion: "bg-brand-600 text-slate-100",
  pruebas: "bg-cobre-100 text-cobre-800",
  desarrollo: "bg-slate-200 text-slate-800",
};

export function esAmbiente(v: unknown): v is Ambiente {
  return typeof v === "string" && (AMBIENTES as readonly string[]).includes(v);
}

/** Acciones que quedan en la bitácora, con el verbo que se muestra. */
export const ACCIONES_BITACORA = {
  crear: "Creó",
  editar: "Editó",
  eliminar: "Eliminó",
  revelar: "Reveló",
} as const;
export type AccionBitacora = keyof typeof ACCIONES_BITACORA;

/** Largo máximo del secreto en texto plano (cabe un API key o un certificado corto). */
export const MAX_SECRETO = 4096;

/** Lista y ficha de aplicación: datos, unidad, requerimiento ligado y conteo de credenciales. */
export const SELECT_APLICACION =
  "id, nombre, url, descripcion, empresa_id, requerimiento_id, creado_en, actualizado_en, " +
  "empresa:empresas(id, nombre), requerimiento:requerimientos(id, folio, nombre_proyecto), credenciales(count)";

/** NUNCA incluye secreto_cifrado: ese solo lo lee la acción revelarSecreto. */
export const SELECT_CREDENCIAL =
  "id, aplicacion_id, etiqueta, usuario, ambiente, notas, tiene_mfa, creado_en, actualizado_en, " +
  "mfa_titulares:credencial_mfa_titulares(perfil:perfiles(id, nombre))";

export const SELECT_BITACORA = "id, credencial_id, etiqueta, accion, creado_en, usuario:perfiles(nombre)";

export type AplicacionFila = {
  id: string;
  nombre: string;
  url: string | null;
  descripcion: string | null;
  empresa_id: string | null;
  requerimiento_id: string | null;
  creado_en: string;
  actualizado_en: string;
  empresa: { id: string; nombre: string } | null;
  requerimiento: { id: string; folio: string; nombre_proyecto: string | null } | null;
  credenciales: { count: number }[];
};

export type CredencialFila = {
  id: string;
  aplicacion_id: string;
  etiqueta: string;
  usuario: string | null;
  ambiente: Ambiente;
  notas: string | null;
  /** Si exige segundo factor; `mfa_titulares` dice quiénes del equipo lo tienen configurado. */
  tiene_mfa: boolean;
  mfa_titulares: { perfil: MiembroEquipo | null }[];
  creado_en: string;
  actualizado_en: string;
};

/** Ids de los miembros que tienen el MFA de una credencial. */
export const idsTitularesMfa = (c: CredencialFila) => c.mfa_titulares.map((t) => t.perfil?.id).filter((id): id is string => Boolean(id));

export type BitacoraFila = {
  id: number;
  credencial_id: string | null;
  etiqueta: string;
  accion: AccionBitacora;
  creado_en: string;
  usuario: { nombre: string } | null;
};

/** Requerimiento abreviado para ligar una aplicación. */
export type RequerimientoOpcion = { id: string; folio: string; nombre_proyecto: string | null };

export const conteoCredenciales = (a: AplicacionFila) => a.credenciales?.[0]?.count ?? 0;
