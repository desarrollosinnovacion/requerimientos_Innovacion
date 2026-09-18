import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { cerrarSesion } from "@/app/login/actions";
import { NavLinks, type NombreIcono } from "@/components/nav-links";
import { LogoSicsa, SimboloSicsa } from "@/components/logo-sicsa";
import { LogOut } from "lucide-react";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { perfil } = await requerirUsuario();
  const esInnovacion = perfil.rol === "innovacion";

  const enlaces: { href: string; etiqueta: string; icono: NombreIcono }[] = [
    { href: "/", etiqueta: "Inicio", icono: "inicio" },
    { href: "/requerimientos", etiqueta: "Requerimientos", icono: "lista" },
    { href: "/proyectos", etiqueta: "Proyectos", icono: "tablero" },
    ...(esInnovacion ? [{ href: "/configuracion", etiqueta: "Configuración", icono: "engrane" as const }] : []),
  ];

  return (
    <div className="flex min-h-screen">
      {/* Barra lateral siempre visible: compacta (solo iconos) en pantallas pequeñas, completa en grandes */}
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col bg-sidebar text-sidebar-fg lg:w-64">
        <div className="border-b border-sidebar-border px-3 py-4 lg:px-5">
          <Link href="/" className="block" title="Requerimientos · Innovación">
            {/* Menos de 120 px de ancho: solo el símbolo (manual, p. 03). */}
            <SimboloSicsa variante="beige" tamano={36} className="lg:hidden" />
            <span className="hidden lg:block">
              <LogoSicsa variante="beige" ancho={132} />
              <span className="etiqueta mt-3 block text-sidebar-muted">Requerimientos · Innovación</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 lg:px-3">
          <NavLinks enlaces={enlaces} />
        </div>

        <div className="border-t border-sidebar-border px-2 py-4 lg:px-4">
          <div className="hidden lg:block">
            <p className="truncate text-sm font-medium">{perfil.nombre}</p>
            <p className="text-xs text-sidebar-muted">{esInnovacion ? "Equipo de Innovación" : "Solicitante"}</p>
          </div>
          <form action={cerrarSesion} className="lg:mt-3">
            <button
              type="submit"
              title="Cerrar sesión"
              className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-fg transition hover:bg-sidebar-hover lg:justify-start"
            >
              <LogOut aria-hidden className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span className="hidden lg:inline">Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

