import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/tipos";

type Opciones = {
  /** La página de cambio de contraseña debe poder cargarse aunque el cambio esté pendiente. */
  permitirCambioPendiente?: boolean;
};

/**
 * Devuelve el usuario autenticado y su perfil.
 * - Sin sesión: redirige a /login.
 * - Usuario desactivado: cierra sesión y redirige a /login.
 * - Cambio de contraseña pendiente: redirige a /cambiar-password.
 */
export async function requerirUsuario(opciones: Opciones = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre, correo, rol, activo, debe_cambiar_password")
    .eq("id", user.id)
    .maybeSingle<Perfil>();

  const perfil: Perfil = data ?? {
    id: user.id,
    nombre: user.email?.split("@")[0] ?? "Usuario",
    correo: user.email ?? "",
    rol: "solicitante",
    activo: true,
    debe_cambiar_password: false,
  };

  if (!perfil.activo) {
    await supabase.auth.signOut();
    redirect("/login?error=cuenta_desactivada");
  }

  if (perfil.debe_cambiar_password && !opciones.permitirCambioPendiente) {
    redirect("/cambiar-password");
  }

  return { supabase, user, perfil };
}
