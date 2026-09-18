import { requerirUsuario } from "@/lib/auth";
import type { MiembroEquipo } from "@/lib/tipos";
import { TableroProyectos, type TarjetaProyecto } from "./tablero-proyectos";

type FilaCruda = Omit<TarjetaProyecto, "asignados" | "unidad"> & { asignados: { perfil: unknown }[] | null; empresa: unknown };

export default async function ProyectosPage() {
  const { supabase, perfil } = await requerirUsuario();
  const esInnovacion = perfil.rol === "innovacion";

  const { data } = await supabase
    .from("requerimientos")
    .select(
      "id, folio, estado, nombre_proyecto, tipo_requerimiento, prioridad_sugerida, prioridad_final, nombre_solicitante, empresa_area, empresa:empresas(nombre), fecha_limite, fecha_estimada_entrega, actualizado_en, asignados:requerimiento_asignados(perfil:perfiles(id, nombre))",
    )
    .order("actualizado_en", { ascending: false })
    .returns<FilaCruda[]>();

  const tarjetas: TarjetaProyecto[] = (data ?? []).map(({ empresa, ...r }) => ({
    ...r,
    // Unidad de negocio del catálogo o, en registros antiguos, el primer tramo de "Empresa / Depto / Área".
    unidad: (empresa as { nombre: string } | null)?.nombre ?? r.empresa_area?.split(" / ")[0] ?? "Sin unidad",
    asignados: (r.asignados ?? [])
      .map((a) => a.perfil as MiembroEquipo | null)
      .filter((p): p is MiembroEquipo => p !== null),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-slate-900">Proyectos</h1>
        <p className="mt-1 text-sm text-slate-600">
          {esInnovacion
            ? "Arrastra cada proyecto a la fase en la que está, o usa las flechas de la tarjeta."
            : "Fase actual de los requerimientos que has enviado. Solo Innovación puede moverlos."}
        </p>
      </div>
      <TableroProyectos tarjetas={tarjetas} puedeMover={esInnovacion} />
    </div>
  );
}
