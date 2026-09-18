import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la clave service_role: omite RLS y puede administrar usuarios (auth.admin).
 * SOLO se usa en Server Actions que ya verificaron que quien llama es del equipo de Innovación.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
