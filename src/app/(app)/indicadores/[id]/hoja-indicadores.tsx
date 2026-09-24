"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatearFecha } from "@/lib/formato";
import {
  alcance,
  claseAlcance,
  formatearPorcentaje,
  progresoItem,
  TIPOS_SECCION,
  type Hoja,
  type Item,
  type Seccion,
  type TipoSeccion,
} from "@/lib/indicadores";
import {
  actualizarItem,
  crearColumna,
  crearItem,
  crearSeccion,
  eliminarColumna,
  eliminarItem,
  eliminarPeriodo,
  eliminarSeccion,
  guardarValor,
  renombrarColumna,
  renombrarPeriodo,
  renombrarSeccion,
  type Resultado,
} from "../actions";

/**
 * Hoja de captura de un período, con el aspecto del Excel: por sección una tabla con
 * Meta, Progreso y % Alcance calculados, una columna por unidad de negocio y Notas.
 * Cada celda se guarda al salir de ella (o al marcar la casilla); progreso y alcance
 * se recalculan al instante con el estado local, que se vuelve a sincronizar cuando
 * el servidor confirma el cambio.
 */
export function HojaIndicadores({ hoja: inicial }: { hoja: Hoja }) {
  const [hoja, setHoja] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);

  // Tras cada acción el servidor revalida la ruta y llegan props nuevas: son la verdad.
  // Se sincroniza durante el render (patrón de estado derivado), sin efecto.
  const [previa, setPrevia] = useState(inicial);
  if (previa !== inicial) {
    setPrevia(inicial);
    setHoja(inicial);
  }

  /** Ejecuta una acción; si falla, muestra el error y deja que las props del servidor corrijan el estado. */
  function ejecutar(accion: () => Promise<Resultado | (Resultado & { id?: string })>) {
    setError(null);
    iniciar(async () => {
      const r = await accion();
      if (!r.ok) setError(r.error);
    });
  }

  // ---- cambios locales optimistas -------------------------------------------------
  function setValorLocal(itemId: string, columnaId: string, valor: number | null) {
    setHoja((h) => ({
      ...h,
      valores: [
        ...h.valores.filter((v) => !(v.item_id === itemId && v.columna_id === columnaId)),
        ...(valor === null || valor === 0 ? [] : [{ item_id: itemId, columna_id: columnaId, valor }]),
      ],
    }));
  }
  function setItemLocal(itemId: string, cambios: Partial<Item>) {
    setHoja((h) => ({
      ...h,
      secciones: h.secciones.map((s) => ({ ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, ...cambios } : i)) })),
    }));
  }

  function guardarCelda(itemId: string, columnaId: string, valor: number | null) {
    setValorLocal(itemId, columnaId, valor);
    ejecutar(() => guardarValor(hoja.id, itemId, columnaId, valor));
  }

  const valorDe = (itemId: string, columnaId: string) =>
    hoja.valores.find((v) => v.item_id === itemId && v.columna_id === columnaId)?.valor ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link href="/indicadores" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.5} /> Volver a la lista
          </Link>
          {editandoTitulo ? (
            <form
              className="mt-2 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const nombre = String(fd.get("nombre") ?? "");
                const titulo = String(fd.get("titulo") ?? "");
                setHoja((h) => ({ ...h, nombre, titulo }));
                setEditandoTitulo(false);
                ejecutar(() => renombrarPeriodo(hoja.id, nombre, titulo));
              }}
            >
              <div>
                <label htmlFor="nombre" className="label text-xs">Período</label>
                <input id="nombre" name="nombre" defaultValue={hoja.nombre} required className="input mt-1" />
              </div>
              <div className="min-w-64 flex-1">
                <label htmlFor="titulo" className="label text-xs">Título</label>
                <input id="titulo" name="titulo" defaultValue={hoja.titulo} className="input mt-1" />
              </div>
              <button type="submit" className="btn-primary px-3 py-2"><Check aria-hidden className="h-4 w-4" strokeWidth={1.5} /> Guardar</button>
              <button type="button" onClick={() => setEditandoTitulo(false)} className="btn-secondary px-3 py-2">Cancelar</button>
            </form>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-medium text-slate-900">{hoja.nombre}</h1>
              <button type="button" onClick={() => setEditandoTitulo(true)} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900" title="Editar nombre y título">
                <Pencil aria-hidden className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          )}
          {!editandoTitulo && <p className="mt-1 text-sm text-slate-600">{hoja.titulo}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <p className="text-xs text-slate-500" role="status">
            {pendiente ? "Guardando…" : `Última actualización: ${formatearFecha(hoja.actualizado_en, true)}`}
          </p>
          {confirmarBorrar ? (
            <div role="alertdialog" className="rounded-lg border border-cobre-300 bg-cobre-50 p-3 text-left text-sm">
              <p className="font-medium text-slate-900">¿Eliminar el período «{hoja.nombre}» con todo su contenido?</p>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmarBorrar(false)} className="btn-secondary px-3 py-1.5">Cancelar</button>
                <button
                  type="button"
                  onClick={() => iniciar(async () => { const r = await eliminarPeriodo(hoja.id); if (r?.error) setError(r.error); })}
                  className="btn-primary bg-cobre-600 px-3 py-1.5 hover:bg-cobre-700 focus:ring-cobre-300"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmarBorrar(true)} className="btn-secondary border-cobre-300 px-3 py-1.5 text-xs text-cobre-700 hover:bg-cobre-50">
              <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} /> Eliminar período
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-cobre-50 px-3 py-2 text-sm text-cobre-700">{error}</p>
      )}

      {hoja.secciones.map((s) => (
        <SeccionTabla
          key={s.id}
          seccion={s}
          hoja={hoja}
          valorDe={valorDe}
          guardarCelda={guardarCelda}
          onItem={(itemId, cambios) => { setItemLocal(itemId, cambios); ejecutar(() => actualizarItem(hoja.id, itemId, cambios)); }}
          onNuevaFila={() => ejecutar(() => crearItem(hoja.id, s.id))}
          onBorrarFila={(itemId) => { if (confirm("¿Eliminar esta fila?")) ejecutar(() => eliminarItem(hoja.id, itemId)); }}
          onNuevaColumna={() => { const n = prompt("Nombre de la nueva columna (unidad de negocio):"); if (n?.trim()) ejecutar(() => crearColumna(hoja.id, s.id, n)); }}
          onRenombrarColumna={(colId, nombre) => ejecutar(() => renombrarColumna(hoja.id, colId, nombre))}
          onBorrarColumna={(colId, nombre) => { if (confirm(`¿Eliminar la columna «${nombre}» y sus valores?`)) ejecutar(() => eliminarColumna(hoja.id, colId)); }}
          onRenombrar={(nombre) => ejecutar(() => renombrarSeccion(hoja.id, s.id, nombre))}
          onBorrar={() => { if (confirm(`¿Eliminar la sección «${s.nombre}» con sus filas?`)) ejecutar(() => eliminarSeccion(hoja.id, s.id)); }}
        />
      ))}

      <NuevaSeccion onCrear={(nombre, tipo) => ejecutar(() => crearSeccion(hoja.id, nombre, tipo))} />
    </div>
  );
}

// ---------- Sección -------------------------------------------------------------------

type PropsSeccion = {
  seccion: Seccion;
  hoja: Hoja;
  valorDe: (itemId: string, columnaId: string) => number | null;
  guardarCelda: (itemId: string, columnaId: string, valor: number | null) => void;
  onItem: (itemId: string, cambios: { nombre?: string; meta?: number | null; notas?: string | null }) => void;
  onNuevaFila: () => void;
  onBorrarFila: (itemId: string) => void;
  onNuevaColumna: () => void;
  onRenombrarColumna: (columnaId: string, nombre: string) => void;
  onBorrarColumna: (columnaId: string, nombre: string) => void;
  onRenombrar: (nombre: string) => void;
  onBorrar: () => void;
};

const CELDA = "border border-slate-200 px-2 py-1";
const ENTRADA = "w-full min-w-0 bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 rounded";

function SeccionTabla(p: PropsSeccion) {
  const { seccion: s, hoja } = p;
  const esConteo = s.tipo === "conteo";

  return (
    <section className="card overflow-hidden" aria-label={s.nombre}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TextoEditable valor={s.nombre} onGuardar={p.onRenombrar} className="text-base font-medium text-slate-900" etiqueta="Nombre de la sección" />
          <span className="etiqueta shrink-0 text-slate-500" title={TIPOS_SECCION[s.tipo]}>{esConteo ? "cantidades" : "marcas"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={p.onNuevaColumna} className="btn-secondary px-2.5 py-1 text-xs">
            <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} /> Columna
          </button>
          <button type="button" onClick={p.onBorrar} title="Eliminar sección" className="rounded p-1.5 text-slate-500 hover:bg-cobre-50 hover:text-cobre-700">
            <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className={`${CELDA} min-w-64 text-left`}>Actividad</th>
              <th className={`${CELDA} w-20 text-center`}>Meta</th>
              <th className={`${CELDA} w-24 text-center`}>Progreso</th>
              <th className={`${CELDA} w-24 text-center`}>% Alcance</th>
              {s.columnas.map((c) => (
                <th key={c.id} className={`${CELDA} min-w-24 text-center font-semibold`}>
                  <div className="flex items-center gap-1">
                    <TextoEditable valor={c.nombre} onGuardar={(n) => p.onRenombrarColumna(c.id, n)} className="text-center text-xs font-semibold uppercase" etiqueta={`Columna ${c.nombre}`} />
                    <button type="button" onClick={() => p.onBorrarColumna(c.id, c.nombre)} title={`Eliminar columna ${c.nombre}`} className="rounded p-0.5 text-slate-400 hover:bg-cobre-50 hover:text-cobre-700">
                      <X aria-hidden className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                  </div>
                </th>
              ))}
              <th className={`${CELDA} min-w-48 text-left`}>Notas</th>
              <th className={`${CELDA} w-8`}><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {s.items.map((it) => {
              const progreso = progresoItem(it, s, hoja.valores);
              const a = alcance(progreso, it.meta);
              return (
                <tr key={it.id} className="hover:bg-slate-50">
                  <td className={CELDA}>
                    <input
                      aria-label="Actividad"
                      defaultValue={it.nombre}
                      placeholder="Nueva actividad…"
                      onBlur={(e) => { const v = e.target.value.trim(); if (v !== it.nombre) p.onItem(it.id, { nombre: v }); }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                      className={ENTRADA}
                    />
                  </td>
                  <td className={`${CELDA} text-center`}>
                    <input
                      aria-label="Meta"
                      type="number"
                      min={0}
                      step="any"
                      defaultValue={it.meta ?? ""}
                      onBlur={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== it.meta) p.onItem(it.id, { meta: v }); }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                      className={`${ENTRADA} text-center tabular-nums`}
                    />
                  </td>
                  <td className={`${CELDA} text-center tabular-nums text-slate-800`}>{progreso}</td>
                  <td className={`${CELDA} text-center`}>
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium tabular-nums ${claseAlcance(a)}`}>{formatearPorcentaje(a)}</span>
                  </td>
                  {s.columnas.map((c) => {
                    const v = p.valorDe(it.id, c.id);
                    return (
                      <td key={c.id} className={`${CELDA} text-center`}>
                        {esConteo ? (
                          <input
                            aria-label={`${c.nombre}: ${it.nombre || "actividad"}`}
                            type="number"
                            min={0}
                            step="any"
                            defaultValue={v ?? ""}
                            onBlur={(e) => { const n = e.target.value === "" ? null : Number(e.target.value); if (n !== v) p.guardarCelda(it.id, c.id, n); }}
                            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                            className={`${ENTRADA} text-center tabular-nums`}
                          />
                        ) : (
                          <input
                            aria-label={`${c.nombre}: ${it.nombre || "actividad"}`}
                            type="checkbox"
                            checked={v !== null && v !== 0}
                            onChange={(e) => p.guardarCelda(it.id, c.id, e.target.checked ? 1 : null)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className={CELDA}>
                    <input
                      aria-label="Notas"
                      defaultValue={it.notas ?? ""}
                      onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== (it.notas ?? null)) p.onItem(it.id, { notas: v }); }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                      className={ENTRADA}
                    />
                  </td>
                  <td className={`${CELDA} text-center`}>
                    <button type="button" onClick={() => p.onBorrarFila(it.id)} title="Eliminar fila" className="rounded p-1 text-slate-400 hover:bg-cobre-50 hover:text-cobre-700">
                      <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-200 px-3 py-2">
        <button type="button" onClick={p.onNuevaFila} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
          <Plus aria-hidden className="h-4 w-4" strokeWidth={1.5} /> Agregar fila
        </button>
      </div>
    </section>
  );
}

/** Texto que se edita en el lugar: clic para editar, Enter o salir para guardar, Escape para cancelar. */
function TextoEditable({ valor, onGuardar, className, etiqueta }: { valor: string; onGuardar: (v: string) => void; className?: string; etiqueta: string }) {
  return (
    <input
      aria-label={etiqueta}
      key={valor}
      defaultValue={valor}
      onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== valor) onGuardar(v); else e.target.value = valor; }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") { e.currentTarget.value = valor; e.currentTarget.blur(); }
      }}
      className={`${ENTRADA} ${className ?? ""}`}
    />
  );
}

function NuevaSeccion({ onCrear }: { onCrear: (nombre: string, tipo: TipoSeccion) => void }) {
  const [abierto, setAbierto] = useState(false);
  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="btn-secondary">
        <Plus aria-hidden className="h-4 w-4" strokeWidth={1.5} /> Agregar sección
      </button>
    );
  }
  return (
    <form
      className="card flex flex-wrap items-end gap-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onCrear(String(fd.get("nombre") ?? ""), String(fd.get("tipo")) as TipoSeccion);
        setAbierto(false);
      }}
    >
      <div className="min-w-64 flex-1">
        <label htmlFor="nueva-seccion" className="label text-xs">Nombre de la sección</label>
        <input id="nueva-seccion" name="nombre" required autoFocus placeholder="Ej. Capacitación" className="input mt-1" />
      </div>
      <div>
        <label htmlFor="tipo-seccion" className="label text-xs">Tipo de celdas</label>
        <select id="tipo-seccion" name="tipo" defaultValue="check" className="input mt-1">
          {(Object.keys(TIPOS_SECCION) as TipoSeccion[]).map((t) => (
            <option key={t} value={t}>{TIPOS_SECCION[t]}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn-primary">Crear</button>
      <button type="button" onClick={() => setAbierto(false)} className="btn-secondary">Cancelar</button>
    </form>
  );
}
