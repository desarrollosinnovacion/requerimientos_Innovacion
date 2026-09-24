"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirUsuario } from "@/lib/auth";
import { ES_UUID } from "@/lib/asignaciones";
import { nombrePeriodo, ordenPeriodo, type TipoSeccion } from "@/lib/indicadores";

export type Resultado = { ok: true } | { ok: false; error: string };
export type EstadoFormPeriodo = { error?: string };

/** Estructura inicial cuando no hay ningún período del que copiar (la del Excel). */
const PLANTILLA: { nombre: string; tipo: TipoSeccion; columnas: string[]; items: { nombre: string; meta: number | null }[] }[] = [
  {
    nombre: "Sistema Comité de FDC",
    tipo: "conteo",
    columnas: ["CI GT", "CI SV", "QC GT", "QC SV", "AKTIVA", "BENESTAR", "SONRIE", "DYNAMO WS", "DYNAM RE"],
    items: [
      { nombre: "Sesiones de Trabajo", meta: 9 },
      { nombre: "Otras sesiones (alineaciones, despejes, etc.)", meta: 9 },
      { nombre: "Comité", meta: 8 },
    ],
  },
  {
    nombre: "Medición de FDC",
    tipo: "check",
    columnas: ["CI GT", "CI SV", "QC GT", "QC SV", "AKTIVA", "BENESTAR", "SONRIE", "DYNAMO WS", "DYNAM RE"],
    items: [
      { nombre: "Planes de acción", meta: 6 },
      { nombre: "Descarga de bases de datos del mes anterior", meta: 5 },
      { nombre: "Confirmación de bases del mes", meta: 5 },
      { nombre: "Medición de FDC Iniciada (interna o externa)", meta: 5 },
      { nombre: "Respuestas a la fecha en Power BI (15 días)", meta: 5 },
      { nombre: "Entrega de Resultados / Envío de Detractores", meta: 5 },
    ],
  },
  {
    nombre: "Business Intelligence (BI)",
    tipo: "check",
    columnas: ["CI GT", "CI SV", "QC GT", "QC SV", "AKTIVA", "BENESTAR", "SONRIE", "DYNAMO WS", "DYNAM RE"],
    items: [
      { nombre: "Ordenar bases de datos según requerimientos de JD", meta: 3 },
      { nombre: "Levantar un tablero de indicadores de FDC por UdN", meta: 10 },
      { nombre: "Finalizar implementación de dashboards de SENTO", meta: 10 },
    ],
  },
  {
    nombre: "Tareas Operativas",
    tipo: "check",
    columnas: ["CI GT", "CI SV", "QC GT", "QC SV", "AKTIVA", "BENESTAR", "SONRIE", "DYNAMO WS", "DYNAM RE"],
    items: [
      { nombre: "Facturación comisiones", meta: 5 },
      { nombre: "Facturación llamadas", meta: 4 },
      { nombre: "Recepción facturas proveedores", meta: 5 },
    ],
  },
];

async function supabaseInnovacion() {
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") throw new Error("Sin permisos");
  return supabase;
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();

function revalidar(periodoId?: string) {
  revalidatePath("/indicadores");
  if (periodoId) revalidatePath(`/indicadores/${periodoId}`);
}

/**
 * Crea un período nuevo. Copia la estructura (secciones, columnas, filas y metas)
 * del período indicado, o la plantilla del Excel si no hay ninguno; los valores
 * empiezan vacíos. Redirige a la hoja nueva.
 */
export async function crearPeriodo(_prev: EstadoFormPeriodo, fd: FormData): Promise<EstadoFormPeriodo> {
  const anio = Number(texto(fd, "anio"));
  const mes = Number(texto(fd, "mes"));
  const nombre = texto(fd, "nombre") || nombrePeriodo(anio, mes);
  const titulo = texto(fd, "titulo") || "Reporte de Avance - Alineación Semanal de FDC";
  const copiarDe = texto(fd, "copiar_de");
  if (!Number.isInteger(anio) || anio < 2020 || anio > 2100 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    return { error: "Elige un mes y un año válidos." };
  }
  if (copiarDe && !ES_UUID.test(copiarDe)) return { error: "Período a copiar no válido." };

  const supabase = await supabaseInnovacion();
  const { data: periodo, error } = await supabase
    .from("fdc_periodos")
    .insert({ nombre, titulo, orden: ordenPeriodo(anio, mes) })
    .select("id")
    .single<{ id: string }>();
  if (error || !periodo) {
    if (error?.code === "23505") return { error: `Ya existe un período llamado "${nombre}".` };
    console.error("Error al crear período", error);
    return { error: "No fue posible crear el período." };
  }

  type Plan = { nombre: string; tipo: TipoSeccion; columnas: string[]; items: { nombre: string; meta: number | null }[] }[];
  let plan: Plan = PLANTILLA;
  if (copiarDe) {
    const { data: secciones } = await supabase
      .from("fdc_secciones")
      .select("nombre, tipo, orden, columnas:fdc_columnas(nombre, orden), items:fdc_items(nombre, meta, orden)")
      .eq("periodo_id", copiarDe)
      .order("orden");
    if (secciones?.length) {
      plan = secciones.map((s) => ({
        nombre: s.nombre,
        tipo: s.tipo as TipoSeccion,
        columnas: [...(s.columnas ?? [])].sort((a, b) => a.orden - b.orden).map((c) => c.nombre),
        items: [...(s.items ?? [])].sort((a, b) => a.orden - b.orden).map((i) => ({ nombre: i.nombre, meta: i.meta })),
      }));
    }
  }

  for (const [i, s] of plan.entries()) {
    const { data: sec } = await supabase
      .from("fdc_secciones")
      .insert({ periodo_id: periodo.id, nombre: s.nombre, tipo: s.tipo, orden: i })
      .select("id")
      .single<{ id: string }>();
    if (!sec) continue;
    await Promise.all([
      s.columnas.length
        ? supabase.from("fdc_columnas").insert(s.columnas.map((nombre, j) => ({ seccion_id: sec.id, nombre, orden: j })))
        : Promise.resolve(),
      s.items.length
        ? supabase.from("fdc_items").insert(s.items.map((it, j) => ({ seccion_id: sec.id, nombre: it.nombre, meta: it.meta, orden: j })))
        : Promise.resolve(),
    ]);
  }

  revalidar();
  redirect(`/indicadores/${periodo.id}`);
}

export async function renombrarPeriodo(id: string, nombre: string, titulo: string): Promise<Resultado> {
  if (!ES_UUID.test(id)) return { ok: false, error: "Período no válido." };
  if (!nombre.trim()) return { ok: false, error: "El nombre no puede quedar vacío." };
  const supabase = await supabaseInnovacion();
  const { error } = await supabase.from("fdc_periodos").update({ nombre: nombre.trim(), titulo: titulo.trim() }).eq("id", id);
  if (error) return { ok: false, error: error.code === "23505" ? "Ya existe un período con ese nombre." : "No fue posible guardar." };
  revalidar(id);
  return { ok: true };
}

export async function eliminarPeriodo(id: string): Promise<{ error: string } | undefined> {
  if (!ES_UUID.test(id)) return { error: "Período no válido." };
  const supabase = await supabaseInnovacion();
  const { error } = await supabase.from("fdc_periodos").delete().eq("id", id);
  if (error) return { error: "No fue posible eliminar el período." };
  revalidar(id);
  redirect("/indicadores");
}

// ---------- Contenido de la hoja ----------------------------------------------

/** Guarda una celda; null la borra. Para secciones tipo check el valor es 1 o 0. */
export async function guardarValor(periodoId: string, itemId: string, columnaId: string, valor: number | null): Promise<Resultado> {
  if (![periodoId, itemId, columnaId].every((x) => ES_UUID.test(x))) return { ok: false, error: "Celda no válida." };
  if (valor !== null && !Number.isFinite(valor)) return { ok: false, error: "Valor no válido." };
  const supabase = await supabaseInnovacion();
  const { error } =
    valor === null || valor === 0
      ? await supabase.from("fdc_valores").delete().eq("item_id", itemId).eq("columna_id", columnaId)
      : await supabase.from("fdc_valores").upsert({ item_id: itemId, columna_id: columnaId, valor });
  if (error) {
    console.error("Error al guardar valor", error);
    return { ok: false, error: "No fue posible guardar la celda." };
  }
  revalidar(periodoId);
  return { ok: true };
}

export async function actualizarItem(
  periodoId: string,
  itemId: string,
  cambios: { nombre?: string; meta?: number | null; notas?: string | null },
): Promise<Resultado> {
  if (!ES_UUID.test(periodoId) || !ES_UUID.test(itemId)) return { ok: false, error: "Fila no válida." };
  if (cambios.meta !== undefined && cambios.meta !== null && (!Number.isFinite(cambios.meta) || cambios.meta < 0)) {
    return { ok: false, error: "La meta debe ser un número positivo." };
  }
  const supabase = await supabaseInnovacion();
  const { error } = await supabase.from("fdc_items").update(cambios).eq("id", itemId);
  if (error) return { ok: false, error: "No fue posible guardar la fila." };
  revalidar(periodoId);
  return { ok: true };
}

export async function crearItem(periodoId: string, seccionId: string): Promise<Resultado & { id?: string }> {
  if (!ES_UUID.test(periodoId) || !ES_UUID.test(seccionId)) return { ok: false, error: "Sección no válida." };
  const supabase = await supabaseInnovacion();
  const { data: ultimo } = await supabase.from("fdc_items").select("orden").eq("seccion_id", seccionId).order("orden", { ascending: false }).limit(1).maybeSingle<{ orden: number }>();
  const { data, error } = await supabase
    .from("fdc_items")
    .insert({ seccion_id: seccionId, nombre: "", orden: (ultimo?.orden ?? -1) + 1 })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { ok: false, error: "No fue posible agregar la fila." };
  revalidar(periodoId);
  return { ok: true, id: data.id };
}

export async function eliminarItem(periodoId: string, itemId: string): Promise<Resultado> {
  if (!ES_UUID.test(periodoId) || !ES_UUID.test(itemId)) return { ok: false, error: "Fila no válida." };
  const supabase = await supabaseInnovacion();
  const { error } = await supabase.from("fdc_items").delete().eq("id", itemId);
  if (error) return { ok: false, error: "No fue posible eliminar la fila." };
  revalidar(periodoId);
  return { ok: true };
}

export async function crearColumna(periodoId: string, seccionId: string, nombre: string): Promise<Resultado> {
  if (!ES_UUID.test(periodoId) || !ES_UUID.test(seccionId)) return { ok: false, error: "Sección no válida." };
  if (!nombre.trim()) return { ok: false, error: "Escribe el nombre de la columna." };
  const supabase = await supabaseInnovacion();
  const { data: ultima } = await supabase.from("fdc_columnas").select("orden").eq("seccion_id", seccionId).order("orden", { ascending: false }).limit(1).maybeSingle<{ orden: number }>();
  const { error } = await supabase.from("fdc_columnas").insert({ seccion_id: seccionId, nombre: nombre.trim(), orden: (ultima?.orden ?? -1) + 1 });
  if (error) return { ok: false, error: "No fue posible agregar la columna." };
  revalidar(periodoId);
  return { ok: true };
}

export async function renombrarColumna(periodoId: string, columnaId: string, nombre: string): Promise<Resultado> {
  if (!ES_UUID.test(periodoId) || !ES_UUID.test(columnaId)) return { ok: false, error: "Columna no válida." };
  if (!nombre.trim()) return { ok: false, error: "El nombre no puede quedar vacío." };
  const supabase = await supabaseInnovacion();
  const { error } = await supabase.from("fdc_columnas").update({ nombre: nombre.trim() }).eq("id", columnaId);
  if (error) return { ok: false, error: "No fue posible renombrar la columna." };
  revalidar(periodoId);
  return { ok: true };
}

export async function eliminarColumna(periodoId: string, columnaId: string): Promise<Resultado> {
  if (!ES_UUID.test(periodoId) || !ES_UUID.test(columnaId)) return { ok: false, error: "Columna no válida." };
  const supabase = await supabaseInnovacion();
  const { error } = await supabase.from("fdc_columnas").delete().eq("id", columnaId);
  if (error) return { ok: false, error: "No fue posible eliminar la columna." };
  revalidar(periodoId);
  return { ok: true };
}

export async function crearSeccion(periodoId: string, nombre: string, tipo: TipoSeccion): Promise<Resultado> {
  if (!ES_UUID.test(periodoId)) return { ok: false, error: "Período no válido." };
  if (!nombre.trim()) return { ok: false, error: "Escribe el nombre de la sección." };
  if (tipo !== "conteo" && tipo !== "check") return { ok: false, error: "Tipo no válido." };
  const supabase = await supabaseInnovacion();
  const { data: ultima } = await supabase.from("fdc_secciones").select("orden").eq("periodo_id", periodoId).order("orden", { ascending: false }).limit(1).maybeSingle<{ orden: number }>();
  const { error } = await supabase.from("fdc_secciones").insert({ periodo_id: periodoId, nombre: nombre.trim(), tipo, orden: (ultima?.orden ?? -1) + 1 });
  if (error) return { ok: false, error: "No fue posible agregar la sección." };
  revalidar(periodoId);
  return { ok: true };
}

export async function renombrarSeccion(periodoId: string, seccionId: string, nombre: string): Promise<Resultado> {
  if (!ES_UUID.test(periodoId) || !ES_UUID.test(seccionId)) return { ok: false, error: "Sección no válida." };
  if (!nombre.trim()) return { ok: false, error: "El nombre no puede quedar vacío." };
  const supabase = await supabaseInnovacion();
  const { error } = await supabase.from("fdc_secciones").update({ nombre: nombre.trim() }).eq("id", seccionId);
  if (error) return { ok: false, error: "No fue posible renombrar la sección." };
  revalidar(periodoId);
  return { ok: true };
}

export async function eliminarSeccion(periodoId: string, seccionId: string): Promise<Resultado> {
  if (!ES_UUID.test(periodoId) || !ES_UUID.test(seccionId)) return { ok: false, error: "Sección no válida." };
  const supabase = await supabaseInnovacion();
  const { error } = await supabase.from("fdc_secciones").delete().eq("id", seccionId);
  if (error) return { ok: false, error: "No fue posible eliminar la sección." };
  revalidar(periodoId);
  return { ok: true };
}
