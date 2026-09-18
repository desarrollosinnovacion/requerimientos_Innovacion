"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, SquareKanban, Settings } from "lucide-react";

export type NombreIcono = "inicio" | "lista" | "tablero" | "engrane";
type Enlace = { href: string; etiqueta: string; icono: NombreIcono };

// Set único de iconos: Lucide, trazo 1.5 (manual, p. 08).
const ICONOS = { inicio: LayoutDashboard, lista: ClipboardList, tablero: SquareKanban, engrane: Settings } as const;

/** Enlaces de la barra lateral: solo icono en pantallas pequeñas, icono + texto en grandes. */
export function NavLinks({ enlaces }: { enlaces: Enlace[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-0.5">
      {enlaces.map((e) => {
        const Icono = ICONOS[e.icono];
        const activo = e.href === "/" ? pathname === "/" : pathname === e.href || pathname.startsWith(`${e.href}/`);
        return (
          <Link
            key={e.href}
            href={e.href}
            title={e.etiqueta}
            aria-current={activo ? "page" : undefined}
            className={`flex items-center justify-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition lg:justify-start ${
              activo
                ? "border-sidebar-muted bg-sidebar-active text-sidebar-active-fg"
                : "border-transparent text-sidebar-fg hover:bg-sidebar-hover"
            }`}
          >
            <Icono aria-hidden className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            <span className="hidden lg:inline">{e.etiqueta}</span>
          </Link>
        );
      })}
    </nav>
  );
}
