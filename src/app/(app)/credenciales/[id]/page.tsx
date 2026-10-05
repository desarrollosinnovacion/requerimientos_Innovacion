import { notFound, redirect } from "next/navigation";
import { requerirUsuario } from "@/lib/auth";
import { ES_UUID } from "@/lib/asignaciones";
import { hayClaveCifrado } from "@/lib/cifrado";
import {
  SELECT_APLICACION,
  SELECT_BITACORA,
  SELECT_CREDENCIAL,
  type AplicacionFila,
  type BitacoraFila,
  type CredencialFila,
  type RequerimientoOpcion,
} from "@/lib/credenciales";
import type { MiembroEquipo } from "@/lib/tipos";
import { Migas } from "@/components/migas";
import { AvisoClave } from "../aviso-clave";
import { BitacoraReciente } from "./bitacora-reciente";
import { EncabezadoAplicacion } from "./encabezado-aplicacion";
import { ModalCredencial } from "./modal-credencial";
import { TablaCredenciales } from "./tabla-credenciales";

export default async function AplicacionPage(props: PageProps<"/credenciales/[id]">) {
  const { id } = await props.params;
  if (!ES_UUID.test(id)) notFound();

  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") redirect("/");

  const [{ data: app }, { data: credsData, error }, { data: bitacoraData }, { data: empresasData }, { data: reqsData }, { data: equipoData }] = await Promise.all([
    supabase.from("aplicaciones").select(SELECT_APLICACION).eq("id", id).maybeSingle<AplicacionFila>(),
    // Nunca secreto_cifrado: ese solo lo lee la acción revelarSecreto.
    supabase.from("credenciales").select(SELECT_CREDENCIAL).eq("aplicacion_id", id).order("ambiente").order("etiqueta").returns<CredencialFila[]>(),
    supabase.from("credenciales_bitacora").select(SELECT_BITACORA).eq("aplicacion_id", id).order("creado_en", { ascending: false }).limit(20).returns<BitacoraFila[]>(),
    supabase.from("empresas").select("id, nombre").eq("activo", true).order("orden").order("nombre"),
    supabase.from("requerimientos").select("id, folio, nombre_proyecto").order("creado_en", { ascending: false }).limit(300),
    supabase.from("perfiles").select("id, nombre").eq("rol", "innovacion").eq("activo", true).order("nombre"),
  ]);
  if (!app) notFound();

  const credenciales = credsData ?? [];
  const bitacora = bitacoraData ?? [];
  const empresas = (empresasData ?? []) as { id: string; nombre: string }[];
  const requerimientos = (reqsData ?? []) as RequerimientoOpcion[];
  const equipo = (equipoData ?? []) as MiembroEquipo[];
  const faltaClave = !hayClaveCifrado();

  return (
    <div className="space-y-6">
      <Migas items={[{ href: "/credenciales", etiqueta: "Credenciales" }, { etiqueta: app.nombre }]} />

      <EncabezadoAplicacion app={app} totalCredenciales={credenciales.length} empresas={empresas} requerimientos={requerimientos} />

      {faltaClave && <AvisoClave />}

      <section className="card" aria-labelledby="credenciales">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 id="credenciales" className="text-base font-medium text-slate-900">Credenciales</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {credenciales.length} credencial{credenciales.length === 1 ? "" : "es"}. Revelar o copiar una contraseña queda registrado en la bitácora.
            </p>
          </div>
          <ModalCredencial aplicacionId={app.id} equipo={equipo} deshabilitado={faltaClave} />
        </div>

        {error && (
          <p role="alert" className="m-4 rounded-md bg-cobre-50 px-3 py-2 text-sm text-cobre-700">
            No fue posible cargar las credenciales: {error.message}
          </p>
        )}

        {!error && credenciales.length === 0 ? (
          <p className="p-10 text-sm text-slate-600">
            Esta aplicación aún no tiene credenciales. Usa «Nueva credencial» para agregar la primera.
          </p>
        ) : (
          <TablaCredenciales filas={credenciales} equipo={equipo} deshabilitado={faltaClave} />
        )}
      </section>

      <BitacoraReciente filas={bitacora} />
    </div>
  );
}
