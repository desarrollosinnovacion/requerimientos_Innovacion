import Link from "next/link";

export type Miga = { href?: string; etiqueta: string };

export function Migas({ items }: { items: Miga[] }) {
  return (
    <nav aria-label="Ruta" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((m, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {m.href ? (
              <Link href={m.href} className="hover:text-slate-800">{m.etiqueta}</Link>
            ) : (
              <span className="text-slate-800">{m.etiqueta}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
