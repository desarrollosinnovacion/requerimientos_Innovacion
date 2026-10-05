"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { ES_UUID } from "@/lib/asignaciones";
import { cifrar, descifrar, hayClaveCifrado, ErrorCifrado } from "@/lib/cifrado";
import { MAX_SECRETO, esAmbiente, type AccionBitacora } from "@/lib/credenciales";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };
export type EstadoFormAplicacion = { ok?: true; id?: string; error?: string; errores?: Record<string, string> };
export type EstadoFormCredencial = { ok?: true; error?: string; errores?: Record<string, string> };
export type ResultadoRevelar = { ok: true; secreto: string } | { ok: false; error: string };

const SIN_PERMISO = "Solo el equipo de Innovación puede administrar credenciales.";
const SIN_CLAVE = "Falta CREDENCIALES_CLAVE en el servidor; no se pueden guardar ni leer secretos.";

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();

function urlValida(u: string) {
  try {
    const p = new URL(u).protocol;
    return p === "http:" || p === "https:";
  } catch {
    return false;
  }
}

/** Sesión + comprobación de rol. Nunca se usa el cliente admin: la RLS es la segunda barrera. */
async function requerirInnovacion() {
  const { supabase, user, perfil } = await requerirUsuario();
  return { supabase, user, autorizado: perfil.rol === "innovacion" };
}

type Supabase = Awaited<ReturnType<typeof requerirUsuario>>["supabase"];
type DatosBitacora = { credencial_id: string | null; aplicacion_id: string | null; etiqueta: string };

/** Agrega una fila a la bitácora. Devuelve el error de Supabase (si lo hay) para que quien llama decida. */
async function anotar(supabase: Supabase, usuarioId: string, accion: AccionBitacora, datos: DatosBitacora) {
  const { error } = await supabase.from("credenciales_bitacora").insert({ ...datos, usuario_id: usuarioId, accion });
  if (error) console.error("Bitácora de credenciales", accion, error.code, error.message);
  return error;
}

// ---------- Aplicaciones -----------------------------------------------------

function validarAplicacion(fd: FormData) {
  const datos = {
    nombre: texto(fd, "nombre"),
    url: texto(fd, "url"),
    descripcion: texto(fd, "descripcion"),
    empresa_id: texto(fd, "empresa_id"),
    requerimiento_id: texto(fd, "requerimiento_id"),
  };
  const errores: Record<string, string> = {};
  if (!datos.nombre) errores.nombre = "Escribe el nombre de la aplicación.";
  if (datos.nombre.length > 120) errores.nombre = "Máximo 120 caracteres.";
  if (datos.url && (datos.url.length > 500 || !urlValida(datos.url))) errores.url = "Escribe una URL completa (https://…).";
  if (datos.descripcion.length > 2000) errores.descripcion = "Máximo 2000 caracteres.";
  if (datos.empresa_id && !ES_UUID.test(datos.empresa_id)) errores.empresa_id = "Unidad de negocio no válida.";
  if (datos.requerimiento_id && !ES_UUID.test(datos.requerimiento_id)) errores.requerimiento_id = "Requerimiento no válido.";
  return { datos, errores };
}

const filaAplicacion = (d: ReturnType<typeof validarAplicacion>["datos"]) => ({
  nombre: d.nombre,
  url: d.url || null,
  descripcion: d.descripcion || null,
  empresa_id: d.empresa_id || null,
  requerimiento_id: d.requerimiento_id || null,
});

const esDuplicado = (e: { code?: string } | null) => e?.code === "23505";

export async function crearAplicacion(_prev: EstadoFormAplicacion, fd: FormData): Promise<EstadoFormAplicacion> {
  const { supabase, user, autorizado } = await requerirInnovacion();
  if (!autorizado) return { error: SIN_PERMISO };

  const { datos, errores } = validarAplicacion(fd);
  if (Object.keys(errores).length > 0) return { errores, error: "Revisa los campos marcados." };

  const { data, error } = await supabase
    .from("aplicaciones")
    .insert({ ...filaAplicacion(datos), creado_por: user.id })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    if (esDuplicado(error)) return { errores: { nombre: "Ya existe una aplicación con ese nombre." }, error: "Revisa los campos marcados." };
    console.error("Error al crear aplicación", error?.code, error?.message);
    return { error: "No fue posible guardar la aplicación. Intenta de nuevo." };
  }

  revalidatePath("/credenciales");
  return { ok: true, id: data.id };
}

export async function editarAplicacion(_prev: EstadoFormAplicacion, fd: FormData): Promise<EstadoFormAplicacion> {
  const { supabase, autorizado } = await requerirInnovacion();
  if (!autorizado) return { error: SIN_PERMISO };

  const id = texto(fd, "id");
  if (!ES_UUID.test(id)) return { error: "Aplicación no válida." };
  const { datos, errores } = validarAplicacion(fd);
  if (Object.keys(errores).length > 0) return { errores, error: "Revisa los campos marcados." };

  const { error } = await supabase.from("aplicaciones").update(filaAplicacion(datos)).eq("id", id);
  if (error) {
    if (esDuplicado(error)) return { errores: { nombre: "Ya existe una aplicación con ese nombre." }, error: "Revisa los campos marcados." };
    console.error("Error al editar aplicación", error.code, error.message);
    return { error: "No fue posible guardar los cambios. Intenta de nuevo." };
  }

  revalidatePath("/credenciales");
  revalidatePath(`/credenciales/${id}`);
  return { ok: true, id };
}

/** Borra la aplicación y sus credenciales (cascade); cada credencial deja rastro en la bitácora. */
export async function eliminarAplicacion(id: string): Promise<ResultadoAccion> {
  const { supabase, user, autorizado } = await requerirInnovacion();
  if (!autorizado) return { ok: false, error: SIN_PERMISO };
  if (!ES_UUID.test(id)) return { ok: false, error: "Aplicación no válida." };

  const { data: creds } = await supabase
    .from("credenciales")
    .select("id, etiqueta")
    .eq("aplicacion_id", id)
    .returns<{ id: string; etiqueta: string }[]>();
  for (const c of creds ?? []) {
    await anotar(supabase, user.id, "eliminar", { credencial_id: c.id, aplicacion_id: id, etiqueta: c.etiqueta });
  }

  const { error } = await supabase.from("aplicaciones").delete().eq("id", id);
  if (error) {
    console.error("Error al eliminar aplicación", error.code, error.message);
    return { ok: false, error: "No fue posible eliminar la aplicación." };
  }

  revalidatePath("/credenciales");
  return { ok: true };
}

// ---------- Credenciales -----------------------------------------------------

function validarCredencial(fd: FormData, secretoObligatorio: boolean) {
  const tieneMfa = texto(fd, "tiene_mfa") === "si";
  const datos = {
    aplicacion_id: texto(fd, "aplicacion_id"),
    etiqueta: texto(fd, "etiqueta"),
    usuario: texto(fd, "usuario"),
    // Sin trim: un secreto puede empezar o terminar con espacio a propósito.
    secreto: String(fd.get("secreto") ?? ""),
    ambiente: texto(fd, "ambiente"),
    notas: texto(fd, "notas"),
    tiene_mfa: tieneMfa,
    // Si no tiene MFA, no hay titulares aunque vinieran casillas marcadas.
    mfa_titulares: tieneMfa ? [...new Set(fd.getAll("mfa_titulares").map((v) => String(v).trim()).filter(Boolean))] : [],
  };
  const errores: Record<string, string> = {};
  if (datos.mfa_titulares.some((id) => !ES_UUID.test(id))) errores.mfa_titulares = "Selección de equipo no válida.";
  if (!ES_UUID.test(datos.aplicacion_id)) errores.aplicacion_id = "Aplicación no válida.";
  if (!datos.etiqueta) errores.etiqueta = "Escribe para qué es esta credencial.";
  if (datos.etiqueta.length > 120) errores.etiqueta = "Máximo 120 caracteres.";
  if (datos.usuario.length > 200) errores.usuario = "Máximo 200 caracteres.";
  if (secretoObligatorio && !datos.secreto) errores.secreto = "Escribe la contraseña o secreto.";
  if (datos.secreto.length > MAX_SECRETO) errores.secreto = `Máximo ${MAX_SECRETO} caracteres.`;
  if (!esAmbiente(datos.ambiente)) errores.ambiente = "Ambiente no válido.";
  if (datos.notas.length > 2000) errores.notas = "Máximo 2000 caracteres.";
  return { datos, errores };
}

/** Reemplaza el conjunto de miembros que tienen el MFA de la credencial (mismo patrón que reemplazarAsignados). */
async function reemplazarTitularesMfa(supabase: Supabase, credencialId: string, titulares: string[]): Promise<string | null> {
  const { error: errBorrar } = await supabase.from("credencial_mfa_titulares").delete().eq("credencial_id", credencialId);
  if (errBorrar) {
    console.error("Error al limpiar titulares MFA", errBorrar.code, errBorrar.message);
    return "No fue posible guardar quiénes tienen el MFA.";
  }
  if (titulares.length === 0) return null;
  const { error } = await supabase
    .from("credencial_mfa_titulares")
    .insert(titulares.map((perfil_id) => ({ credencial_id: credencialId, perfil_id })));
  if (error) {
    console.error("Error al guardar titulares MFA", error.code, error.message);
    return "No fue posible guardar quiénes tienen el MFA.";
  }
  return null;
}

export async function crearCredencial(_prev: EstadoFormCredencial, fd: FormData): Promise<EstadoFormCredencial> {
  const { supabase, user, autorizado } = await requerirInnovacion();
  if (!autorizado) return { error: SIN_PERMISO };
  if (!hayClaveCifrado()) return { error: SIN_CLAVE };

  const { datos, errores } = validarCredencial(fd, true);
  if (Object.keys(errores).length > 0) return { errores, error: "Revisa los campos marcados." };

  // El id se genera aquí porque es el AAD del cifrado.
  const id = randomUUID();
  const { error } = await supabase.from("credenciales").insert({
    id,
    aplicacion_id: datos.aplicacion_id,
    etiqueta: datos.etiqueta,
    usuario: datos.usuario || null,
    secreto_cifrado: cifrar(datos.secreto, id),
    ambiente: datos.ambiente,
    notas: datos.notas || null,
    tiene_mfa: datos.tiene_mfa,
    creado_por: user.id,
    actualizado_por: user.id,
  });
  if (error) {
    console.error("Error al crear credencial", error.code, error.message);
    return { error: "No fue posible guardar la credencial. Intenta de nuevo." };
  }

  const errMfa = await reemplazarTitularesMfa(supabase, id, datos.mfa_titulares);
  await anotar(supabase, user.id, "crear", { credencial_id: id, aplicacion_id: datos.aplicacion_id, etiqueta: datos.etiqueta });
  revalidatePath(`/credenciales/${datos.aplicacion_id}`);
  // La credencial ya quedó guardada; se avisa solo del detalle que falló.
  if (errMfa) return { error: `${errMfa} La credencial sí se guardó; edítala para corregirlo.` };
  revalidatePath("/credenciales");
  revalidatePath(`/credenciales/${datos.aplicacion_id}`);
  return { ok: true };
}

/** El secreto es opcional al editar: si viene vacío, se conserva el actual. */
export async function editarCredencial(_prev: EstadoFormCredencial, fd: FormData): Promise<EstadoFormCredencial> {
  const { supabase, user, autorizado } = await requerirInnovacion();
  if (!autorizado) return { error: SIN_PERMISO };

  const id = texto(fd, "id");
  if (!ES_UUID.test(id)) return { error: "Credencial no válida." };
  const { datos, errores } = validarCredencial(fd, false);
  if (datos.secreto && !hayClaveCifrado()) errores.secreto = SIN_CLAVE;
  if (Object.keys(errores).length > 0) return { errores, error: "Revisa los campos marcados." };

  const cambios: Record<string, string | null> = {
    etiqueta: datos.etiqueta,
    usuario: datos.usuario || null,
    ambiente: datos.ambiente,
    notas: datos.notas || null,
    actualizado_por: user.id,
  };
  if (datos.secreto) cambios.secreto_cifrado = cifrar(datos.secreto, id);

  const { error } = await supabase
    .from("credenciales")
    .update({ ...cambios, tiene_mfa: datos.tiene_mfa })
    .eq("id", id)
    .eq("aplicacion_id", datos.aplicacion_id);
  if (error) {
    console.error("Error al editar credencial", error.code, error.message);
    return { error: "No fue posible guardar los cambios. Intenta de nuevo." };
  }

  const errMfa = await reemplazarTitularesMfa(supabase, id, datos.mfa_titulares);
  await anotar(supabase, user.id, "editar", { credencial_id: id, aplicacion_id: datos.aplicacion_id, etiqueta: datos.etiqueta });
  revalidatePath(`/credenciales/${datos.aplicacion_id}`);
  if (errMfa) return { error: errMfa };
  return { ok: true };
}

export async function eliminarCredencial(id: string): Promise<ResultadoAccion> {
  const { supabase, user, autorizado } = await requerirInnovacion();
  if (!autorizado) return { ok: false, error: SIN_PERMISO };
  if (!ES_UUID.test(id)) return { ok: false, error: "Credencial no válida." };

  const { data: cred } = await supabase
    .from("credenciales")
    .select("id, aplicacion_id, etiqueta")
    .eq("id", id)
    .maybeSingle<{ id: string; aplicacion_id: string; etiqueta: string }>();
  if (!cred) return { ok: false, error: "No se encontró la credencial." };

  await anotar(supabase, user.id, "eliminar", { credencial_id: cred.id, aplicacion_id: cred.aplicacion_id, etiqueta: cred.etiqueta });

  const { error } = await supabase.from("credenciales").delete().eq("id", id);
  if (error) {
    console.error("Error al eliminar credencial", error.code, error.message);
    return { ok: false, error: "No fue posible eliminar la credencial." };
  }

  revalidatePath("/credenciales");
  revalidatePath(`/credenciales/${cred.aplicacion_id}`);
  return { ok: true };
}

/**
 * Única acción que lee secreto_cifrado. Primero anota en la bitácora: si no
 * queda registrado quién consultó, no se revela. El secreto viaja solo en la
 * respuesta a quien lo pidió; nunca forma parte del render de la página.
 */
export async function revelarSecreto(id: string): Promise<ResultadoRevelar> {
  const { supabase, user, autorizado } = await requerirInnovacion();
  if (!autorizado) return { ok: false, error: SIN_PERMISO };
  if (!ES_UUID.test(id)) return { ok: false, error: "Credencial no válida." };
  if (!hayClaveCifrado()) return { ok: false, error: SIN_CLAVE };

  const { data: cred, error } = await supabase
    .from("credenciales")
    .select("id, aplicacion_id, etiqueta, secreto_cifrado")
    .eq("id", id)
    .maybeSingle<{ id: string; aplicacion_id: string; etiqueta: string; secreto_cifrado: string }>();
  if (error || !cred) return { ok: false, error: "No se encontró la credencial." };

  const errBitacora = await anotar(supabase, user.id, "revelar", { credencial_id: cred.id, aplicacion_id: cred.aplicacion_id, etiqueta: cred.etiqueta });
  if (errBitacora) return { ok: false, error: "No fue posible registrar la consulta en la bitácora; no se muestra el secreto." };

  try {
    const secreto = descifrar(cred.secreto_cifrado, cred.id);
    // Refresca la bitácora al pie de la ficha.
    revalidatePath(`/credenciales/${cred.aplicacion_id}`);
    return { ok: true, secreto };
  } catch (e) {
    const codigo = e instanceof ErrorCifrado ? e.codigo : "desconocido";
    console.error("Descifrado de credencial", codigo);
    return { ok: false, error: e instanceof ErrorCifrado ? e.message : "No fue posible descifrar el secreto." };
  }
}
