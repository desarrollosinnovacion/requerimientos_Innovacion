"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";

type Opcion = { valor: string; etiqueta: string };
type Resultado = { ok: true } | { ok: false; error: string };

type Props = {
  etiqueta: string;
  valor: string;
  opciones: Opcion[];
  /** Clases de color por valor (las mismas que usan las etiquetas). */
  clases: Record<string, string>;
  guardar: (valor: string) => Promise<Resultado>;
};

const NEUTRO = "bg-slate-100 text-slate-700";

/**
 * Desplegable de una sola opción con aspecto de etiqueta, para cambiar estado o
 * prioridad desde la lista. Guarda al elegir, de forma optimista; si el servidor
 * lo rechaza, vuelve al valor anterior y muestra el error debajo.
 */
export function SelectorRapido({ etiqueta, valor: inicial, opciones, clases, guardar }: Props) {
  const [valor, setValor] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  function alCambiar(nuevo: string) {
    const previo = valor;
    setValor(nuevo);
    setError(null);
    iniciarTransicion(async () => {
      const res = await guardar(nuevo);
      if (!res.ok) {
        setValor(previo);
        setError(res.error);
      }
    });
  }

  return (
    <div className="inline-block">
      <span className={`relative inline-flex items-center rounded text-xs font-medium ${clases[valor] ?? NEUTRO} ${pendiente ? "opacity-60" : ""}`}>
        <select
          aria-label={etiqueta}
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          className="cursor-pointer appearance-none bg-transparent py-0.5 pl-2 pr-6 text-inherit focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor} className="bg-white text-slate-900">{o.etiqueta}</option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 opacity-70" strokeWidth={1.5} />
      </span>
      {error && <p role="alert" className="mt-1 text-xs text-cobre-700">{error}</p>}
    </div>
  );
}
