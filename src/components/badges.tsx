import { ESTADOS, type Estado } from "@/lib/formulario";

// Etiquetas dentro de la paleta SICSA: neutros para lo que no empezó, Verde
// para lo que avanza, Cobre para señalar (pruebas, prioridades altas) y
// Verde SICSA sólido con Hueso para lo terminado. Radio pequeño, como el resto del portal.
const COLOR_ESTADO: Record<Estado, string> = {
  no_iniciado: "bg-slate-200 text-slate-800",
  iniciado: "bg-brand-100 text-brand-800",
  en_pruebas: "bg-cobre-100 text-cobre-800",
  finalizado: "bg-brand-600 text-slate-100",
};

// Prioridad como una sola rampa de Cobre: cuanto más urgente, más intenso.
const COLOR_PRIORIDAD: Record<string, string> = {
  Crítica: "bg-cobre-600 text-slate-100",
  Alta: "bg-cobre-100 text-cobre-800",
  Media: "bg-beige-100 text-slate-900",
  Baja: "bg-slate-100 text-slate-700 border border-slate-200",
};

const BASE = "inline-flex rounded px-2 py-0.5 text-xs font-medium";

export function BadgeEstado({ estado }: { estado: Estado }) {
  return (
    <span className={`${BASE} ${COLOR_ESTADO[estado] ?? "bg-slate-100 text-slate-700"}`}>
      {ESTADOS[estado] ?? estado}
    </span>
  );
}

export function BadgePrioridad({ prioridad }: { prioridad: string | null }) {
  if (!prioridad) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className={`${BASE} ${COLOR_PRIORIDAD[prioridad] ?? "bg-slate-100 text-slate-700"}`}>
      {prioridad}
    </span>
  );
}
