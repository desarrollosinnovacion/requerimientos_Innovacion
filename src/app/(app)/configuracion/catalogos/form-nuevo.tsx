"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearElemento, type EstadoCatalogo, type Nivel } from "./actions";

export function FormNuevo({ nivel, padreId, placeholder }: { nivel: Nivel; padreId?: string; placeholder: string }) {
  const [res, accion, pendiente] = useActionState<EstadoCatalogo, FormData>(crearElemento, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (res.ok) ref.current?.reset();
  }, [res]);

  return (
    <form ref={ref} action={accion} className="space-y-1">
      <input type="hidden" name="nivel" value={nivel} />
      {padreId && <input type="hidden" name="padre_id" value={padreId} />}
      <div className="flex gap-2">
        <input name="nombre" required placeholder={placeholder} aria-label={placeholder} className="input py-1.5" />
        <button type="submit" disabled={pendiente} className="btn-primary shrink-0 px-3 py-1.5">
          Agregar
        </button>
      </div>
      {res.error && <p role="alert" className="text-xs text-cobre-600">{res.error}</p>}
    </form>
  );
}
