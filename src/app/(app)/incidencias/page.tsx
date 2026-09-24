import { requerirUsuario } from "@/lib/auth";
import { SIN_ASIGNAR, SIN_PRIORIDAD } from "@/lib/filtros";
import { PRIORIDADES } from "@/lib/formulario";
import { ESTADOS_INCIDENCIA, SELECT_INCIDENCIA, esEstadoIncidencia, type EstadoIncidencia, type IncidenciaFila } from "@/lib/incidencias";
import type { MiembroEquipo } from "@/lib/tipos";
import { BarraFiltros, type CampoFiltro } from "@/components/barra-filtros";
import { MetricasIncidencias } from "./metricas-incidencias";
import { ModalIncidencia } from "./modal-incidencia";
import { TablaIncidencias } from "./tabla-incidencias";

const OPCIONES_ESTADO = (Object.keys(ESTADOS_INCIDENCIA) as EstadoIncidencia[]).map((e) => ({
  valor: e,
  etiqueta: ESTADOS_INCIDENCIA[e],
}));
/** Valor del filtro de unidad para incidencias sin empresa. */
const SIN_UNIDAD_ID = "sin_unidad";

const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export default async function IncidenciasPage(props: PageProps<"/incidencias">) {
  const sp = await props.searchParams;
  const valores = {
    q: texto(sp.q),
    unidad: texto(sp.unidad),
    asignado: texto(sp.asignado),
    prioridad: texto(sp.prioridad),
    estado: esEstadoIncidencia(texto(sp.estado)) ? texto(sp.estado) : "",
  };
  const filtroEstado = valores.estado as EstadoIncidencia | "";
  const { supabase, perfil } = await requerirUsuario();
  const esInnovacion = perfil.rol === "innovacion";

  // Se traen todas y se filtra en memoria: los filtros dependen de datos derivados y el volumen es pequeño.
  const consulta = supabase
    .from("incidencias")
    .select(SELECT_INCIDENCIA)
    .order("creado_en", { ascending: false });

  const [{ data, error }, { data: empresasData }, { data: equipoData }] = await Promise.all([
    consulta.returns<IncidenciaFila[]>(),
    supabase.from("empresas").select("id, nombre").eq("activo", true).order("orden").order("nombre"),
    esInnovacion
      ? supabase.from("perfiles").select("id, nombre").eq("rol", "innovacion").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
  ]);
  const todas = data ?? [];
  const empresas = (empresasData ?? []) as { id: string; nombre: string }[];
  const equipo = (equipoData ?? []) as MiembroEquipo[];

  // Todo menos el estado: alimenta los indicadores, que sirven para cambiar de estado.
  const q = valores.q.toLocaleLowerCase("es");
  const sinEstado = todas.filter((i) => {
    const porTexto =
      q === "" ||
      [i.folio, i.titulo, i.descripcion, i.reportado_por, i.empresa?.nombre].some((t) => t?.toLocaleLowerCase("es").includes(q));
    const porUnidad =
      valores.unidad === "" || (valores.unidad === SIN_UNIDAD_ID ? i.empresa_id === null : i.empresa_id === valores.unidad);
    const porAsignado =
      valores.asignado === "" || (valores.asignado === SIN_ASIGNAR ? i.asignado === null : i.asignado?.id === valores.asignado);
    const porPrioridad =
      valores.prioridad === "" || (valores.prioridad === SIN_PRIORIDAD ? i.prioridad === null : i.prioridad === valores.prioridad);
    return porTexto && porUnidad && porAsignado && porPrioridad;
  });
  const filas = filtroEstado ? sinEstado.filter((i) => i.estado === filtroEstado) : sinEstado;
  const hayFiltro = Object.values(valores).some((v) => v !== "");

  // Los indicadores conservan el resto de los filtros y solo cambian el estado.
  const hrefEstado = (estado: EstadoIncidencia | "") => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...valores, estado })) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/incidencias?${qs}` : "/incidencias";
  };

  const camposFiltro: CampoFiltro[] = [
    {
      name: "unidad",
      etiqueta: "Unidad de negocio",
      valor: valores.unidad,
      todos: "Todas",
      opciones: [...empresas.map((e) => ({ valor: e.id, etiqueta: e.nombre })), { valor: SIN_UNIDAD_ID, etiqueta: "Sin unidad" }],
    },
    ...(esInnovacion
      ? [{
          name: "asignado",
          etiqueta: "Responsable",
          valor: valores.asignado,
          opciones: [{ valor: SIN_ASIGNAR, etiqueta: "Sin asignar" }, ...equipo.map((m) => ({ valor: m.id, etiqueta: m.nombre }))],
        }]
      : []),
    {
      name: "prioridad",
      etiqueta: "Prioridad",
      valor: valores.prioridad,
      todos: "Todas",
      opciones: [...PRIORIDADES.map((p) => ({ valor: p, etiqueta: p })), { valor: SIN_PRIORIDAD, etiqueta: "Sin definir" }],
    },
    { name: "estado", etiqueta: "Estado", valor: valores.estado, opciones: OPCIONES_ESTADO },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">Incidencias</h1>
          <p className="mt-1 text-sm text-slate-600">
            {esInnovacion
              ? "Tickets menores que llegan al equipo. Cambia estado, prioridad y responsable desde la lista."
              : "Incidencias menores que has reportado al Departamento de Innovación."}
          </p>
        </div>
        <ModalIncidencia empresas={empresas} equipo={esInnovacion ? equipo : null} nombreUsuario={perfil.nombre} />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-cobre-50 px-3 py-2 text-sm text-cobre-700">
          No fue posible cargar las incidencias: {error.message}
        </p>
      )}

      <BarraFiltros
        campos={camposFiltro}
        busqueda={{ valor: valores.q, placeholder: "Folio, título, descripción o quién reporta" }}
        hrefLimpiar="/incidencias"
      />

      {!error && <MetricasIncidencias incidencias={filas} paraIndicadores={sinEstado} hrefEstado={hrefEstado} estadoActivo={filtroEstado} />}

      <div className="card">
        <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
          {hayFiltro
            ? `${filas.length} incidencia${filas.length === 1 ? "" : "s"} con estos filtros`
            : `${filas.length} incidencia${filas.length === 1 ? "" : "s"}`}
        </p>

        {filas.length === 0 ? (
          <p className="p-10 text-sm text-slate-600">
            {hayFiltro
              ? "Ninguna incidencia coincide con estos filtros."
              : "Aún no hay incidencias registradas. Usa el botón «Registrar incidencia» para crear la primera."}
          </p>
        ) : (
          <TablaIncidencias filas={filas} equipo={equipo} esInnovacion={esInnovacion} />
        )}
      </div>
    </div>
  );
}
