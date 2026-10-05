"use client";

import { useRef, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import type { CredencialFila } from "@/lib/credenciales";
import type { MiembroEquipo } from "@/lib/tipos";
import { FormCredencial } from "./form-credencial";

type Props = {
  aplicacionId: string;
  equipo: MiembroEquipo[];
  /** Con valor, el botón dice "Editar" y el formulario edita esa credencial. */
  inicial?: CredencialFila;
  deshabilitado?: boolean;
};

/** Botón que abre el formulario de credencial en una ventana modal. Al guardar cierra; la ficha se refresca sola. */
export function ModalCredencial({ aplicacionId, equipo, inicial, deshabilitado = false }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);

  function abrir() {
    setAbierto(true);
    dialogRef.current?.showModal();
  }
  const cerrar = () => dialogRef.current?.close();

  return (
    <>
      {inicial ? (
        <button type="button" onClick={abrir} className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-200">
          <Pencil aria-hidden className="mr-1 inline h-3.5 w-3.5" strokeWidth={1.5} />
          Editar
        </button>
      ) : (
        <button type="button" onClick={abrir} disabled={deshabilitado} className="btn-primary">
          <Plus aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          Nueva credencial
        </button>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setAbierto(false)}
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
          {/* Se monta solo mientras está abierto: cada apertura arranca limpia y el secreto escrito no se queda en memoria. */}
          {abierto && <FormCredencial aplicacionId={aplicacionId} equipo={equipo} inicial={inicial} alGuardar={cerrar} alCancelar={cerrar} />}
        </div>
      </dialog>
    </>
  );
}
