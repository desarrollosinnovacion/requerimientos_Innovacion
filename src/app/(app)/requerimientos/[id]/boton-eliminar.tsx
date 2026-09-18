"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { eliminarRequerimiento } from "./actions";

/** Eliminación definitiva: primer clic muestra la confirmación, segundo clic borra. */
export function BotonEliminar({ id, folio }: { id: string; folio: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  function eliminar() {
    setError(null);
    iniciarTransicion(async () => {
      const res = await eliminarRequerimiento(id);
      // Con éxito la acción redirige a la lista; si devuelve algo, es un error.
      if (res?.error) {
        setError(res.error);
        setConfirmando(false);
      }
    });
  }

  if (!confirmando) {
    return (
      <div className="text-right">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="btn-secondary border-cobre-300 text-cobre-700 hover:bg-cobre-50"
        >
          <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          Eliminar requerimiento
        </button>
        {error && <p role="alert" className="mt-2 text-sm text-cobre-700">{error}</p>}
      </div>
    );
  }

  return (
    <div role="alertdialog" aria-labelledby="eliminar-titulo" className="rounded-lg border border-cobre-300 bg-cobre-50 p-4 text-sm shadow-sm">
      <p id="eliminar-titulo" className="font-medium text-slate-900">¿Eliminar {folio} de forma definitiva?</p>
      <p className="mt-1 text-slate-700">
        Se borrará el requerimiento con su equipo asignado y su historial. Esta acción no se puede deshacer.
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => setConfirmando(false)} disabled={pendiente} className="btn-secondary px-3 py-1.5">
          Cancelar
        </button>
        <button
          type="button"
          onClick={eliminar}
          disabled={pendiente}
          className="btn-primary bg-cobre-600 px-3 py-1.5 hover:bg-cobre-700 focus:ring-cobre-300"
        >
          <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          {pendiente ? "Eliminando…" : "Sí, eliminar"}
        </button>
      </div>
    </div>
  );
}
