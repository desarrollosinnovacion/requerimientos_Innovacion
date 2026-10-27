import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  ESTADOS,
  SECCIONES,
  cumpleCondicion,
  type Campo,
} from "@/lib/formulario";
import { formatearFecha, tituloProyecto } from "@/lib/formato";
import { COLOR_ESTADO, COLOR_PRIORIDAD } from "@/lib/colores-estado";
import type { MiembroEquipo, Requerimiento } from "@/lib/tipos";

// Paleta SICSA (ver src/app/globals.css).
const VERDE = "#175641";
const VERDE_PROFUNDO = "#0B2B21";
const HUESO = "#F4F1EA";
const PIEDRA = "#D8D5CE";
const HUMO = "#6E6B66";
const TINTA = "#1C1B1A";

// Fuentes y logo se leen de /public; next.config los incluye en el bundle de la función (outputFileTracingIncludes).
const PUBLICO = path.join(process.cwd(), "public");
Font.register({
  family: "Archivo",
  fonts: [
    { src: path.join(PUBLICO, "fuentes/Archivo-Regular.ttf"), fontWeight: 400 },
    { src: path.join(PUBLICO, "fuentes/Archivo-Medium.ttf"), fontWeight: 500 },
    {
      src: path.join(PUBLICO, "fuentes/Archivo-SemiBold.ttf"),
      fontWeight: 600,
    },
  ],
});
// Sin guiones de partición: las etiquetas largas se envuelven por palabra.
Font.registerHyphenationCallback((palabra) => [palabra]);

const estilos = StyleSheet.create({
  pagina: {
    fontFamily: "Archivo",
    fontSize: 9.5,
    color: TINTA,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
  },
  // El interlineado va en cada texto, siempre junto a un fontSize explícito: en <Page> react-pdf 4.9
  // omite el pie absoluto, y sin fontSize propio el multiplicador se calcula mal y separa de más.
  texto: { fontSize: 9.5, lineHeight: 1.4 },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: VERDE,
    paddingBottom: 12,
    marginBottom: 16,
  },
  logo: { width: 96, height: 48 },
  encabezadoTexto: { alignItems: "flex-end", maxWidth: 340 },
  tituloDoc: {
    fontSize: 8,
    color: HUMO,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  folio: { fontSize: 11, fontWeight: 600, color: VERDE, marginTop: 2 },
  titulo: {
    fontSize: 16,
    fontWeight: 600,
    color: VERDE_PROFUNDO,
    textAlign: "right",
    marginTop: 4,
  },
  subtitulo: {
    fontSize: 9,
    lineHeight: 1.4,
    color: HUMO,
    textAlign: "right",
    marginTop: 2,
  },
  bloqueSeguimiento: {
    backgroundColor: HUESO,
    borderLeftWidth: 3,
    borderLeftColor: VERDE,
    padding: 10,
    marginBottom: 16,
  },
  filaSeguimiento: { flexDirection: "row", flexWrap: "wrap" },
  celdaSeguimiento: { width: "33.33%", paddingRight: 8, paddingVertical: 3 },
  etiquetaSeg: {
    fontSize: 7.5,
    color: HUMO,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valorSeg: { fontSize: 9.5, marginTop: 1, lineHeight: 1.3 },
  etiquetaColor: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  puntoColor: { width: 7, height: 7, marginRight: 4 },
  seccion: { marginBottom: 12 },
  seccionTitulo: {
    fontSize: 11,
    fontWeight: 600,
    color: VERDE,
    borderBottomWidth: 0.75,
    borderBottomColor: PIEDRA,
    paddingBottom: 3,
    marginBottom: 4,
  },
  campo: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: HUESO,
  },
  campoEtiqueta: {
    fontSize: 9.5,
    lineHeight: 1.4,
    width: "36%",
    paddingRight: 10,
    fontWeight: 500,
    color: HUMO,
  },
  campoValor: { width: "64%" },
  opciones: { flexDirection: "row", flexWrap: "wrap" },
  opcion: {
    backgroundColor: HUESO,
    borderWidth: 0.5,
    borderColor: PIEDRA,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginRight: 4,
    marginBottom: 3,
    fontSize: 8.5,
  },
  notas: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: PIEDRA,
  },
  pie: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: HUMO,
    borderTopWidth: 0.5,
    borderTopColor: PIEDRA,
    paddingTop: 6,
  },
  pieTitulo: { maxWidth: 300 },
});

function recortar(texto: string, max: number) {
  return texto.length > max ? `${texto.slice(0, max - 1).trimEnd()}…` : texto;
}

type Props = {
  req: Requerimiento;
  asignados: MiembroEquipo[];
  logo: Buffer;
  generadoEn: string;
};

/** Un campo es "corto" si su respuesta cabe con holgura en unas pocas líneas (se mantiene en una sola página). */
function esCorto(campo: Campo, req: Requerimiento) {
  const v = req[campo.nombre];
  const largo = Array.isArray(v) ? v.join(" ").length : String(v ?? "").length;
  return largo <= 400 && !String(v ?? "").includes("\n\n");
}

function tieneValor(v: unknown) {
  return Array.isArray(v)
    ? v.length > 0
    : v !== null && v !== undefined && v !== "";
}

function Valor({ campo, req }: { campo: Campo; req: Requerimiento }) {
  const v = req[campo.nombre];
  const otro = "otro" in campo && campo.otro ? req[campo.otro] : null;
  if (Array.isArray(v)) {
    return (
      <View style={estilos.opciones}>
        {v.map((op) => (
          <Text key={op} style={estilos.opcion}>
            {op === "Otro" && otro ? `Otro: ${otro}` : op}
          </Text>
        ))}
      </View>
    );
  }
  if (campo.tipo === "fecha")
    return <Text style={estilos.texto}>{formatearFecha(v as string)}</Text>;
  if (v === "Otro" && otro)
    return <Text style={estilos.texto}>{`Otro: ${otro}`}</Text>;
  return <Text style={estilos.texto}>{v as string}</Text>;
}

function Etiqueta({ texto, color }: { texto: string; color?: string }) {
  return (
    <View style={estilos.etiquetaColor}>
      {color && (
        <View style={[estilos.puntoColor, { backgroundColor: color }]} />
      )}
      <Text style={estilos.valorSeg}>{texto}</Text>
    </View>
  );
}

function DocumentoRequerimiento({ req, asignados, logo, generadoEn }: Props) {
  const titulo = tituloProyecto(req);
  return (
    <Document
      title={`${req.folio} · ${titulo}`}
      author="Departamento de Innovación · SICSA"
      language="es"
    >
      <Page size="LETTER" style={estilos.pagina}>
        <View style={estilos.encabezado} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, no <img> HTML */}
          <Image src={{ data: logo, format: "png" }} style={estilos.logo} />
          <View style={estilos.encabezadoTexto}>
            <Text style={estilos.tituloDoc}>
              Requerimiento · Departamento de Innovación
            </Text>
            <Text style={estilos.folio}>{req.folio}</Text>
          </View>
        </View>

        {/* El pie va antes del contenido: react-pdf solo repite en cada página los elementos fijos ya vistos. */}
        <View style={estilos.pie} fixed>
          {/* El texto largo lleva ancho acotado: si la fila desborda, react-pdf omite el bloque absoluto completo. */}
          <Text style={estilos.pieTitulo}>
            {req.folio} · {recortar(titulo, 70)}
          </Text>
          <Text>Generado el {generadoEn}</Text>
          <Text
            fixed
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>

        <View>
          <Text style={estilos.titulo}>{titulo}</Text>
          {req.nombre_proyecto && req.tipo_requerimiento && (
            <Text style={estilos.subtitulo}>{req.tipo_requerimiento}</Text>
          )}
          <Text style={[estilos.subtitulo, { marginBottom: 14 }]}>
            Enviado por {req.nombre_solicitante ?? "Sin nombre"}
            {req.empresa_area ? ` (${req.empresa_area})` : ""} el{" "}
            {formatearFecha(req.creado_en, true)}
            {req.solicitante_id === null ? " · desde el enlace público" : ""}
          </Text>

          <View style={estilos.bloqueSeguimiento}>
            <Text
              style={[
                estilos.etiquetaSeg,
                { marginBottom: 4, color: VERDE, fontWeight: 600 },
              ]}
            >
              Seguimiento
            </Text>
            <View style={estilos.filaSeguimiento}>
              <View style={estilos.celdaSeguimiento}>
                <Text style={estilos.etiquetaSeg}>Estado del proyecto</Text>
                <Etiqueta
                  texto={ESTADOS[req.estado] ?? req.estado}
                  color={COLOR_ESTADO[req.estado]}
                />
              </View>
              <View style={estilos.celdaSeguimiento}>
                <Text style={estilos.etiquetaSeg}>Prioridad sugerida</Text>
                <Etiqueta
                  texto={req.prioridad_sugerida ?? "—"}
                  color={
                    req.prioridad_sugerida
                      ? COLOR_PRIORIDAD[req.prioridad_sugerida]
                      : undefined
                  }
                />
              </View>
              <View style={estilos.celdaSeguimiento}>
                <Text style={estilos.etiquetaSeg}>Prioridad final</Text>
                <Etiqueta
                  texto={req.prioridad_final ?? "—"}
                  color={
                    req.prioridad_final
                      ? COLOR_PRIORIDAD[req.prioridad_final]
                      : undefined
                  }
                />
              </View>
              <View style={estilos.celdaSeguimiento}>
                <Text style={estilos.etiquetaSeg}>Equipo asignado</Text>
                <Text style={estilos.valorSeg}>
                  {asignados.length === 0
                    ? "Sin asignar"
                    : asignados.map((m) => m.nombre).join(", ")}
                </Text>
              </View>
              <View style={estilos.celdaSeguimiento}>
                <Text style={estilos.etiquetaSeg}>Entrega estimada</Text>
                <Text style={estilos.valorSeg}>
                  {formatearFecha(req.fecha_estimada_entrega)}
                </Text>
              </View>
              <View style={estilos.celdaSeguimiento}>
                <Text style={estilos.etiquetaSeg}>Última actualización</Text>
                <Text style={estilos.valorSeg}>
                  {formatearFecha(req.actualizado_en, true)}
                </Text>
              </View>
            </View>
            {req.notas_innovacion && (
              <View style={estilos.notas}>
                <Text style={estilos.etiquetaSeg}>Respuesta de Innovación</Text>
                <Text style={estilos.valorSeg}>{req.notas_innovacion}</Text>
              </View>
            )}
          </View>

          {SECCIONES.map((seccion) => {
            const campos = seccion.campos.filter(
              (c) =>
                c.nombre !== "nombre_proyecto" &&
                cumpleCondicion(c, req) &&
                tieneValor(req[c.nombre]),
            );
            if (campos.length === 0) return null;
            return (
              <View key={seccion.id} style={estilos.seccion}>
                {/* El título va en el mismo bloque que su primer campo: así nunca queda huérfano al pie.
                    Solo los campos cortos son indivisibles; un texto largo que no cabe en la página
                    debe partirse, porque con wrap={false} react-pdf lo encima sobre lo demás. */}
                {campos.map((c, i) => (
                  <View key={c.nombre} wrap={!esCorto(c, req)}>
                    {i === 0 && (
                      <Text style={estilos.seccionTitulo} minPresenceAhead={40}>
                        {seccion.titulo}
                      </Text>
                    )}
                    <View style={estilos.campo}>
                      <Text style={estilos.campoEtiqueta}>{c.etiqueta}</Text>
                      <View style={estilos.campoValor}>
                        <Valor campo={c} req={req} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}

/** Genera el PDF completo de un requerimiento (ficha de seguimiento + todas las secciones con respuesta). */
export async function generarPdfRequerimiento(
  req: Requerimiento,
  asignados: MiembroEquipo[],
): Promise<Buffer> {
  const logo = readFileSync(path.join(PUBLICO, "marca/logo-verde.png"));
  const generadoEn = formatearFecha(new Date().toISOString(), true);
  return renderToBuffer(
    <DocumentoRequerimiento
      req={req}
      asignados={asignados}
      logo={logo}
      generadoEn={generadoEn}
    />,
  );
}
