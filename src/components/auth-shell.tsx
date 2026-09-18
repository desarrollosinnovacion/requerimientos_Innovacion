import { LogoSicsa } from "@/components/logo-sicsa";

/** Pantallas sin sesión (login, contraseña): logotipo principal y texto alineado a la izquierda. */
export function AuthShell({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <LogoSicsa variante="verde" ancho={150} />
        <div className="regla mt-6" />
        <div className="mt-6">
          <p className="etiqueta text-brand-600">Departamento de Innovación</p>
          <h1 className="mt-2 text-2xl font-medium text-slate-900">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitulo}</p>
        </div>
        <div className="card mt-6 p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}
