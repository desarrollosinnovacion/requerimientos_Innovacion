// Fuente única de verdad del formulario de requerimientos.
// Se usa para renderizar el formulario, validar en el servidor y mostrar el detalle.

export type Condicion = { campo: string; valor: string };

type Base = {
  nombre: string;
  etiqueta: string;
  requerido?: boolean;
  ayuda?: string;
  placeholder?: string;
  /** Solo se muestra / valida cuando el campo indicado tiene ese valor. */
  condicion?: Condicion;
};

export type Campo =
  | (Base & { tipo: "texto" | "textarea" | "fecha" })
  /** Tres selectores en cascada (empresa_id, departamento_id, area_id) tomados de los catálogos. */
  | (Base & { tipo: "empresa_area" })
  | (Base & {
      tipo: "radio" | "checkbox";
      opciones: readonly string[];
      /** Nombre del campo de texto que se habilita al elegir "Otro". */
      otro?: string;
    });

export type Seccion = {
  id: string;
  titulo: string;
  descripcion?: string;
  campos: Campo[];
};

export const SI_NO_NS = ["Sí", "No", "No estoy seguro"] as const;

export const SECCIONES: Seccion[] = [
  {
    id: "general",
    titulo: "1. Información general",
    campos: [
      {
        tipo: "texto",
        nombre: "nombre_proyecto",
        etiqueta: "Nombre del proyecto",
        placeholder: "Ej. Portal de proveedores, Reporte de cartera…",
        ayuda: "Un nombre corto para identificar el proyecto en listas y tablero.",
      },
      { tipo: "texto", nombre: "nombre_solicitante", etiqueta: "Nombre del solicitante" },
      { tipo: "empresa_area", nombre: "empresa_area", etiqueta: "Empresa / departamento / área" },
      { tipo: "texto", nombre: "correo", etiqueta: "Correo electrónico" },
      { tipo: "texto", nombre: "product_owner", etiqueta: "Responsable del requerimiento / Product Owner" },
      {
        tipo: "radio",
        nombre: "tipo_requerimiento",
        etiqueta: "Tipo de requerimiento",
        otro: "tipo_requerimiento_otro",
        opciones: [
          "Nueva funcionalidad",
          "Mejora de funcionalidad existente",
          "Automatización de proceso",
          "Integración entre sistemas",
          "Reporte / Dashboard / BI",
          "Datos / Base de datos",
          "Corrección de error / Bug",
          "Cambio de configuración",
          "Otro",
        ],
      },
    ],
  },
  {
    id: "necesidad",
    titulo: "2. Necesidad o problema",
    campos: [
      {
        tipo: "textarea",
        nombre: "problema",
        etiqueta: "¿Qué problema se busca resolver?",
        ayuda: "Describe la situación actual, el problema y por qué necesita resolverse.",
      },
      {
        tipo: "radio",
        nombre: "proceso_actual_tipo",
        etiqueta: "¿Cómo se realiza actualmente este proceso?",
        otro: "proceso_actual_tipo_otro",
        opciones: [
          "Manualmente",
          "Excel / hojas de cálculo",
          "Correo electrónico",
          "Sistema existente",
          "No existe un proceso actualmente",
          "Otro",
        ],
      },
      { tipo: "textarea", nombre: "proceso_actual_desc", etiqueta: "Describe brevemente el proceso actual" },
    ],
  },
  {
    id: "resultado",
    titulo: "3. Resultado esperado",
    campos: [
      {
        tipo: "textarea",
        nombre: "resultado_esperado",
        etiqueta: "¿Qué necesitas que haga la solución?",
        ayuda: "Describe el resultado esperado desde la perspectiva del usuario.",
      },
      { tipo: "textarea", nombre: "criterio_exito", etiqueta: "¿Cómo sabremos que el requerimiento fue resuelto exitosamente?" },
      {
        tipo: "checkbox",
        nombre: "usuarios_beneficiados",
        etiqueta: "¿Quiénes serán los principales usuarios beneficiados?",
        otro: "usuarios_beneficiados_otro",
        opciones: [
          "Equipo interno",
          "Administración",
          "Ventas",
          "Finanzas",
          "Operaciones",
          "Clientes",
          "Proveedores",
          "Dirección / Gerencia",
          "Otro",
        ],
      },
      { tipo: "texto", nombre: "numero_usuarios", etiqueta: "Número aproximado de usuarios impactados" },
    ],
  },
  {
    id: "alcance",
    titulo: "4. Alcance funcional",
    campos: [
      {
        tipo: "textarea",
        nombre: "flujo_esperado",
        etiqueta: "Describe el flujo esperado",
        ayuda: "Ejemplo: 1) El usuario inicia... 2) El sistema debe... 3) Luego debe... 4) Resultado final...",
      },
      {
        tipo: "textarea",
        nombre: "funcionalidades_indispensables",
        etiqueta: "¿Cuáles son las funcionalidades indispensables?",
        ayuda: "Enumera únicamente lo que debe existir para considerar el requerimiento funcional.",
      },
      { tipo: "textarea", nombre: "funcionalidades_deseables", etiqueta: "¿Qué funcionalidades serían deseables, pero no indispensables?" },
    ],
  },
  {
    id: "sistemas",
    titulo: "5. Sistemas e integraciones",
    campos: [
      {
        tipo: "checkbox",
        nombre: "sistemas_involucrados",
        etiqueta: "¿Qué sistemas están involucrados?",
        otro: "sistemas_involucrados_otro",
        opciones: [
          "Microsoft 365",
          "Power Apps",
          "Power Automate",
          "Power BI",
          "Dynamics / Dataverse",
          "Microsoft Fabric",
          "ERP",
          "CRM",
          "Sistema propio",
          "API externa",
          "Base de datos",
          "Otro",
        ],
      },
      { tipo: "radio", nombre: "requiere_integracion", etiqueta: "¿Se requiere integración entre sistemas?", opciones: SI_NO_NS },
      {
        tipo: "textarea",
        nombre: "integracion_sistemas",
        etiqueta: "¿Con cuáles sistemas?",
        condicion: { campo: "requiere_integracion", valor: "Sí" },
      },
      { tipo: "radio", nombre: "requiere_migracion", etiqueta: "¿Se requiere importar, transformar o migrar información?", opciones: SI_NO_NS },
      { tipo: "texto", nombre: "fuente_datos", etiqueta: "Fuente de los datos" },
      { tipo: "texto", nombre: "volumen_datos", etiqueta: "Volumen aproximado de datos" },
    ],
  },
  {
    id: "apoyo",
    titulo: "6. Información y archivos de apoyo",
    campos: [
      {
        tipo: "checkbox",
        nombre: "documentacion_disponible",
        etiqueta: "¿Qué documentación o archivos tienes disponibles?",
        otro: "documentacion_disponible_otro",
        opciones: [
          "Excel",
          "Capturas de pantalla",
          "Diagramas",
          "Documentación de proceso",
          "Ejemplos",
          "API / documentación técnica",
          "Base de datos",
          "Otro",
        ],
      },
      {
        tipo: "radio",
        nombre: "info_sensible",
        etiqueta: "¿El desarrollo utilizará información sensible, financiera, personal o confidencial?",
        opciones: SI_NO_NS,
      },
      {
        tipo: "textarea",
        nombre: "info_sensible_desc",
        etiqueta: "Describe qué tipo de información",
        condicion: { campo: "info_sensible", valor: "Sí" },
      },
    ],
  },
  {
    id: "impacto",
    titulo: "7. Impacto y prioridad",
    campos: [
      {
        tipo: "checkbox",
        nombre: "impacto_no_desarrollar",
        etiqueta: "¿Qué sucede si este requerimiento NO se desarrolla?",
        otro: "impacto_no_desarrollar_otro",
        opciones: [
          "Impacto crítico en la operación",
          "Pérdida económica",
          "Riesgo de información / seguridad",
          "Afecta directamente a clientes",
          "Genera trabajo manual significativo",
          "Reduce productividad",
          "Retrasa otro proyecto",
          "Impacto menor",
          "Otro",
        ],
      },
      {
        tipo: "checkbox",
        nombre: "impacto_esperado",
        etiqueta: "¿Cuál es el impacto esperado de la solución?",
        otro: "impacto_esperado_otro",
        opciones: [
          "Ahorro de tiempo",
          "Reducción de errores",
          "Reducción de costos",
          "Incremento de ingresos",
          "Mejor experiencia del cliente",
          "Mejor control de información",
          "Cumplimiento / auditoría",
          "Escalabilidad",
          "Otro",
        ],
      },
      {
        tipo: "texto",
        nombre: "ahorro_estimado",
        etiqueta: "Si aplica, estima cuánto tiempo podría ahorrarse",
        placeholder: "Ejemplo: 10 horas por semana",
      },
      {
        tipo: "radio",
        nombre: "prioridad_sugerida",
        etiqueta: "Prioridad sugerida por el solicitante",
        opciones: ["Crítica", "Alta", "Media", "Baja"],
      },
      { tipo: "textarea", nombre: "justificacion_prioridad", etiqueta: "Justifica la prioridad seleccionada" },
    ],
  },
  {
    id: "fecha",
    titulo: "8. Fecha requerida",
    campos: [
      { tipo: "radio", nombre: "tiene_fecha_limite", etiqueta: "¿Existe una fecha límite?", opciones: ["Sí", "No"] },
      {
        tipo: "fecha",
        nombre: "fecha_limite",
        etiqueta: "Indica la fecha",
        condicion: { campo: "tiene_fecha_limite", valor: "Sí" },
      },
      {
        tipo: "radio",
        nombre: "motivo_fecha",
        etiqueta: "¿Cuál es el motivo de la fecha?",
        otro: "motivo_fecha_otro",
        condicion: { campo: "tiene_fecha_limite", valor: "Sí" },
        opciones: [
          "Compromiso con cliente",
          "Requerimiento legal / regulatorio",
          "Lanzamiento",
          "Dependencia de otro proyecto",
          "Cierre financiero / administrativo",
          "Mejora operativa",
          "Otro",
        ],
      },
      {
        tipo: "textarea",
        nombre: "contexto_fecha",
        etiqueta: "Explica cualquier contexto adicional sobre la fecha",
        condicion: { campo: "tiene_fecha_limite", valor: "Sí" },
      },
    ],
  },
  {
    id: "confirmacion",
    titulo: "9. Confirmación",
    campos: [
      {
        tipo: "textarea",
        nombre: "comentarios_adicionales",
        etiqueta: "¿Hay algún comentario, dependencia o información adicional que Innovación deba conocer?",
      },
    ],
  },
];

export const NOTA_FINAL =
  "La prioridad final, viabilidad técnica y fecha estimada de entrega serán definidas por el Departamento de Innovación después de evaluar impacto, urgencia, esfuerzo, riesgo y dependencias.";

/**
 * Estado del proyecto, en el orden en que se muestran las columnas del tablero.
 * Todo requerimiento nace en `no_iniciado`; solo Innovación lo cambia. Debe coincidir
 * con el enum `estado_proyecto` de la base (migración 0011).
 */
export const ESTADOS = {
  pausado: "Pausado",
  recurrente: "Recurrente",
  no_iniciado: "No iniciado",
  en_desarrollo: "En desarrollo",
  casi_terminado: "Casi terminado",
  en_pruebas: "En pruebas",
  entregado: "Entregado",
} as const;

export type Estado = keyof typeof ESTADOS;

export const PRIORIDADES = ["Crítica", "Alta", "Media", "Baja"] as const;

export type ValoresFormulario = Record<string, string | string[] | null>;

/** Respuesta de las acciones que guardan el formulario; `destino` es la ruta a la que navegar. */
export type ResultadoEnvio =
  | { ok: true; destino: string }
  | { ok: false; errores: Record<string, string>; mensaje?: string };

/** Todos los campos (incluidos los "otro") en orden. */
export function todosLosCampos(): Campo[] {
  return SECCIONES.flatMap((s) => s.campos);
}

export function cumpleCondicion(campo: Campo, valores: ValoresFormulario): boolean {
  if (!campo.condicion) return true;
  return valores[campo.condicion.campo] === campo.condicion.valor;
}

/**
 * Convierte el FormData enviado por el formulario en un objeto listo para insertar
 * y devuelve los errores de validación por campo.
 */
export function parsearFormulario(fd: FormData): {
  datos: ValoresFormulario;
  errores: Record<string, string>;
} {
  const datos: ValoresFormulario = {};
  const errores: Record<string, string> = {};

  const limpiar = (v: FormDataEntryValue | null) =>
    typeof v === "string" ? v.trim() : "";

  for (const campo of todosLosCampos()) {
    if (campo.tipo === "empresa_area") {
      datos.empresa_id = limpiar(fd.get("empresa_id")) || null;
      datos.departamento_id = limpiar(fd.get("departamento_id")) || null;
      datos.area_id = limpiar(fd.get("area_id")) || null;
      // El texto combinado lo construye el servidor a partir de los catálogos.
      datos[campo.nombre] = null;
      // Ningún campo es obligatorio: si no se elige empresa, todo queda en null.
      continue;
    }
    if (campo.tipo === "checkbox") {
      datos[campo.nombre] = fd.getAll(campo.nombre).map(limpiar).filter(Boolean);
    } else {
      datos[campo.nombre] = limpiar(fd.get(campo.nombre)) || null;
    }
    if ((campo.tipo === "radio" || campo.tipo === "checkbox") && campo.otro) {
      datos[campo.otro] = limpiar(fd.get(campo.otro)) || null;
    }
  }

  for (const campo of todosLosCampos()) {
    if (campo.tipo === "empresa_area") continue;
    const visible = cumpleCondicion(campo, datos);
    const valor = datos[campo.nombre];

    if (!visible) {
      // Campos ocultos no se guardan.
      datos[campo.nombre] = campo.tipo === "checkbox" ? [] : null;
      if ((campo.tipo === "radio" || campo.tipo === "checkbox") && campo.otro) {
        datos[campo.otro] = null;
      }
      continue;
    }

    const vacio = Array.isArray(valor) ? valor.length === 0 : !valor;
    if (campo.requerido && vacio) {
      errores[campo.nombre] = "Este campo es obligatorio.";
      continue;
    }

    if ((campo.tipo === "radio" || campo.tipo === "checkbox") && !vacio) {
      const seleccion = Array.isArray(valor) ? valor : [valor as string];
      const invalida = seleccion.find((v) => !campo.opciones.includes(v));
      if (invalida) {
        errores[campo.nombre] = "Opción no válida.";
        continue;
      }
      if (campo.otro && seleccion.includes("Otro") && !datos[campo.otro]) {
        errores[campo.otro] = "Especifica la opción \"Otro\".";
      }
      if (campo.otro && !seleccion.includes("Otro")) {
        datos[campo.otro] = null;
      }
    }

    if (campo.tipo === "fecha" && valor && !/^\d{4}-\d{2}-\d{2}$/.test(valor as string)) {
      errores[campo.nombre] = "Fecha no válida.";
    }
  }

  if (datos.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo as string)) {
    errores.correo = "Correo no válido.";
  }

  return { datos, errores };
}
