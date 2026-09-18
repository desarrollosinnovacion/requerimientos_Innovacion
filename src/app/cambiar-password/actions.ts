"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoCambio = { error?: string };

export async function cambiarPassword(_prev: EstadoCambio, fd: FormData): Promise<EstadoCambio> {
  const password = String(fd.get("password") ?? "");
  const confirmar = String(fd.get("confirmar") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return { error: "Usa al menos una letra y un número." };
  if (password !== confirmar) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("different from the old") || m.includes("same password")) {
      return { error: "La nueva contraseña debe ser distinta a la temporal." };
    }
    console.error("Error al cambiar contraseña:", error);
    return { error: "No fue posible cambiar la contraseña. Intenta de nuevo." };
  }

  try {
    const admin = createAdminClient();
    await admin.from("perfiles").update({ debe_cambiar_password: false }).eq("id", user.id);
  } catch (e) {
    console.error("No se pudo limpiar debe_cambiar_password:", e);
  }

  redirect("/");
}
