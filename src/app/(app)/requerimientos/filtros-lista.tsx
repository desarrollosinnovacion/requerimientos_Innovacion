"use client";

import Link from "next/link";
import { useRef } from "react";
import { SIN_ASIGNAR, SIN_PRIORIDAD } from "@/lib/filtros";
import { ESTADOS, PRIORIDADES, type Estado } from "@/lib/formulario";
import type { MiembroEquipo } from "@/lib/tipos";

export type ValoresFiltro = {
  q: string;
  unidad: string;
  asignado: string;
  prioridad: string;
  estado: string;
};

type Props = {
  valores: ValoresFiltro;
  unidades: string[];
  /** Miembros de Innovación; null cuando el usuario es solicitante (no ve el filtro). */
  equipo: MiembroEquipo[] | null;
};

/**
 * Filtros de la lista de requerimientos. Es un formulario GET para que la URL
 * sea compartible; cada selector se aplica al cambiar y el cuadro de búsqueda
 * al presionar Enter o el botón.
 */
export function FiltrosLista({ valores, unidades, equipo }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const hayFiltro = Object.values(valores).some((v) => v !== "");
  const enviar = () => formRef.current?.requestSubmit();

  return (
    <form ref={formRef} className="card flex flex-wrap items-end gap-3 p-4" method="get">
      <div className="min-w-48 flex-1">
        <label htmlFor="q" className="label text-xs">Buscar</label>
        <input
          id="q"
          name="q"
          defaultValue={valores.q}
          placeholder="Folio, proyecto, solicitante, área o tipo"
          className="input mt-1"
        />
      </div>

      <div>
        <label htmlFor="unidad" className="label text-xs">Unidad de negocio</label>
        <select id="unidad" name="unidad" defaultValue={valores.unidad} onChange={enviar} className="input mt-1">
          <option value="">Todas</option>
          {unidades.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {equipo && (
        <div>
          <label htmlFor="asignado" className="label text-xs">Asignado a</label>
          <select id="asignado" name="asignado" defaultValue={valores.asignado} onChange={enviar} className="input mt-1">
            <option value="">Todos</option>
            <option value={SIN_ASIGNAR}>Sin asignar</option>
            {equipo.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="prioridad" className="label text-xs">Prioridad</label>
        <select id="prioridad" name="prioridad" defaultValue={valores.prioridad} onChange={enviar} className="input mt-1">
          <option value="">Todas</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
          <option value={SIN_PRIORIDAD}>Sin definir</option>
        </select>
      </div>

      <div>
        <label htmlFor="estado" className="label text-xs">Estado</label>
        <select id="estado" name="estado" defaultValue={valores.estado} onChange={enviar} className="input mt-1">
          <option value="">Todos</option>
          {(Object.keys(ESTADOS) as Estado[]).map((e) => (
            <option key={e} value={e}>{ESTADOS[e]}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-secondary">Filtrar</button>
      {hayFiltro && (
        <Link href="/requerimientos" className="btn-secondary px-3 py-1.5 text-xs">
          Quitar filtros
        </Link>
      )}
    </form>
  );
}
