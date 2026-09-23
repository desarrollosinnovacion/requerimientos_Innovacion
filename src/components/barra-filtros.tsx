"use client";

import Link from "next/link";
import { useRef } from "react";

export type CampoFiltro = {
  name: string;
  etiqueta: string;
  valor: string;
  opciones: { valor: string; etiqueta: string }[];
  /** Texto de la opción "todo" (valor vacío). */
  todos?: string;
};

type Props = {
  campos: CampoFiltro[];
  busqueda?: { valor: string; placeholder: string };
  /** Destino del enlace "Quitar filtros" (la ruta sin parámetros). */
  hrefLimpiar: string;
};

/**
 * Barra de filtros genérica: formulario GET para que la URL sea compartible.
 * Cada selector se aplica al cambiar; la búsqueda al presionar Enter o el botón.
 */
export function BarraFiltros({ campos, busqueda, hrefLimpiar }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const hayFiltro = campos.some((c) => c.valor !== "") || (busqueda?.valor ?? "") !== "";
  const enviar = () => formRef.current?.requestSubmit();

  return (
    <form ref={formRef} className="card flex flex-wrap items-end gap-3 p-4" method="get">
      {busqueda && (
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="label text-xs">Buscar</label>
          <input id="q" name="q" defaultValue={busqueda.valor} placeholder={busqueda.placeholder} className="input mt-1" />
        </div>
      )}
      {campos.map((c) => (
        <div key={c.name}>
          <label htmlFor={`filtro-${c.name}`} className="label text-xs">{c.etiqueta}</label>
          <select id={`filtro-${c.name}`} name={c.name} defaultValue={c.valor} onChange={enviar} className="input mt-1">
            <option value="">{c.todos ?? "Todos"}</option>
            {c.opciones.map((o) => (
              <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
            ))}
          </select>
        </div>
      ))}
      <button type="submit" className="btn-secondary">Filtrar</button>
      {hayFiltro && (
        <Link href={hrefLimpiar} className="btn-secondary px-3 py-1.5 text-xs">Quitar filtros</Link>
      )}
    </form>
  );
}
