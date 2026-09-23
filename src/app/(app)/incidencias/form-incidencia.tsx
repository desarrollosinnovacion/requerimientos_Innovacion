"use client";

import { useActionState, useEffect, useRef } from "react";
import { PRIORIDADES } from "@/lib/formulario";
import type { MiembroEquipo } from "@/lib/tipos";
import { crearIncidencia, type EstadoFormIncidencia } from "./actions";

type Props = {
  empresas: { id: string; nombre: string }[];
  /** Miembros de Innovación; null cuando el usuario es solicitante (no elige responsable). */
  equipo: MiembroEquipo[] | null;
  nombreUsuario: string;
  /** Se llama con el folio nuevo cuando la incidencia quedó guardada. */
  alGuardar: (folio: string) => void;
  alCancelar: () => void;
};

/**
 * Formulario corto para registrar una incidencia (se muestra en una ventana modal).
 * Solo el título es obligatorio; al guardar avisa al contenedor con el folio.
 */
export function FormIncidencia({ empresas, equipo, nombreUsuario, alGuardar, alCancelar }: Props) {
  const [res, accion, pendiente] = useActionState<EstadoFormIncidencia, FormData>(crearIncidencia, {});
  const ref = useRef<HTMLFormElement>(null);
  const errores = res.errores ?? {};

  useEffect(() => {
    if (res.ok && res.folio) alGuardar(res.folio);
    // Solo reacciona al resultado de la acción; `alGuardar` es estable en la práctica.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res]);

  return (
    <form ref={ref} action={accion} className="space-y-4">
      <div>
        <h2 className="text-base font-medium text-slate-900">Registrar incidencia</h2>
        <p className="mt-0.5 text-sm text-slate-600">Para tickets pequeños: ajustes, errores puntuales o consultas rápidas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="titulo" className="label">Título</label>
          <input
            id="titulo"
            name="titulo"
            required
            maxLength={200}
            autoFocus
            placeholder="Ej. No carga el reporte de ventas en Power BI"
            aria-invalid={errores.titulo ? true : undefined}
            className="input mt-1"
          />
          {errores.titulo && <p role="alert" className="mt-1 text-xs text-cobre-700">{errores.titulo}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="descripcion" className="label">Descripción <span className="font-normal text-slate-500">(opcional)</span></label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            placeholder="Qué pasa, desde cuándo, a quién afecta, cómo reproducirlo."
            className="input mt-1"
          />
        </div>

        <div>
          <label htmlFor="empresa_id" className="label">Unidad de negocio</label>
          <select id="empresa_id" name="empresa_id" defaultValue="" className="input mt-1">
            <option value="">Sin especificar</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
          {errores.empresa_id && <p role="alert" className="mt-1 text-xs text-cobre-700">{errores.empresa_id}</p>}
        </div>

        <div>
          <label htmlFor="reportado_por" className="label">Quién la reporta</label>
          <input id="reportado_por" name="reportado_por" defaultValue={nombreUsuario} maxLength={120} className="input mt-1" />
        </div>

        <div>
          <label htmlFor="prioridad" className="label">Prioridad</label>
          <select id="prioridad" name="prioridad" defaultValue="" className="input mt-1">
            <option value="">Sin definir</option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errores.prioridad && <p role="alert" className="mt-1 text-xs text-cobre-700">{errores.prioridad}</p>}
        </div>

        {equipo && (
          <div>
            <label htmlFor="asignado_id" className="label">Responsable</label>
            <select id="asignado_id" name="asignado_id" defaultValue="" className="input mt-1">
              <option value="">Sin asignar</option>
              {equipo.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
            {errores.asignado_id && <p role="alert" className="mt-1 text-xs text-cobre-700">{errores.asignado_id}</p>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {res.error && !res.ok && <p role="alert" className="mr-auto text-sm text-cobre-700">{res.error}</p>}
        <button type="button" onClick={alCancelar} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={pendiente} className="btn-primary">
          {pendiente ? "Registrando…" : "Registrar incidencia"}
        </button>
      </div>
    </form>
  );
}
