import Link from "next/link";

export function TarjetaEnlace({
  href,
  titulo,
  descripcion,
  icono,
  detalle,
}: {
  href: string;
  titulo: string;
  descripcion: string;
  icono: string;
  detalle?: string;
}) {
  return (
    <Link
      href={href}
      className="card group flex flex-col gap-3 p-5 transition hover:border-brand-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-300"
    >
      <span aria-hidden className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-2xl">
        {icono}
      </span>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-700">{titulo}</h3>
        <p className="mt-1 text-sm text-slate-600">{descripcion}</p>
      </div>
      {detalle && <p className="text-xs font-medium text-slate-500">{detalle}</p>}
      <span className="text-sm font-medium text-brand-600">Abrir →</span>
    </Link>
  );
}
