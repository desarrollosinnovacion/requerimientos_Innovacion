"use client";

import { useActionState, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { MESES, nombrePeriodo } from "@/lib/indicadores";
import { crearPeriodo, type EstadoFormPeriodo } from "./actions";

type Props = {
  /** Mes y año propuestos (el siguiente al último período). */
  anio: number;
  mes: number;
  /** Período más reciente, del que se copia la estructura. */
  copiarDe: { id: string; nombre: string } | null;
};

/** Botón "Nuevo período" con el formulario en ventana modal. */
export function ModalPeriodo({ anio: anioInicial, mes: mesInicial, copiarDe }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [res, accion, pendiente] = useActionState<EstadoFormPeriodo, FormData>(crearPeriodo, {});
  const [anio, setAnio] = useState(anioInicial);
  const [mes, setMes] = useState(mesInicial);
  const [nombre, setNombre] = useState("");

  const sugerido = nombrePeriodo(anio, mes);

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className="btn-primary">
        <Plus aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        Nuevo período
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => { if (e.target === e.currentTarget) dialogRef.current?.close(); }}
        className="m-auto w-[min(100vw-2rem,32rem)] rounded-lg bg-transparent p-0 backdrop:bg-slate-900/40"
      >
        <form action={accion} className="card relative space-y-4 p-5">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Cerrar"
            className="absolute right-3 top-3 rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div>
            <h2 className="text-base font-medium text-slate-900">Nuevo período</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Se crea una hoja nueva {copiarDe ? `con la misma estructura y metas de "${copiarDe.nombre}"` : "con la estructura base del Excel"}, sin valores.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mes" className="label">Mes de inicio</label>
              <select id="mes" name="mes" value={mes} onChange={(e) => setMes(Number(e.target.value))} className="input mt-1">
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="anio" className="label">Año</label>
              <input id="anio" name="anio" type="number" min={2020} max={2100} value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="input mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="nombre" className="label">Nombre <span className="font-normal text-slate-500">(opcional)</span></label>
              <input id="nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={sugerido} className="input mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="titulo" className="label">Título de la hoja</label>
              <input id="titulo" name="titulo" defaultValue="Reporte de Avance - Alineación Semanal de FDC" className="input mt-1" />
            </div>
          </div>
          {copiarDe && <input type="hidden" name="copiar_de" value={copiarDe.id} />}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {res.error && <p role="alert" className="mr-auto text-sm text-cobre-700">{res.error}</p>}
            <button type="button" onClick={() => dialogRef.current?.close()} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={pendiente} className="btn-primary">{pendiente ? "Creando…" : "Crear período"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
