"use client";

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
import { SelectorRapido } from "../requerimientos/selector-rapido";
import { asignarIncidencia, cambiarEstadoIncidencia, cambiarPrioridadIncidencia } from "./actions";

export const OPCIONES_ESTADO_INCIDENCIA = (Object.keys(ESTADOS_INCIDENCIA) as EstadoIncidencia[]).map((e) => ({
  valor: e,
  etiqueta: ESTADOS_INCIDENCIA[e],
}));

type Props = {
  inc: IncidenciaFila;
  equipo: MiembroEquipo[];
  esInnovacion: boolean;
};

/**
 * Contenido del detalle de una incidencia. Lo usan la ventana modal de la lista
 * y la página /incidencias/[id] (para enlaces directos). Innovación cambia el
 * seguimiento aquí mismo; los demás solo ven.
 */
export function DetalleIncidencia({ inc, equipo, esInnovacion }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-3 pr-8">
          <h2 className="text-xl font-medium text-slate-900">{inc.titulo}</h2>
          {!esInnovacion && <EtiquetaEstado estado={inc.estado} />}
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

      <section className="rounded-md border border-slate-200 p-4" aria-label="Seguimiento">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Estado</dt>
            <dd className="mt-1.5">
              {esInnovacion ? (
                <SelectorRapido
                  etiqueta={`Estado de ${inc.folio}`}
                  valor={inc.estado}
                  opciones={OPCIONES_ESTADO_INCIDENCIA}
                  clases={CLASES_ESTADO_INCIDENCIA}
                  guardar={(v) => cambiarEstadoIncidencia(inc.id, v)}
                />
              ) : (
                <EtiquetaEstado estado={inc.estado} />
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
                  guardar={(v) => cambiarPrioridadIncidencia(inc.id, v)}
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
                  guardar={(v) => asignarIncidencia(inc.id, v)}
                />
              ) : (
                <span className={inc.asignado ? "text-sm text-slate-800" : "text-xs text-slate-400"}>{inc.asignado?.nombre ?? "Sin asignar"}</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-label="Descripción">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Descripción</h3>
        {inc.descripcion ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{inc.descripcion}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Sin descripción.</p>
        )}
      </section>

      <p className="text-xs text-slate-500">Última actualización: {formatearFecha(inc.actualizado_en, true)}</p>
    </div>
  );
}

function EtiquetaEstado({ estado }: { estado: EstadoIncidencia }) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${CLASES_ESTADO_INCIDENCIA[estado]}`}>
      {ESTADOS_INCIDENCIA[estado]}
    </span>
  );
}
