"use server";

import { parsearFormulario } from "@/lib/formulario";
import { requerirUsuario } from "@/lib/auth";

export type ResultadoCrear =
  | { ok: true; id: string; folio: string }
  | { ok: false; errores: Record<string, string>; mensaje?: string };

export async function crearRequerimiento(fd: FormData): Promise<ResultadoCrear> {
  const { supabase, user } = await requerirUsuario();
  const { datos, errores } = parsearFormulario(fd);

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores, mensaje: "Revisa los campos marcados." };
  }

  // Validar empresa / departamento / área contra los catálogos y armar el texto combinado.
  const [{ data: empresa }, { data: departamento }, { data: areasDepto }] = await Promise.all([
    supabase.from("empresas").select("id, nombre").eq("id", datos.empresa_id as string).eq("activo", true).maybeSingle(),
    supabase.from("departamentos").select("id, nombre, empresa_id").eq("id", datos.departamento_id as string).eq("activo", true).maybeSingle(),
    supabase.from("areas").select("id, nombre").eq("departamento_id", datos.departamento_id as string).eq("activo", true),
  ]);
  if (!empresa || !departamento || departamento.empresa_id !== empresa.id) {
    return { ok: false, errores: { empresa_area: "La empresa o el departamento no son válidos." } };
  }
  const areas = areasDepto ?? [];
  const area = areas.find((a) => a.id === datos.area_id) ?? null;
  if (areas.length > 0 && !area) {
    return { ok: false, errores: { empresa_area: "Selecciona el área." } };
  }
  datos.area_id = area?.id ?? null;
  datos.empresa_area = [empresa.nombre, departamento.nombre, area?.nombre].filter(Boolean).join(" / ");

  const { data, error } = await supabase
    .from("requerimientos")
    .insert({ ...datos, solicitante_id: user.id })
    .select("id, folio")
    .single<{ id: string; folio: string }>();

  if (error || !data) {
    console.error("Error al crear requerimiento", error);
    return { ok: false, errores: {}, mensaje: "No fue posible guardar el requerimiento. Intenta de nuevo." };
  }

  return { ok: true, id: data.id, folio: data.folio };
}
