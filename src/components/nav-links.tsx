"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NombreIcono = "inicio" | "lista" | "engrane";
type Enlace = { href: string; etiqueta: string; icono: NombreIcono };

/** Enlaces de la barra lateral: solo icono en pantallas pequeñas, icono + texto en grandes. */
export function NavLinks({ enlaces }: { enlaces: Enlace[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {enlaces.map((e) => {
        const activo = e.href === "/" ? pathname === "/" : pathname === e.href || pathname.startsWith(`${e.href}/`);
        return (
          <Link
            key={e.href}
            href={e.href}
            title={e.etiqueta}
            aria-current={activo ? "page" : undefined}
            className={`flex items-center justify-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition lg:justify-start ${
              activo ? "bg-sidebar-active text-sidebar-active-fg" : "text-sidebar-fg hover:bg-sidebar-hover"
            }`}
          >
            <Icono nombre={e.icono} />
            <span className="hidden lg:inline">{e.etiqueta}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const base = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "h-5 w-5 shrink-0",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Icono({ nombre }: { nombre: NombreIcono }) {
  if (nombre === "inicio") {
    return (
      <svg {...base}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </svg>
    );
  }
  if (nombre === "engrane") {
    return (
      <svg {...base}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    );
  }
  return (
    <svg {...base}>
      <path d="M9 5h10M9 12h10M9 19h10" />
      <circle cx="4.5" cy="5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="19" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
