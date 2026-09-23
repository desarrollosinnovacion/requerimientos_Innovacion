"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { MiembroEquipo } from "@/lib/tipos";
import { FormIncidencia } from "./form-incidencia";

type Props = {
  empresas: { id: string; nombre: string }[];
  equipo: MiembroEquipo[] | null;
  nombreUsuario: string;
};

/**
 * Botón "Registrar incidencia" que abre el formulario en una ventana modal
 * (<dialog> nativo). Al guardar, la ventana se cierra y el folio nuevo queda
 * indicado junto al botón unos segundos; la lista se refresca sola.
 */
export function ModalIncidencia({ empresas, equipo, nombreUsuario }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [ultimoFolio, setUltimoFolio] = useState<string | null>(null);

  useEffect(() => {
    if (!ultimoFolio) return;
    const t = setTimeout(() => setUltimoFolio(null), 6000);
    return () => clearTimeout(t);
  }, [ultimoFolio]);

  function abrir() {
    setAbierto(true);
    dialogRef.current?.showModal();
  }

  function cerrar() {
    dialogRef.current?.close();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {ultimoFolio && (
        <p role="status" className="text-sm text-brand-800">
          Incidencia <strong>{ultimoFolio}</strong> registrada.
        </p>
      )}
      <button type="button" onClick={abrir} className="btn-primary">
        <Plus aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        Registrar incidencia
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setAbierto(false)}
        // Clic en el fondo (fuera del cuadro) cierra la ventana.
        onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}
        className="m-auto w-[min(100vw-2rem,40rem)] rounded-lg bg-transparent p-0 backdrop:bg-slate-900/40"
      >
        <div className="card relative p-5">
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="absolute right-3 top-3 rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {/* Se monta solo mientras está abierto para que cada apertura arranque limpia. */}
          {abierto && (
            <FormIncidencia
              empresas={empresas}
              equipo={equipo}
              nombreUsuario={nombreUsuario}
              alGuardar={(folio) => { setUltimoFolio(folio); cerrar(); }}
              alCancelar={cerrar}
            />
          )}
        </div>
      </dialog>
    </div>
  );
}
