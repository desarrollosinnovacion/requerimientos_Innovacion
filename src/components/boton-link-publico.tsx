"use client";

import { useId, useState } from "react";

/**
 * Botón del inicio para el equipo de Innovación: copia el enlace público del
 * formulario (/solicitud) y lo muestra para compartirlo con cualquier persona.
 */
export function BotonLinkPublico() {
  const [url, setUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const panelId = useId();

  async function copiar(enlace: string) {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin portapapeles (p. ej. HTTP sin TLS): el enlace queda visible para seleccionarlo.
    }
  }

  async function alClic() {
    const enlace = `${window.location.origin}/solicitud`;
    setUrl(enlace);
    await copiar(enlace);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={alClic}
        aria-expanded={url !== null}
        aria-controls={panelId}
        className="btn-secondary"
      >
        <IconoEnlace />
        {copiado ? "Enlace copiado" : "Link nuevo requerimiento"}
      </button>

      {url && (
        <div
          id={panelId}
          role="status"
          className="card absolute right-0 z-10 mt-2 w-[min(28rem,calc(100vw-2rem))] p-4 text-sm shadow-md"
        >
          <p className="font-medium text-slate-900">Enlace público del formulario</p>
          <p className="mt-1 text-xs text-slate-500">
            Cualquier persona puede llenarlo sin cuenta. Compártelo por correo o chat.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              aria-label="Enlace público"
              onFocus={(e) => e.currentTarget.select()}
              className="input min-w-0 flex-1 font-mono text-xs"
            />
            <button type="button" onClick={() => copiar(url)} className="btn-secondary px-3 py-1.5">
              {copiado ? "Copiado" : "Copiar"}
            </button>
            <a href={url} target="_blank" rel="noopener" className="btn-secondary px-3 py-1.5">
              Abrir
            </a>
          </div>
          <button
            type="button"
            onClick={() => setUrl(null)}
            className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

function IconoEnlace() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
