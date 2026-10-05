"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import type { AplicacionFila, RequerimientoOpcion } from "@/lib/credenciales";
import { FormAplicacion } from "./form-aplicacion";

type Props = {
  empresas: { id: string; nombre: string }[];
  requerimientos: RequerimientoOpcion[];
  /** Con valor, el botón dice "Editar" y el formulario edita esa aplicación. */
  inicial?: AplicacionFila;
};

/**
 * Botón que abre el formulario de aplicación en una ventana modal (<dialog> nativo).
 * Al crear, navega a la ficha nueva; al editar, cierra y la página se refresca sola.
 */
export function ModalAplicacion({ empresas, requerimientos, inicial }: Props) {
  const router = useRouter();
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
        <button type="button" onClick={abrir} className="btn-secondary px-3 py-1.5 text-xs">
          <Pencil aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
          Editar
        </button>
      ) : (
        <button type="button" onClick={abrir} className="btn-primary">
          <Plus aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          Nueva aplicación
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
          {abierto && (
            <FormAplicacion
              empresas={empresas}
              requerimientos={requerimientos}
              inicial={inicial}
              alGuardar={(id) => {
                cerrar();
                if (!inicial) router.push(`/credenciales/${id}`);
              }}
              alCancelar={cerrar}
            />
          )}
        </div>
      </dialog>
    </>
  );
}
