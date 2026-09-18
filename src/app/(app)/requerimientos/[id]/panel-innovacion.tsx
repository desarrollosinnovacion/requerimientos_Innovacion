"use client";

import { useActionState } from "react";
import { ESTADOS, PRIORIDADES, type Estado } from "@/lib/formulario";
import type { MiembroEquipo } from "@/lib/tipos";
import { actualizarGestion, type EstadoPanel } from "./actions";

type Props = {
  id: string;
  estado: Estado;
  prioridadFinal: string | null;
  fechaEstimada: string | null;
  notas: string | null;
  equipo: MiembroEquipo[];
  asignados: string[];
};

export function PanelInnovacion({ id, estado, prioridadFinal, fechaEstimada, notas, equipo, asignados }: Props) {
  const [res, accion, pendiente] = useActionState<EstadoPanel, FormData>(actualizarGestion, {});

  return (
    <form action={accion} className="card border-brand-200 p-5">
      <input type="hidden" name="id" value={id} />
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">Gestión · Innovación</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="estado" className="label">Estado del proyecto</label>
          <select id="estado" name="estado" defaultValue={estado} className="input mt-1">
            {(Object.keys(ESTADOS) as Estado[]).map((e) => (
              <option key={e} value={e}>{ESTADOS[e]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prioridad_final" className="label">Prioridad final</label>
          <select id="prioridad_final" name="prioridad_final" defaultValue={prioridadFinal ?? ""} className="input mt-1">
            <option value="">Sin definir</option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fecha_estimada_entrega" className="label">Fecha estimada de entrega</label>
          <input id="fecha_estimada_entrega" name="fecha_estimada_entrega" type="date" defaultValue={fechaEstimada ?? ""} className="input mt-1" />
        </div>
        <fieldset>
          <legend className="label">Equipo asignado</legend>
          {equipo.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">No hay miembros activos en el equipo de Innovación.</p>
          ) : (
            <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
              {equipo.map((m) => (
                <li key={m.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-slate-800 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      name="asignados"
                      value={m.id}
                      defaultChecked={asignados.includes(m.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {m.nombre}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        <div>
          <label htmlFor="notas_innovacion" className="label">Notas internas / respuesta</label>
          <textarea id="notas_innovacion" name="notas_innovacion" rows={4} defaultValue={notas ?? ""} className="input mt-1" />
        </div>
        {res.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{res.error}</p>}
        {res.ok && !pendiente && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Cambios guardados.</p>}
        <button type="submit" disabled={pendiente} className="btn-primary w-full">
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
