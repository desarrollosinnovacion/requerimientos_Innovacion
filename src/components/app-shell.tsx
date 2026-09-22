"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLinks, type NombreIcono } from "@/components/nav-links";
import { LogoSicsa, SimboloSicsa } from "@/components/logo-sicsa";

export const COOKIE_MENU = "menu-lateral";

type Props = {
  enlaces: { href: string; etiqueta: string; icono: NombreIcono }[];
  nombre: string;
  rolEtiqueta: string;
  /** Leído de la cookie en el servidor para que la primera pintura ya salga contraída. */
  colapsadoInicial: boolean;
  cerrarSesion: () => Promise<void>;
  children: React.ReactNode;
};

/**
 * Estructura de la app: barra lateral + contenido. En pantallas pequeñas la barra
 * siempre es compacta (solo iconos). En grandes, el usuario puede contraerla con el
 * botón "Ocultar menú" para ganar espacio; la preferencia se guarda en una cookie.
 * Arranca contraída salvo que la cookie diga lo contrario.
 */
export function AppShell({ enlaces, nombre, rolEtiqueta, colapsadoInicial, cerrarSesion, children }: Props) {
  const [colapsado, setColapsado] = useState(colapsadoInicial);
  // "amplio" = barra completa en pantallas grandes (las clases lg: solo aplican en ese caso).
  const amplio = !colapsado;

  function alternar() {
    const nuevo = !colapsado;
    setColapsado(nuevo);
    document.cookie = `${COOKIE_MENU}=${nuevo ? "oculto" : "visible"}; path=/; max-age=31536000; samesite=lax`;
  }

  const IconoMenu = colapsado ? PanelLeftOpen : PanelLeftClose;

  return (
    <div className="flex min-h-screen">
      <aside className={`sticky top-0 flex h-screen w-16 shrink-0 flex-col bg-sidebar text-sidebar-fg transition-[width] ${amplio ? "lg:w-64" : ""}`}>
        <div className={`border-b border-sidebar-border px-3 py-4 ${amplio ? "lg:px-5" : ""}`}>
          <Link href="/" className="block" title="Requerimientos · Innovación">
            {/* Menos de 120 px de ancho: solo el símbolo (manual, p. 03). */}
            <SimboloSicsa variante="beige" tamano={36} className={amplio ? "lg:hidden" : ""} />
            <span className={amplio ? "hidden lg:block" : "hidden"}>
              <LogoSicsa variante="beige" ancho={132} />
              <span className="etiqueta mt-3 block text-sidebar-muted">Requerimientos · Innovación</span>
            </span>
          </Link>
        </div>

        <div className={`flex-1 overflow-y-auto px-2 py-4 ${amplio ? "lg:px-3" : ""}`}>
          <NavLinks enlaces={enlaces} compacto={colapsado} />
        </div>

        <div className={`border-t border-sidebar-border px-2 py-4 ${amplio ? "lg:px-4" : ""}`}>
          {/* Solo tiene sentido en pantallas grandes: en pequeñas la barra ya es compacta. */}
          <button
            type="button"
            onClick={alternar}
            aria-pressed={colapsado}
            title={colapsado ? "Mostrar menú" : "Ocultar menú"}
            className={`hidden w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-fg transition hover:bg-sidebar-hover lg:flex ${
              amplio ? "lg:justify-start" : ""
            }`}
          >
            <IconoMenu aria-hidden className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            <span className={amplio ? "hidden lg:inline" : "hidden"}>Ocultar menú</span>
          </button>

          <div className={amplio ? "mt-3 hidden lg:block" : "hidden"}>
            <p className="truncate text-sm font-medium">{nombre}</p>
            <p className="text-xs text-sidebar-muted">{rolEtiqueta}</p>
          </div>
          <form action={cerrarSesion} className={amplio ? "lg:mt-3" : "mt-1"}>
            <button
              type="submit"
              title="Cerrar sesión"
              className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-fg transition hover:bg-sidebar-hover ${
                amplio ? "lg:justify-start" : ""
              }`}
            >
              <LogOut aria-hidden className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span className={amplio ? "hidden lg:inline" : "hidden"}>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {/* Con el menú contraído el contenido puede crecer un poco más. */}
        <div className={`mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 ${colapsado ? "max-w-7xl" : "max-w-6xl"}`}>{children}</div>
      </main>
    </div>
  );
}
