import { cookies } from "next/headers";
import { requerirUsuario } from "@/lib/auth";
import { cerrarSesion } from "@/app/login/actions";
import { AppShell, COOKIE_MENU } from "@/components/app-shell";
import type { NombreIcono } from "@/components/nav-links";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [{ perfil }, jar] = await Promise.all([requerirUsuario(), cookies()]);
  const esInnovacion = perfil.rol === "innovacion";

  const enlaces: { href: string; etiqueta: string; icono: NombreIcono }[] = [
    { href: "/", etiqueta: "Inicio", icono: "inicio" },
    { href: "/requerimientos", etiqueta: "Requerimientos", icono: "lista" },
    { href: "/proyectos", etiqueta: "Proyectos", icono: "tablero" },
    ...(esInnovacion ? [{ href: "/configuracion", etiqueta: "Configuración", icono: "engrane" as const }] : []),
  ];

  return (
    <AppShell
      enlaces={enlaces}
      nombre={perfil.nombre}
      rolEtiqueta={esInnovacion ? "Equipo de Innovación" : "Solicitante"}
      // Por defecto el menú va contraído; solo se expande si el usuario lo pidió.
      colapsadoInicial={jar.get(COOKIE_MENU)?.value !== "visible"}
      cerrarSesion={cerrarSesion}
    >
      {children}
    </AppShell>
  );
}
