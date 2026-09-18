import { redirect } from "next/navigation";
import { requerirUsuario } from "@/lib/auth";

export default async function ConfiguracionLayout({ children }: LayoutProps<"/configuracion">) {
  const { perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") redirect("/requerimientos");
  return <>{children}</>;
}
