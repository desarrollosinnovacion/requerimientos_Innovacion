"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { PRIORIDADES } from "@/lib/formulario";
import { formatearFecha } from "@/lib/formato";
import { CLASES_ESTADO_INCIDENCIA, ESTADOS_INCIDENCIA, type IncidenciaFila } from "@/lib/incidencias";
import type { MiembroEquipo } from "@/lib/tipos";
import { BadgePrioridad, CLASES_PRIORIDAD } from "@/components/badges";
import { SelectorRapido } from "../requerimientos/selector-rapido";
import { asignarIncidencia, cambiarEstadoIncidencia, cambiarPrioridadIncidencia } from "./actions";
import { DetalleIncidencia, OPCIONES_ESTADO_INCIDENCIA } from "./detalle-incidencia";

type Props = {
  filas: IncidenciaFila[];
  equipo: MiembroEquipo[];
  esInnovacion: boolean;
};

// Responsable con aspecto neutro; "Sin asignar" se señala en Cobre como en los requerimientos.
const CLASES_ASIGNADO: Record<string, string> = { "": "bg-cobre-100 text-cobre-800" };

/**
 * Tabla de incidencias. Folio y título abren el detalle en una ventana modal para
 * no salir de la lista; el detalle se toma de la propia fila (la lista ya trae
 * todos los campos) y se actualiza cuando la lista se refresca tras un cambio.
 */
export function TablaIncidencias({ filas, equipo, esInnovacion }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const seleccionada = filas.find((i) => i.id === seleccionadaId) ?? null;

  // Si la incidencia abierta desaparece de la lista (p. ej. por un filtro), se cierra.
  useEffect(() => {
    if (seleccionadaId && !seleccionada) dialogRef.current?.close();
  }, [seleccionadaId, seleccionada]);

  function abrir(id: string) {
    setSeleccionadaId(id);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Incidencia</th>
              <th className="px-4 py-3">Reportó</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((i) => (
              <tr key={i.id} className="align-top hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                  <button type="button" onClick={() => abrir(i.id)} className="font-medium text-brand-600 hover:underline">
                    {i.folio}
                  </button>
                </td>
                <td className="max-w-md px-4 py-3">
                  <button type="button" onClick={() => abrir(i.id)} className="text-left text-slate-800 hover:text-brand-700 hover:underline">
                    {i.titulo}
                  </button>
                  {i.descripcion && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500" title={i.descripcion}>{i.descripcion}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-500">{i.empresa?.nombre ?? "Sin unidad"}</p>
                </td>
                <td className="px-4 py-3 text-slate-800">{i.reportado_por ?? "—"}</td>
                <td className="px-4 py-3">
                  {esInnovacion ? (
                    <SelectorRapido
                      etiqueta={`Responsable de ${i.folio}`}
                      valor={i.asignado?.id ?? ""}
                      opciones={[{ valor: "", etiqueta: "Sin asignar" }, ...equipo.map((m) => ({ valor: m.id, etiqueta: m.nombre }))]}
                      clases={CLASES_ASIGNADO}
                      guardar={(v) => asignarIncidencia(i.id, v)}
                    />
                  ) : (
                    <span className={i.asignado ? "text-slate-800" : "text-xs text-slate-400"}>{i.asignado?.nombre ?? "Sin asignar"}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {esInnovacion ? (
                    <SelectorRapido
                      etiqueta={`Prioridad de ${i.folio}`}
                      valor={i.prioridad ?? ""}
                      opciones={[{ valor: "", etiqueta: "Sin definir" }, ...PRIORIDADES.map((p) => ({ valor: p, etiqueta: p }))]}
                      clases={{ ...CLASES_PRIORIDAD, "": "bg-slate-100 text-slate-500" }}
                      guardar={(v) => cambiarPrioridadIncidencia(i.id, v)}
                    />
                  ) : (
                    <BadgePrioridad prioridad={i.prioridad} />
                  )}
                </td>
                <td className="px-4 py-3">
                  {esInnovacion ? (
                    <SelectorRapido
                      etiqueta={`Estado de ${i.folio}`}
                      valor={i.estado}
                      opciones={OPCIONES_ESTADO_INCIDENCIA}
                      clases={CLASES_ESTADO_INCIDENCIA}
                      guardar={(v) => cambiarEstadoIncidencia(i.id, v)}
                    />
                  ) : (
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${CLASES_ESTADO_INCIDENCIA[i.estado]}`}>
                      {ESTADOS_INCIDENCIA[i.estado]}
                    </span>
                  )}
                  {i.estado === "resuelta" && i.resuelta_en && (
                    <p className="mt-0.5 text-xs text-slate-400">{formatearFecha(i.resuelta_en)}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatearFecha(i.creado_en)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setSeleccionadaId(null)}
        onClick={(e) => { if (e.target === e.currentTarget) dialogRef.current?.close(); }}
        className="m-auto w-[min(100vw-2rem,46rem)] rounded-lg bg-transparent p-0 backdrop:bg-slate-900/40"
      >
        <div className="card relative p-5">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Cerrar"
            className="absolute right-3 top-3 rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {seleccionada && <DetalleIncidencia inc={seleccionada} equipo={equipo} esInnovacion={esInnovacion} />}
        </div>
      </dialog>
    </>
  );
}
