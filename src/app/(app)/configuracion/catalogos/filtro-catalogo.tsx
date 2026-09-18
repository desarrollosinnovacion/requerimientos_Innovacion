"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Opcion = { id: string; nombre: string; activo: boolean };

/** Selector que actualiza un parámetro de la URL al cambiar (para filtrar por padre). */
export function FiltroCatalogo({
  nombre,
  etiqueta,
  opciones,
  valor,
  limpiar = [],
}: {
  nombre: string;
  etiqueta: string;
  opciones: Opcion[];
  valor: string;
  /** Otros parámetros que se borran al cambiar este (p. ej. departamento al cambiar empresa). */
  limpiar?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const id = `filtro-${nombre}`;

  return (
    <div className="min-w-56">
      <label htmlFor={id} className="label text-xs">{etiqueta}</label>
      <select
        id={id}
        value={valor}
        onChange={(e) => {
          const p = new URLSearchParams(params.toString());
          if (e.target.value) p.set(nombre, e.target.value); else p.delete(nombre);
          limpiar.forEach((k) => p.delete(k));
          router.push(`${pathname}?${p.toString()}`);
        }}
        className="input mt-1"
      >
        <option value="">Selecciona…</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>{o.nombre}{o.activo ? "" : " (inactivo)"}</option>
        ))}
      </select>
    </div>
  );
}
