"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { revelarSecreto } from "../actions";

/** Segundos que el secreto permanece visible antes de ocultarse solo. */
const SEGUNDOS_VISIBLE = 30;

/**
 * Secreto de una credencial: oculto hasta que se pide al servidor (cada petición
 * queda en la bitácora). Se oculta solo a los 30 s y al salir de la página.
 * "Copiar" también pasa por el servidor: tener el secreto es tener el secreto.
 */
export function SecretoCredencial({ id, deshabilitado }: { id: string; deshabilitado: boolean }) {
  const [secreto, setSecreto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pendiente, startTransition] = useTransition();

  useEffect(() => {
    if (!secreto) return;
    const t = setTimeout(() => setSecreto(null), SEGUNDOS_VISIBLE * 1000);
    return () => clearTimeout(t);
  }, [secreto]);

  async function copiar(s: string) {
    try {
      await navigator.clipboard.writeText(s);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin portapapeles, el texto revelado se puede seleccionar a mano.
    }
  }

  /** Pide el secreto al servidor y, si llega, ejecuta `despues` con él. */
  function pedir(despues?: (s: string) => void) {
    setError(null);
    startTransition(async () => {
      const r = await revelarSecreto(id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSecreto(r.secreto);
      despues?.(r.secreto);
    });
  }

  const btn = "btn-secondary px-2 py-1 text-xs";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code
        className={`select-all rounded px-2 py-1 font-mono text-sm ring-1 ${
          secreto ? "bg-brand-50 text-slate-900 ring-brand-200" : "bg-slate-50 tracking-widest text-slate-400 ring-slate-200"
        }`}
        aria-label={secreto ? "Secreto" : "Secreto oculto"}
      >
        {secreto ?? "••••••••••"}
      </code>
      <button
        type="button"
        disabled={deshabilitado || pendiente}
        onClick={() => (secreto ? setSecreto(null) : pedir())}
        className={btn}
      >
        {secreto ? <EyeOff aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Eye aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />}
        {pendiente ? "…" : secreto ? "Ocultar" : "Revelar"}
      </button>
      <button
        type="button"
        disabled={deshabilitado || pendiente}
        onClick={() => (secreto ? copiar(secreto) : pedir(copiar))}
        className={btn}
      >
        <Copy aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
        {copiado ? "Copiada" : "Copiar"}
      </button>
      {error && <p role="alert" className="w-full text-xs text-cobre-700">{error}</p>}
    </div>
  );
}
