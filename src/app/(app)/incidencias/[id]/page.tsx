import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requerirUsuario } from "@/lib/auth";
import { ES_UUID } from "@/lib/asignaciones";
import { PRIORIDADES } from "@/lib/formulario";
import { formatearFecha } from "@/lib/formato";
import {
  CLASES_ESTADO_INCIDENCIA,
  ESTADOS_INCIDENCIA,
  type EstadoIncidencia,
  type IncidenciaFila,
} from "@/lib/incidencias";
import type { MiembroEquipo } from "@/lib/tipos";
import { BadgePrioridad, CLASES_PRIORIDAD } from "@/components/badges";
import { SelectorRapido } from "../../requerimientos/selector-rapido";
import { asignarIncidencia, cambiarEstadoIncidencia, cambiarPrioridadIncidencia } from "../actions";

type Detalle = IncidenciaFila & { creador: { nombre: string } | null };

const OPCIONES_ESTADO = (Object.keys(ESTADOS_INCIDENCIA) as EstadoIncidencia[]).map((e) => ({
  valor: e,
  etiqueta: ESTADOS_INCIDENCIA[e],
}));

export default async function DetalleIncidencia(props: PageProps<"/incidencias/[id]">) {
  const { id } = await props.params;
  if (!ES_UUID.test(id)) notFound();
  const { supabase, perfil } = await requerirUsuario();
  const esInnovacion = perfil.rol === "innovacion";

  const [{ data: inc }, { data: equipoData }] = await Promise.all([
    supabase
      .from("incidencias")
      .select(
        "*, empresa:empresas(nombre), asignado:perfiles!incidencias_asignado_id_fkey(id, nombre), creador:perfiles!incidencias_creado_por_fkey(nombre)",
      )
      .eq("id", id)
      .maybeSingle<Detalle>(),
    esInnovacion
      ? supabase.from("perfiles").select("id, nombre").eq("rol", "innovacion").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
  ]);
  if (!inc) notFound();
  const equipo = (equipoData ?? []) as MiembroEquipo[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/incidencias" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.5} /> Volver a la lista
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-medium text-slate-900">{inc.titulo}</h1>
          {!esInnovacion && (
            <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${CLASES_ESTADO_INCIDENCIA[inc.estado]}`}>
              {ESTADOS_INCIDENCIA[inc.estado]}
            </span>
          )}
        </div>
        <p className="mt-1 text-slate-700">
          <span className="font-mono text-sm text-brand-600">{inc.folio}</span>
          <span className="text-slate-500"> · {inc.empresa?.nombre ?? "Sin unidad"}</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Reportada por {inc.reportado_por ?? "sin nombre"}
          {inc.creador && inc.creador.nombre !== inc.reportado_por && ` · registrada por ${inc.creador.nombre}`}
          {" "}el {formatearFecha(inc.creado_en, true)}
        </p>
      </div>

      {/* Seguimiento: Innovación cambia aquí mismo; los demás solo ven. */}
      <section className="card p-5" aria-labelledby="seguimiento">
        <h2 id="seguimiento" className="text-base font-medium text-slate-900">Seguimiento</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Estado</dt>
            <dd className="mt-1.5">
              {esInnovacion ? (
                <SelectorRapido
                  etiqueta={`Estado de ${inc.folio}`}
                  valor={inc.estado}
                  opciones={OPCIONES_ESTADO}
                  clases={CLASES_ESTADO_INCIDENCIA}
                  guardar={cambiarEstadoIncidencia.bind(null, inc.id)}
                />
              ) : (
                <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${CLASES_ESTADO_INCIDENCIA[inc.estado]}`}>
                  {ESTADOS_INCIDENCIA[inc.estado]}
                </span>
              )}
              {inc.estado === "resuelta" && inc.resuelta_en && (
                <p className="mt-1 text-xs text-slate-500">Resuelta el {formatearFecha(inc.resuelta_en, true)}</p>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Prioridad</dt>
            <dd className="mt-1.5">
              {esInnovacion ? (
                <SelectorRapido
                  etiqueta={`Prioridad de ${inc.folio}`}
                  valor={inc.prioridad ?? ""}
                  opciones={[{ valor: "", etiqueta: "Sin definir" }, ...PRIORIDADES.map((p) => ({ valor: p, etiqueta: p }))]}
                  clases={{ ...CLASES_PRIORIDAD, "": "bg-slate-100 text-slate-500" }}
                  guardar={cambiarPrioridadIncidencia.bind(null, inc.id)}
                />
              ) : (
                <BadgePrioridad prioridad={inc.prioridad} />
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Responsable</dt>
            <dd className="mt-1.5">
              {esInnovacion ? (
                <SelectorRapido
                  etiqueta={`Responsable de ${inc.folio}`}
                  valor={inc.asignado?.id ?? ""}
                  opciones={[{ valor: "", etiqueta: "Sin asignar" }, ...equipo.map((m) => ({ valor: m.id, etiqueta: m.nombre }))]}
                  clases={{ "": "bg-cobre-100 text-cobre-800" }}
                  guardar={asignarIncidencia.bind(null, inc.id)}
                />
              ) : (
                <span className={inc.asignado ? "text-sm text-slate-800" : "text-xs text-slate-400"}>{inc.asignado?.nombre ?? "Sin asignar"}</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-5" aria-labelledby="descripcion">
        <h2 id="descripcion" className="text-base font-medium text-slate-900">Descripción</h2>
        {inc.descripcion ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{inc.descripcion}</p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Sin descripción.</p>
        )}
      </section>

      <p className="text-xs text-slate-500">Última actualización: {formatearFecha(inc.actualizado_en, true)}</p>
    </div>
  );
}
