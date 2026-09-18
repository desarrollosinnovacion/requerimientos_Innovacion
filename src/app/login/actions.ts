"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoAuth = { error?: string; mensaje?: string };

function destinoSeguro(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/";
}

export async function iniciarSesion(_prev: EstadoAuth, fd: FormData): Promise<EstadoAuth> {
  const correo = String(fd.get("correo") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!correo || !password) return { error: "Ingresa tu correo y contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password });
  if (error) {
    console.error("Error en signIn:", { code: error.code, status: error.status, message: error.message });
    if (error.code === "user_banned") return { error: "Tu cuenta está desactivada. Contacta al Departamento de Innovación." };
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Confirma tu correo antes de iniciar sesión."
          : "Correo o contraseña incorrectos.",
    };
  }
  redirect(destinoSeguro(fd.get("next")));
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
