"use client";

import { useId, useRef, useState, useTransition, type ToggleEvent } from "react";
import { ChevronDown } from "lucide-react";
import type { MiembroEquipo } from "@/lib/tipos";
import { asignarEquipo } from "./actions";

type Props = { id: string; equipo: MiembroEquipo[]; asignados: string[] };

const ANCHO_PANEL = 240;

/**
 * Asignación rápida desde la lista como lista desplegable: el botón resume quién
 * está asignado y el panel muestra una casilla por miembro. Cada cambio se guarda
 * de inmediato de forma optimista; si el servidor lo rechaza, vuelve atrás.
 *
 * El panel usa la Popover API (capa superior del navegador) para que no lo recorte
 * el contenedor de la tabla, que tiene desplazamiento horizontal.
 */
export function AsignarEquipo({ id, equipo, asignados: iniciales }: Props) {
  const [asignados, setAsignados] = useState(iniciales);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciarTransicion] = useTransition();
  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const idPanel = useId();

  function alternar(perfilId: string) {
    const previos = asignados;
    const nuevos = previos.includes(perfilId) ? previos.filter((p) => p !== perfilId) : [...previos, perfilId];
    setAsignados(nuevos);
    setError(null);
    iniciarTransicion(async () => {
      const res = await asignarEquipo(id, nuevos);
      if (!res.ok) {
        setAsignados(previos);
        setError(res.error);
      }
    });
  }

  /** Coloca el panel bajo el botón (o encima si no cabe) cada vez que se abre. */
  function alCambiarApertura(e: ToggleEvent<HTMLDivElement>) {
    const abre = e.newState === "open";
    setAbierto(abre);
    const boton = botonRef.current;
    const panel = panelRef.current;
    if (!abre || !boton || !panel) return;
    const r = boton.getBoundingClientRect();
    const alto = panel.offsetHeight;
    const cabeAbajo = r.bottom + 4 + alto <= window.innerHeight;
    panel.style.top = `${cabeAbajo ? r.bottom + 4 : Math.max(8, r.top - 4 - alto)}px`;
    panel.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - ANCHO_PANEL - 8))}px`;
  }

  const nombres = equipo.filter((m) => asignados.includes(m.id)).map((m) => m.nombre.split(" ")[0]);
  const resumen = nombres.length === 0 ? "Sin asignar" : nombres.join(", ");

  if (equipo.length === 0) return <span className="text-xs text-slate-400">Sin equipo activo</span>;

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        popoverTarget={idPanel}
        aria-expanded={abierto}
        aria-label={`Equipo asignado: ${resumen}. Cambiar`}
        className={`inline-flex max-w-52 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-300 ${
          pendiente ? "opacity-60" : ""
        } ${nombres.length === 0 ? "text-cobre-700" : "text-slate-800"}`}
      >
        <span className="truncate">{resumen}</span>
        <ChevronDown aria-hidden className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={1.5} />
      </button>

      <div
        ref={panelRef}
        id={idPanel}
        popover="auto"
        onToggle={alCambiarApertura}
        style={{ position: "fixed", inset: "unset", width: ANCHO_PANEL }}
        className="m-0 rounded-md border border-slate-200 bg-white p-1 text-sm shadow-md"
      >
        <p className="px-2 pb-1 pt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Equipo asignado</p>
        <ul>
          {equipo.map((m) => (
            <li key={m.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-slate-800 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={asignados.includes(m.id)}
                  onChange={() => alternar(m.id)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {m.nombre}
              </label>
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="px-2 py-1.5 text-xs text-cobre-700">{error}</p>}
      </div>
    </>
  );
}
