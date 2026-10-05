import { ACCIONES_BITACORA, type BitacoraFila } from "@/lib/credenciales";
import { formatearFecha } from "@/lib/formato";

/** Últimos movimientos sobre las credenciales de la aplicación (quién hizo qué y cuándo). */
export function BitacoraReciente({ filas }: { filas: BitacoraFila[] }) {
  return (
    <section className="card" aria-labelledby="bitacora">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 id="bitacora" className="text-base font-medium text-slate-900">Bitácora</h2>
        <p className="mt-0.5 text-xs text-slate-500">Cada vez que alguien crea, edita, elimina o revela una credencial queda aquí. No se puede borrar.</p>
      </div>
      {filas.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">Sin movimientos todavía.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {filas.map((f) => (
            <li key={f.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2">
              <span className="text-slate-800">
                <strong className="font-medium">{f.usuario?.nombre ?? "Usuario eliminado"}</strong>{" "}
                <span className={f.accion === "revelar" ? "text-cobre-700" : "text-slate-600"}>{ACCIONES_BITACORA[f.accion].toLocaleLowerCase("es")}</span>{" "}
                <span className="text-slate-700">«{f.etiqueta}»</span>
                {f.credencial_id === null && f.accion !== "eliminar" && <span className="text-xs text-slate-400"> (ya no existe)</span>}
              </span>
              <time dateTime={f.creado_en} className="whitespace-nowrap text-xs text-slate-500">{formatearFecha(f.creado_en, true)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
