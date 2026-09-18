import { Migas } from "@/components/migas";

export function EncabezadoCatalogo({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <>
      <Migas
        items={[
          { href: "/configuracion", etiqueta: "Configuración" },
          { href: "/configuracion/catalogos", etiqueta: "Catálogos" },
          { etiqueta: titulo },
        ]}
      />
      <div>
        <h1 className="text-2xl font-medium text-slate-900">{titulo}</h1>
        <p className="mt-1 text-sm text-slate-600">{descripcion}</p>
      </div>
    </>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-slate-300 px-3 py-8 text-sm text-slate-500">
      {children}
    </p>
  );
}
