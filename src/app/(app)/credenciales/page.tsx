import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requerirUsuario } from "@/lib/auth";
import { hayClaveCifrado } from "@/lib/cifrado";
import { SELECT_APLICACION, conteoCredenciales, type AplicacionFila, type RequerimientoOpcion } from "@/lib/credenciales";
import { formatearFecha } from "@/lib/formato";
import { BarraFiltros } from "@/components/barra-filtros";
import { AvisoClave } from "./aviso-clave";
import { ModalAplicacion } from "./modal-aplicacion";

const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export default async function CredencialesPage(props: PageProps<"/credenciales">) {
  const sp = await props.searchParams;
  const q = texto(sp.q);
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") redirect("/");

  const [{ data, error }, { data: empresasData }, { data: reqsData }] = await Promise.all([
    supabase.from("aplicaciones").select(SELECT_APLICACION).order("nombre").returns<AplicacionFila[]>(),
    supabase.from("empresas").select("id, nombre").eq("activo", true).order("orden").order("nombre"),
    supabase.from("requerimientos").select("id, folio, nombre_proyecto").order("creado_en", { ascending: false }).limit(300),
  ]);
  const todas = data ?? [];
  const empresas = (empresasData ?? []) as { id: string; nombre: string }[];
  const requerimientos = (reqsData ?? []) as RequerimientoOpcion[];
  const faltaClave = !hayClaveCifrado();

  const qn = q.toLocaleLowerCase("es");
  const filas = qn
    ? todas.filter((a) =>
        [a.nombre, a.descripcion, a.url, a.empresa?.nombre, a.requerimiento?.folio, a.requerimiento?.nombre_proyecto].some((t) =>
          t?.toLocaleLowerCase("es").includes(qn),
        ),
      )
    : todas;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">Credenciales</h1>
          <p className="mt-1 text-sm text-slate-600">
            Usuarios y contraseñas de las aplicaciones del equipo. Las contraseñas se guardan cifradas y cada consulta queda registrada.
          </p>
        </div>
        <ModalAplicacion empresas={empresas} requerimientos={requerimientos} />
      </div>

      {faltaClave && <AvisoClave />}

      {error && (
        <p role="alert" className="rounded-md bg-cobre-50 px-3 py-2 text-sm text-cobre-700">
          No fue posible cargar las aplicaciones: {error.message}
        </p>
      )}

      <BarraFiltros campos={[]} busqueda={{ valor: q, placeholder: "Nombre, URL, unidad o folio del requerimiento" }} hrefLimpiar="/credenciales" />

      <div className="card">
        <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
          {filas.length} aplicaci{filas.length === 1 ? "ón" : "ones"}{q ? " con esta búsqueda" : ""}
        </p>

        {filas.length === 0 ? (
          <p className="p-10 text-sm text-slate-600">
            {q ? "Ninguna aplicación coincide con la búsqueda." : "Aún no hay aplicaciones. Usa el botón «Nueva aplicación» para crear la primera."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Aplicación</th>
                  <th className="px-4 py-3">URL</th>
                  <th className="px-4 py-3">Unidad de negocio</th>
                  <th className="px-4 py-3">Requerimiento</th>
                  <th className="px-4 py-3 text-right">Credenciales</th>
                  <th className="px-4 py-3">Actualizada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/credenciales/${a.id}`} className="font-medium text-brand-600 hover:underline">{a.nombre}</Link>
                      {a.descripcion && <p className="line-clamp-1 text-xs text-slate-500">{a.descripcion}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex max-w-64 items-center gap-1 truncate text-slate-700 hover:text-brand-600 hover:underline">
                          <span className="truncate">{a.url.replace(/^https?:\/\//, "")}</span>
                          <ExternalLink aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{a.empresa?.nombre ?? <span className="text-xs text-slate-400">Sin unidad</span>}</td>
                    <td className="px-4 py-3">
                      {a.requerimiento ? (
                        <Link href={`/requerimientos/${a.requerimiento.id}`} className="text-slate-700 hover:text-brand-600 hover:underline">
                          {a.requerimiento.folio}
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{conteoCredenciales(a)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatearFecha(a.actualizado_en)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
