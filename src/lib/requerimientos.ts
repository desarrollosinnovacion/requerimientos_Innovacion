import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parsearFormulario, type ValoresFormulario } from "@/lib/formulario";

export type ResultadoCrear =
  | { ok: true; id: string; folio: string }
  | { ok: false; errores: Record<string, string>; mensaje?: string };

type Preparado = { ok: true; datos: ValoresFormulario } | { ok: false; errores: Record<string, string>; mensaje?: string };

/** Valida el formulario y cruza empresa/departamento/área con los catálogos. Común a crear y editar. */
async function prepararDatos(supabase: SupabaseClient, fd: FormData): Promise<Preparado> {
  const { datos, errores } = parsearFormulario(fd);

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores, mensaje: "Revisa los campos marcados." };
  }

  // Empresa / departamento / área son opcionales; lo que venga se valida contra los catálogos.
  if (datos.empresa_id) {
    const { data: empresa } = await supabase.from("empresas").select("id, nombre").eq("id", datos.empresa_id as string).eq("activo", true).maybeSingle();
    if (!empresa) return { ok: false, errores: { empresa_area: "La empresa no es válida." } };
    const partes: string[] = [empresa.nombre];

    if (datos.departamento_id) {
      const { data: departamento } = await supabase
        .from("departamentos").select("id, nombre, empresa_id").eq("id", datos.departamento_id as string).eq("activo", true).maybeSingle();
      if (!departamento || departamento.empresa_id !== empresa.id) {
        return { ok: false, errores: { empresa_area: "El departamento no pertenece a esa empresa." } };
      }
      partes.push(departamento.nombre);

      if (datos.area_id) {
        const { data: area } = await supabase
          .from("areas").select("id, nombre").eq("id", datos.area_id as string).eq("departamento_id", departamento.id).eq("activo", true).maybeSingle();
        if (!area) return { ok: false, errores: { empresa_area: "El área no pertenece a ese departamento." } };
        partes.push(area.nombre);
      } else {
        datos.area_id = null;
      }
    } else {
      datos.departamento_id = null;
      datos.area_id = null;
    }
    datos.empresa_area = partes.join(" / ");
  } else {
    datos.empresa_id = null;
    datos.departamento_id = null;
    datos.area_id = null;
    datos.empresa_area = null;
  }

  return { ok: true, datos };
}

/**
 * Guarda un requerimiento nuevo. `solicitanteId` es null cuando llega por el enlace
 * público; en ese caso `supabase` debe ser el cliente admin (RLS exige uid).
 */
export async function guardarRequerimiento(
  supabase: SupabaseClient,
  fd: FormData,
  solicitanteId: string | null,
): Promise<ResultadoCrear> {
  const prep = await prepararDatos(supabase, fd);
  if (!prep.ok) return prep;
  const datos = prep.datos;

  const { data, error } = await supabase
    .from("requerimientos")
    .insert({ ...datos, solicitante_id: solicitanteId })
    .select("id, folio")
    .single<{ id: string; folio: string }>();

  if (error || !data) {
    console.error("Error al crear requerimiento", error);
    return { ok: false, errores: {}, mensaje: "No fue posible guardar el requerimiento. Intenta de nuevo." };
  }

  return { ok: true, id: data.id, folio: data.folio };
}

/**
 * Actualiza los campos del formulario de un requerimiento existente. Quién puede
 * hacerlo lo decide la RLS (Innovación, o el solicitante mientras no ha iniciado).
 */
export async function actualizarRequerimiento(
  supabase: SupabaseClient,
  id: string,
  fd: FormData,
): Promise<{ ok: true } | { ok: false; errores: Record<string, string>; mensaje?: string }> {
  const prep = await prepararDatos(supabase, fd);
  if (!prep.ok) return prep;

  const { data, error } = await supabase
    .from("requerimientos")
    .update(prep.datos)
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Error al actualizar requerimiento", error);
    return { ok: false, errores: {}, mensaje: "No fue posible guardar los cambios. Intenta de nuevo." };
  }
  if (!data) {
    return { ok: false, errores: {}, mensaje: "No tienes permiso para editar este requerimiento." };
  }
  return { ok: true };
}
