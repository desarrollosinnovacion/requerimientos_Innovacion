"use client";

import { useState } from "react";

/** Muestra una contraseña temporal una sola vez, con botón para copiarla. */
export function PasswordGenerada({ correo, password }: { correo: string; password: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(password);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Si el portapapeles no está disponible, el usuario puede seleccionar el texto.
    }
  }

  return (
    <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p className="font-medium">Contraseña temporal para {correo}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="select-all rounded bg-white px-3 py-1.5 font-mono text-base tracking-wide text-slate-900 ring-1 ring-emerald-200">
          {password}
        </code>
        <button type="button" onClick={copiar} className="btn-secondary px-3 py-1.5">
          {copiado ? "Copiada ✓" : "Copiar"}
        </button>
      </div>
      <p className="mt-2 text-xs text-emerald-800">
        Se muestra una sola vez. Entrégala al usuario de forma segura; al entrar deberá definir su propia contraseña.
      </p>
    </div>
  );
}
