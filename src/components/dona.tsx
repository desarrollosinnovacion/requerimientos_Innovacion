"use client";

import { useId, useState } from "react";

export type SegmentoDona = { etiqueta: string; valor: number; color: string };

type Props = {
  segmentos: SegmentoDona[];
  /** Número grande del centro y su rótulo. */
  centro: { valor: number | string; etiqueta: string };
  /** Texto accesible que resume la gráfica. */
  descripcion: string;
  tamano?: number;
  /** Anillo más delgado y textos más pequeños, para paneles con poco espacio. */
  compacto?: boolean;
};

const GROSOR = 22;
const GROSOR_COMPACTO = 14;
const SEPARADOR = 2; // px de superficie entre segmentos

/**
 * Gráfica de dona en SVG puro: segmentos con separador de 2 px, número central,
 * leyenda con valores (la identidad nunca depende solo del color) y tooltip al pasar.
 */
export function Dona({ segmentos, centro, descripcion, tamano = 168, compacto = false }: Props) {
  const [activo, setActivo] = useState<number | null>(null);
  const idDesc = useId();

  const grosor = compacto ? GROSOR_COMPACTO : GROSOR;
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  const visibles = segmentos.filter((s) => s.valor > 0);
  const r = (tamano - grosor) / 2;
  const circ = 2 * Math.PI * r;
  const gap = visibles.length > 1 ? SEPARADOR : 0;

  const arcos = visibles.reduce<{ acumulado: number; lista: (SegmentoDona & { largo: number; offset: number })[] }>(
    (acc, s) => {
      const largo = (s.valor / total) * circ;
      acc.lista.push({ ...s, largo: Math.max(0, largo - gap), offset: -acc.acumulado - gap / 2 });
      return { acumulado: acc.acumulado + largo, lista: acc.lista };
    },
    { acumulado: 0, lista: [] },
  ).lista;

  const seleccionado = activo === null ? null : segmentos[activo];

  return (
    // Compacta: dona centrada arriba y leyenda debajo a todo lo ancho. Normal: dona a la izquierda y leyenda al lado.
    <div className={compacto ? "flex flex-col items-center gap-3" : "flex flex-wrap items-center gap-x-6 gap-y-4"}>
      <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
        <svg
          width={tamano}
          height={tamano}
          viewBox={`0 0 ${tamano} ${tamano}`}
          role="img"
          aria-describedby={idDesc}
          className="-rotate-90"
        >
          <desc id={idDesc}>{descripcion}</desc>
          {/* Pista neutra: visible cuando no hay datos. */}
          <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke="#F4F1EA" strokeWidth={grosor} />
          {arcos.map((a) => {
            const i = segmentos.indexOf(a);
            const atenuado = activo !== null && activo !== i;
            return (
              <circle
                key={a.etiqueta}
                cx={tamano / 2}
                cy={tamano / 2}
                r={r}
                fill="none"
                stroke={a.color}
                strokeWidth={grosor}
                strokeDasharray={`${a.largo} ${circ - a.largo}`}
                strokeDashoffset={a.offset}
                opacity={atenuado ? 0.3 : 1}
                onMouseEnter={() => setActivo(i)}
                onMouseLeave={() => setActivo(null)}
                className="transition-opacity"
              />
            );
          })}
        </svg>
        {/* Centro: número grande o el segmento sobre el que está el cursor. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {seleccionado ? (
            <>
              <span className={`${compacto ? "text-lg" : "text-2xl"} font-medium tabular-nums text-slate-900`}>{seleccionado.valor}</span>
              <span className={`max-w-[7em] leading-tight text-slate-500 ${compacto ? "text-[10px]" : "text-[11px]"}`}>{seleccionado.etiqueta}</span>
            </>
          ) : (
            <>
              <span className={`${compacto ? "text-xl" : "text-3xl"} font-medium tabular-nums text-slate-900`}>{centro.valor}</span>
              <span className={`uppercase tracking-[0.14em] text-slate-500 ${compacto ? "text-[10px]" : "text-[11px]"}`}>{centro.etiqueta}</span>
            </>
          )}
        </div>
      </div>

      {/* Leyenda con valores: hace de tabla de datos y da identidad sin depender del color. */}
      {/* Ancho mínimo de 11 rem: si no cabe junto a la dona, baja debajo en vez de recortar nombres. */}
      <ul className={`min-w-0 divide-y divide-slate-100 ${compacto ? "w-full text-xs" : "flex-1 basis-44 text-sm"}`}>
        {segmentos.map((s, i) => (
          <li
            key={s.etiqueta}
            onMouseEnter={() => setActivo(i)}
            onMouseLeave={() => setActivo(null)}
            className={`flex items-center justify-between gap-3 ${compacto ? "py-1" : "py-1.5"} ${activo !== null && activo !== i ? "opacity-50" : ""}`}
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-700">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0" style={{ background: s.color }} />
              <span className="truncate" title={s.etiqueta}>{s.etiqueta}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              <span className="font-medium text-slate-900">{s.valor}</span>
              <span className="ml-2 text-xs text-slate-500">{total === 0 ? "0" : Math.round((s.valor / total) * 100)} %</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
