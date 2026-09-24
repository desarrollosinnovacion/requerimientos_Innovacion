import { notFound, redirect } from "next/navigation";
import { requerirUsuario } from "@/lib/auth";
import { ES_UUID } from "@/lib/asignaciones";
import { cargarHoja } from "@/lib/indicadores-datos";
import { HojaIndicadores } from "./hoja-indicadores";

export default async function PeriodoPage(props: PageProps<"/indicadores/[id]">) {
  const { id } = await props.params;
  if (!ES_UUID.test(id)) notFound();
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") redirect("/");

  const hoja = await cargarHoja(supabase, id);
  if (!hoja) notFound();

  return <HojaIndicadores hoja={hoja} />;
}
