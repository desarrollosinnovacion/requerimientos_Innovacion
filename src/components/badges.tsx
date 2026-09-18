import { ESTADOS, type Estado } from "@/lib/formulario";

const COLOR_ESTADO: Record<Estado, string> = {
  no_iniciado: "bg-slate-200 text-slate-700",
  iniciado: "bg-brand-100 text-brand-800",
  en_pruebas: "bg-amber-100 text-amber-800",
  finalizado: "bg-emerald-100 text-emerald-800",
};

const COLOR_PRIORIDAD: Record<string, string> = {
  Crítica: "bg-red-100 text-red-800",
  Alta: "bg-orange-100 text-orange-800",
  Media: "bg-yellow-100 text-yellow-800",
  Baja: "bg-slate-100 text-slate-700",
};

export function BadgeEstado({ estado }: { estado: Estado }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_ESTADO[estado] ?? "bg-slate-100 text-slate-700"}`}>
      {ESTADOS[estado] ?? estado}
    </span>
  );
}

export function BadgePrioridad({ prioridad }: { prioridad: string | null }) {
  if (!prioridad) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_PRIORIDAD[prioridad] ?? "bg-slate-100 text-slate-700"}`}>
      {prioridad}
    </span>
  );
}
