import { requerirUsuario } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { cerrarSesion } from "@/app/login/actions";
import { CambiarPasswordForm } from "./form";

export default async function CambiarPasswordPage() {
  const { perfil } = await requerirUsuario({ permitirCambioPendiente: true });

  return (
    <AuthShell
      titulo="Define tu contraseña"
      subtitulo={
        perfil.debe_cambiar_password
          ? "Entraste con una contraseña temporal. Elige una nueva para continuar."
          : "Cambia tu contraseña de acceso."
      }
    >
      <CambiarPasswordForm />
      <form action={cerrarSesion} className="mt-6 text-center">
        <button type="submit" className="text-xs text-slate-500 hover:text-slate-800 hover:underline">
          Cerrar sesión ({perfil.correo})
        </button>
      </form>
    </AuthShell>
  );
}
