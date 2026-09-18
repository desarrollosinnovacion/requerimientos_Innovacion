"use server";

import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generarPassword } from "@/lib/password";

export type EstadoUsuarios = {
  error?: string;
  ok?: boolean;
  mensaje?: string;
  /** Contraseña temporal generada (solo al crear o reiniciar). */
  password?: string;
  correo?: string;
};

const ROLES = ["solicitante", "innovacion"] as const;
type Rol = (typeof ROLES)[number];

// Un "ban" muy largo equivale a desactivar la cuenta en Supabase Auth.
const BAN_DESACTIVADO = "876000h"; // ~100 años

async function requerirInnovacion() {
  const { perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") throw new Error("Sin permisos");
  return perfil;
}

function esRol(v: unknown): v is Rol {
  return ROLES.includes(v as Rol);
}

function mensajeAuth(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already been registered") || m.includes("already exists")) return "Ya existe un usuario con ese correo.";
  if (m.includes("invalid") && m.includes("email")) return "El correo no es válido.";
  if (m.includes("service_role") || m.includes("jwt") || m.includes("api key")) return "La clave service_role no es válida. Revisa SUPABASE_SERVICE_ROLE_KEY.";
  return `No fue posible completar la operación: ${message}`;
}

function errorInesperado(e: unknown): EstadoUsuarios {
  return { error: e instanceof Error ? e.message : "Error inesperado." };
}

export async function crearUsuario(_prev: EstadoUsuarios, fd: FormData): Promise<EstadoUsuarios> {
  await requerirInnovacion();

  const nombre = String(fd.get("nombre") ?? "").trim();
  const correo = String(fd.get("correo") ?? "").trim().toLowerCase();
  const rol = fd.get("rol");

  if (!nombre || !correo) return { error: "Completa nombre y correo." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return { error: "El correo no es válido." };
  if (!esRol(rol)) return { error: "Rol no válido." };

  const password = generarPassword();

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: correo,
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });
    if (error || !data.user) return { error: mensajeAuth(error?.message ?? "sin usuario") };

    // El trigger crea el perfil como 'solicitante' y sin cambio pendiente; lo ajustamos.
    const { error: errPerfil } = await admin
      .from("perfiles")
      .update({ rol, debe_cambiar_password: true })
      .eq("id", data.user.id);
    if (errPerfil) {
      return { error: "Usuario creado, pero no se pudo completar su perfil. Revisa la lista.", password, correo };
    }
  } catch (e) {
    return errorInesperado(e);
  }

  revalidatePath("/configuracion/usuarios");
  return { ok: true, mensaje: `Usuario ${correo} creado.`, password, correo };
}

export async function reiniciarPassword(_prev: EstadoUsuarios, fd: FormData): Promise<EstadoUsuarios> {
  const yo = await requerirInnovacion();
  const id = String(fd.get("id") ?? "");
  const correo = String(fd.get("correo") ?? "");
  if (!id) return { error: "Usuario no válido." };

  const password = generarPassword();
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) return { error: mensajeAuth(error.message) };
    // Quien reinicia su propia contraseña no queda bloqueado en la pantalla de cambio a mitad de sesión.
    if (id !== yo.id) {
      await admin.from("perfiles").update({ debe_cambiar_password: true }).eq("id", id);
    }
  } catch (e) {
    return errorInesperado(e);
  }

  revalidatePath("/configuracion/usuarios");
  return { ok: true, mensaje: "Contraseña reiniciada.", password, correo };
}

export async function alternarActivo(_prev: EstadoUsuarios, fd: FormData): Promise<EstadoUsuarios> {
  const yo = await requerirInnovacion();
  const id = String(fd.get("id") ?? "");
  const activar = fd.get("activar") === "true";
  if (!id) return { error: "Usuario no válido." };
  if (id === yo.id && !activar) return { error: "No puedes desactivar tu propia cuenta." };

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(id, {
      ban_duration: activar ? "none" : BAN_DESACTIVADO,
    });
    if (error) return { error: mensajeAuth(error.message) };
    const { error: errPerfil } = await admin.from("perfiles").update({ activo: activar }).eq("id", id);
    if (errPerfil) return { error: "No fue posible actualizar el estado del perfil." };
  } catch (e) {
    return errorInesperado(e);
  }

  revalidatePath("/configuracion/usuarios");
  return { ok: true, mensaje: activar ? "Usuario activado." : "Usuario desactivado. Ya no podrá iniciar sesión." };
}

export async function cambiarRol(_prev: EstadoUsuarios, fd: FormData): Promise<EstadoUsuarios> {
  const yo = await requerirInnovacion();
  const id = String(fd.get("id") ?? "");
  const rol = fd.get("rol");
  if (!id || !esRol(rol)) return { error: "Datos no válidos." };
  if (id === yo.id && rol !== "innovacion") return { error: "No puedes quitarte tu propio rol de Innovación." };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("perfiles").update({ rol }).eq("id", id);
    if (error) return { error: "No fue posible cambiar el rol." };
  } catch (e) {
    return errorInesperado(e);
  }
  revalidatePath("/configuracion/usuarios");
  return { ok: true, mensaje: "Rol actualizado." };
}

export async function eliminarUsuario(_prev: EstadoUsuarios, fd: FormData): Promise<EstadoUsuarios> {
  const yo = await requerirInnovacion();
  const id = String(fd.get("id") ?? "");
  if (!id) return { error: "Usuario no válido." };
  if (id === yo.id) return { error: "No puedes eliminar tu propia cuenta." };

  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("requerimientos")
      .select("id", { count: "exact", head: true })
      .eq("solicitante_id", id);
    if (count && count > 0) {
      return { error: `No se puede eliminar: tiene ${count} requerimiento(s) registrados. Desactívalo en su lugar.` };
    }
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return { error: mensajeAuth(error.message) };
  } catch (e) {
    return errorInesperado(e);
  }
  revalidatePath("/configuracion/usuarios");
  return { ok: true, mensaje: "Usuario eliminado." };
}
