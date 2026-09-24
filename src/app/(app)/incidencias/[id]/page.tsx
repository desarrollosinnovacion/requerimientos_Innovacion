import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requerirUsuario } from "@/lib/auth";
import { ES_UUID } from "@/lib/asignaciones";
import { SELECT_INCIDENCIA, type IncidenciaFila } from "@/lib/incidencias";
import type { MiembroEquipo } from "@/lib/tipos";
import { DetalleIncidencia } from "../detalle-incidencia";

/** Detalle en página completa, para enlaces directos; desde la lista se abre en ventana modal. */
export default async function PaginaDetalleIncidencia(props: PageProps<"/incidencias/[id]">) {
  const { id } = await props.params;
  if (!ES_UUID.test(id)) notFound();
  const { supabase, perfil } = await requerirUsuario();
  const esInnovacion = perfil.rol === "innovacion";

  const [{ data: inc }, { data: equipoData }] = await Promise.all([
    supabase.from("incidencias").select(SELECT_INCIDENCIA).eq("id", id).maybeSingle<IncidenciaFila>(),
    esInnovacion
      ? supabase.from("perfiles").select("id, nombre").eq("rol", "innovacion").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
  ]);
  if (!inc) notFound();
  const equipo = (equipoData ?? []) as MiembroEquipo[];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/incidencias" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.5} /> Volver a la lista
      </Link>
      <div className="card p-5">
        <DetalleIncidencia inc={inc} equipo={equipo} esInnovacion={esInnovacion} />
      </div>
    </div>
  );
}
