"use client";

import Link from "next/link";
import { useId, useMemo, useState, useTransition, type DragEvent } from "react";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { ESTADOS, type Estado } from "@/lib/formulario";
import { COLOR_ESTADO, ORDEN_ESTADOS } from "@/lib/colores-estado";
import { formatearFecha, tituloProyecto } from "@/lib/formato";
import type { MiembroEquipo } from "@/lib/tipos";
import { BadgePrioridad } from "@/components/badges";
import { cambiarEstado } from "./actions";

export type TarjetaProyecto = {
  id: string;
  folio: string;
  estado: Estado;
  nombre_proyecto: string | null;
  tipo_requerimiento: string | null;
  prioridad_sugerida: string | null;
  prioridad_final: string | null;
  nombre_solicitante: string | null;
  empresa_area: string | null;
  /** Unidad de negocio (empresa del catálogo). */
  unidad: string;
  fecha_limite: string | null;
  fecha_estimada_entrega: string | null;
  actualizado_en: string;
  asignados: MiembroEquipo[];
};

type Props = { tarjetas: TarjetaProyecto[]; puedeMover: boolean };

/**
 * Tablero tipo planner: una columna por fase del proyecto. Las tarjetas se arrastran
 * entre columnas (o se mueven con las flechas, para teclado) y el cambio se guarda
 * de forma optimista; si el servidor lo rechaza, la tarjeta vuelve a su fase.
 */
export function TableroProyectos({ tarjetas: iniciales, puedeMover }: Props) {
  const [tarjetas, setTarjetas] = useState(iniciales);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [columnaDestino, setColumnaDestino] = useState<Estado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, iniciarTransicion] = useTransition();
  // Filtros: "" = todos. Persona = miembro asignado o "sin_asignar".
  const [filtroPersona, setFiltroPersona] = useState("");
  const [filtroUnidad, setFiltroUnidad] = useState("");
  const idPersona = useId();
  const idUnidad = useId();

  const personas = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const t of tarjetas) for (const a of t.asignados) mapa.set(a.id, a.nombre);
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [tarjetas]);
  const unidades = useMemo(() => [...new Set(tarjetas.map((t) => t.unidad))].sort((a, b) => a.localeCompare(b, "es")), [tarjetas]);

  const visibles = tarjetas.filter((t) => {
    const porPersona =
      filtroPersona === "" ||
      (filtroPersona === "sin_asignar" ? t.asignados.length === 0 : t.asignados.some((a) => a.id === filtroPersona));
    const porUnidad = filtroUnidad === "" || t.unidad === filtroUnidad;
    return porPersona && porUnidad;
  });
  const hayFiltro = filtroPersona !== "" || filtroUnidad !== "";

  function mover(id: string, destino: Estado) {
    const actual = tarjetas.find((t) => t.id === id);
    if (!actual || actual.estado === destino || !puedeMover) return;
    const origen = actual.estado;
    setError(null);
    setTarjetas((prev) => prev.map((t) => (t.id === id ? { ...t, estado: destino } : t)));
    iniciarTransicion(async () => {
      const res = await cambiarEstado(id, destino);
      if (!res.ok) {
        setTarjetas((prev) => prev.map((t) => (t.id === id ? { ...t, estado: origen } : t)));
        setError(res.error);
      }
    });
  }

  function alSoltar(e: DragEvent, destino: Estado) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || arrastrando;
    setArrastrando(null);
    setColumnaDestino(null);
    if (id) mover(id, destino);
  }

  return (
    <div className="space-y-4">
      {/* Filtros en una sola fila sobre el tablero; por defecto se muestra todo. */}
      <div className="card flex flex-wrap items-end gap-3 p-3">
        <div className="min-w-48">
          <label htmlFor={idPersona} className="label text-xs text-slate-600">Persona</label>
          <select id={idPersona} value={filtroPersona} onChange={(e) => setFiltroPersona(e.target.value)} className="input mt-1">
            <option value="">Todas</option>
            <option value="sin_asignar">Sin asignar</option>
            {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="min-w-48">
          <label htmlFor={idUnidad} className="label text-xs text-slate-600">Unidad de negocio</label>
          <select id={idUnidad} value={filtroUnidad} onChange={(e) => setFiltroUnidad(e.target.value)} className="input mt-1">
            <option value="">Todas</option>
            {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <p className="ml-auto text-sm text-slate-500" aria-live="polite">
          {hayFiltro ? `${visibles.length} de ${tarjetas.length} proyectos` : `${tarjetas.length} proyectos`}
        </p>
        {hayFiltro && (
          <button type="button" onClick={() => { setFiltroPersona(""); setFiltroUnidad(""); }} className="btn-secondary px-3 py-1.5 text-xs">
            Quitar filtros
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="bg-cobre-50 px-3 py-2 text-sm text-cobre-700">{error}</p>
      )}

      {/* Siete fases: columnas de ancho fijo con desplazamiento horizontal, como un planner. */}
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
        {ORDEN_ESTADOS.map((estado, indice) => {
          const enColumna = visibles.filter((t) => t.estado === estado);
          const resaltada = columnaDestino === estado && arrastrando !== null;
          return (
            <section
              key={estado}
              aria-labelledby={`col-${estado}`}
              onDragOver={(e) => {
                if (!puedeMover) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (columnaDestino !== estado) setColumnaDestino(estado);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setColumnaDestino(null);
              }}
              onDrop={(e) => alSoltar(e, estado)}
              className={`flex min-h-[60vh] w-72 shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-slate-200 border-t-2 bg-white shadow-sm transition ${
                resaltada ? "ring-2 ring-brand-300 ring-inset" : ""
              }`}
              style={{ borderTopColor: COLOR_ESTADO[estado] }}
            >
              <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                <h2 id={`col-${estado}`} className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <span aria-hidden className="h-2.5 w-2.5" style={{ background: COLOR_ESTADO[estado] }} />
                  {ESTADOS[estado]}
                </h2>
                <span className="etiqueta text-slate-500">{enColumna.length}</span>
              </header>

              <ul className="flex flex-1 flex-col gap-2 bg-slate-50 p-2">
                {enColumna.length === 0 && (
                  <li className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-sm text-slate-500">
                    {hayFiltro ? "Nada con estos filtros." : puedeMover ? "Suelta aquí un proyecto." : "Sin proyectos en esta fase."}
                  </li>
                )}
                {enColumna.map((t) => (
                  <Tarjeta
                    key={t.id}
                    tarjeta={t}
                    puedeMover={puedeMover}
                    arrastrando={arrastrando === t.id}
                    anterior={indice > 0 ? ORDEN_ESTADOS[indice - 1] : null}
                    siguiente={indice < ORDEN_ESTADOS.length - 1 ? ORDEN_ESTADOS[indice + 1] : null}
                    alIniciar={(e) => {
                      e.dataTransfer.setData("text/plain", t.id);
                      e.dataTransfer.effectAllowed = "move";
                      setArrastrando(t.id);
                    }}
                    alTerminar={() => {
                      setArrastrando(null);
                      setColumnaDestino(null);
                    }}
                    mover={(destino) => mover(t.id, destino)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Tarjeta({
  tarjeta: t,
  puedeMover,
  arrastrando,
  anterior,
  siguiente,
  alIniciar,
  alTerminar,
  mover,
}: {
  tarjeta: TarjetaProyecto;
  puedeMover: boolean;
  arrastrando: boolean;
  anterior: Estado | null;
  siguiente: Estado | null;
  alIniciar: (e: DragEvent) => void;
  alTerminar: () => void;
  mover: (destino: Estado) => void;
}) {
  const compromiso = [t.fecha_estimada_entrega, t.fecha_limite].filter((f): f is string => !!f).sort()[0] ?? null;
  const atrasado = compromiso !== null && t.estado !== "entregado" && compromiso < new Date().toISOString().slice(0, 10);

  return (
    <li
      draggable={puedeMover}
      onDragStart={alIniciar}
      onDragEnd={alTerminar}
      className={`card group p-3 text-sm transition ${puedeMover ? "cursor-grab active:cursor-grabbing" : ""} ${
        arrastrando ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/requerimientos/${t.id}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">
          {t.folio}
        </Link>
        <div className="flex items-center gap-1">
          <BadgePrioridad prioridad={t.prioridad_final ?? t.prioridad_sugerida} />
          {puedeMover && <GripVertical aria-hidden className="h-4 w-4 text-slate-400" strokeWidth={1.5} />}
        </div>
      </div>
      <p className="mt-1.5 font-medium text-slate-900">{tituloProyecto(t)}</p>
      {t.nombre_proyecto && t.tipo_requerimiento && <p className="text-xs text-slate-600">{t.tipo_requerimiento}</p>}
      <p className="mt-0.5 truncate text-xs text-slate-500" title={`${t.nombre_solicitante ?? "Sin nombre"} · ${t.empresa_area ?? "Sin unidad"}`}>
        {t.nombre_solicitante ?? "Sin nombre"} · {t.empresa_area ?? "Sin unidad"}
      </p>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0 text-xs text-slate-600">
          {t.asignados.length > 0 ? (
            <p className="truncate">{t.asignados.map((a) => a.nombre.split(" ")[0]).join(", ")}</p>
          ) : (
            <p className="text-cobre-700">Sin asignar</p>
          )}
          {compromiso && (
            <p className={atrasado ? "font-medium text-cobre-700" : "text-slate-500"}>
              {atrasado ? "Atrasado · " : ""}{formatearFecha(compromiso)}
            </p>
          )}
        </div>

        {puedeMover && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              disabled={!anterior}
              onClick={() => anterior && mover(anterior)}
              title={anterior ? `Regresar a ${ESTADOS[anterior]}` : undefined}
              aria-label={anterior ? `Regresar a ${ESTADOS[anterior]}` : "Primera fase"}
              className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              disabled={!siguiente}
              onClick={() => siguiente && mover(siguiente)}
              title={siguiente ? `Avanzar a ${ESTADOS[siguiente]}` : undefined}
              aria-label={siguiente ? `Avanzar a ${ESTADOS[siguiente]}` : "Última fase"}
              className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
