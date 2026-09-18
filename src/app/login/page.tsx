import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const { next, error } = await props.searchParams;
  return (
    <AuthShell titulo="Iniciar sesión" subtitulo="Accede para crear y dar seguimiento a tus requerimientos.">
      {error === "cuenta_desactivada" && (
        <p role="alert" className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tu cuenta está desactivada. Contacta al Departamento de Innovación.
        </p>
      )}
      {error === "enlace_invalido" && (
        <p role="alert" className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          El enlace de confirmación no es válido o ya expiró. Intenta iniciar sesión.
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-xs text-slate-500">
        ¿No tienes cuenta? Solicítala al Departamento de Innovación.
      </p>
    </AuthShell>
  );
}
