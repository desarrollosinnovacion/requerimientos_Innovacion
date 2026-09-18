import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function TarjetaEnlace({
  href,
  titulo,
  descripcion,
  icono: Icono,
  detalle,
}: {
  href: string;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  detalle?: string;
}) {
  return (
    <Link
      href={href}
      className="card group flex flex-col gap-3 border-t-2 border-t-brand-600 p-5 transition hover:bg-slate-50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
    >
      {/* Icono en Verde SICSA sobre claro, sin caja ni círculo de color (manual, p. 08). */}
      <Icono aria-hidden className="h-7 w-7 text-brand-600" strokeWidth={1.5} />
      <div className="flex-1">
        <h3 className="text-base font-medium text-slate-900">{titulo}</h3>
        <p className="mt-1 text-sm text-slate-600">{descripcion}</p>
      </div>
      {detalle && <p className="etiqueta text-slate-500">{detalle}</p>}
      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:text-brand-900">
        Abrir <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.5} />
      </span>
    </Link>
  );
}
