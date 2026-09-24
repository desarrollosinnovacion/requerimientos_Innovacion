#!/usr/bin/env python3
"""
Importa las hojas mensuales del Excel "Indicadores FDC 2026.xlsx" a las tablas
fdc_* de Supabase (migración 0013). Una hoja visible = un período.

Uso:  python3 scripts/importar_indicadores_fdc.py [ruta.xlsx]
Requiere: openpyxl y las variables de .env.local (URL y SUPABASE_SERVICE_ROLE_KEY).
Es idempotente por nombre de período: los que ya existen se omiten.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime

import openpyxl
from openpyxl.utils import get_column_letter

RUTA = sys.argv[1] if len(sys.argv) > 1 else "Indicadores FDC 2026.xlsx"
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
OMITIR = {"Indicadores FDC"}


def cargar_env():
    with open(".env.local") as f:
        for linea in f:
            m = re.match(r"^([A-Z_]+)=(.*)$", linea.strip())
            if m:
                os.environ.setdefault(m.group(1), m.group(2).strip().strip('"'))


cargar_env()
URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def rest(metodo, ruta, cuerpo=None, intentos=4):
    """Llamada a PostgREST con reintentos ante cortes de red (los inserts llevan ids, así que repetir es seguro)."""
    req = urllib.request.Request(
        f"{URL}/rest/v1/{ruta}",
        data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=representation"},
        method=metodo,
    )
    for intento in range(1, intentos + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                t = r.read().decode()
                return json.loads(t) if t else None
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            if intento == intentos or getattr(e, "code", None) is not None and 400 <= e.code < 500:
                raise
            print(f"  … reintento {intento} ({e})", file=sys.stderr)
            time.sleep(2 * intento)


def limpiar(v):
    return re.sub(r"\s+", " ", str(v).replace("\xa0", " ")).strip()


def orden_de(nombre):
    """AAAAMM del mes inicial. El año del nombre es el del mes final; sin año se asume 2026."""
    partes = nombre.lower().split()
    meses = [m for m in partes[0].split("-") if m in MESES]
    anio_final = int(partes[1]) if len(partes) > 1 and partes[1].isdigit() else 2026
    mes_inicio = MESES.index(meses[0]) + 1
    anio = anio_final - 1 if mes_inicio == 12 and len(meses) > 1 and MESES.index(meses[1]) == 0 else anio_final
    return anio * 100 + mes_inicio


def leer_hoja(ws, wsf):
    """Devuelve la estructura de una hoja: secciones con columnas, filas y valores."""
    titulo = limpiar(ws["A2"].value or "Reporte de Avance - Alineación Semanal de FDC")
    inicios = [r for r in range(3, ws.max_row + 1) if ws.cell(r, 1).value and ws.cell(r, 1).font.bold]
    secciones = []
    heredadas, notas_heredada = [], None
    for k, r in enumerate(inicios):
        fin = inicios[k + 1] if k + 1 < len(inicios) else ws.max_row + 1
        encabezados, col_notas = [], None
        for c in range(7, ws.max_column + 1):
            v = ws.cell(r, c).value
            if v is None:
                continue
            if limpiar(v).lower() == "notas":
                col_notas = c
            else:
                encabezados.append((c, limpiar(v)))
        if len(encabezados) < 3:  # sin encabezados propios (o una celda suelta): usa los de la sección anterior
            encabezados = heredadas
        else:
            heredadas = encabezados
        col_notas = col_notas or notas_heredada
        notas_heredada = col_notas

        # Tipo: la fórmula de Progreso de la primera fila (SUM = cantidades, COUNTIF = marcas)
        formula = str(wsf.cell(r + 1, 4).value or "")
        tipo = "conteo" if "SUM(" in formula.upper() else "check"

        filas = []
        for fr in range(r + 1, fin):
            nombre = ws.cell(fr, 1).value
            if nombre is None or not limpiar(nombre):
                continue
            meta = ws.cell(fr, 3).value
            notas = ws.cell(fr, col_notas).value if col_notas else None
            valores = {}
            for c, _ in encabezados:
                v = ws.cell(fr, c).value
                if isinstance(v, bool) or isinstance(v, (datetime, date)):
                    continue
                if isinstance(v, (int, float)):
                    valores[c] = float(v)
                elif isinstance(v, str) and v.strip().lower() == "x":
                    valores[c] = 1.0
            filas.append({
                "nombre": limpiar(nombre),
                "meta": float(meta) if isinstance(meta, (int, float)) and not isinstance(meta, bool) else None,
                "notas": limpiar(notas) if isinstance(notas, str) and limpiar(notas) else None,
                "valores": valores,
            })
        secciones.append({"nombre": limpiar(ws.cell(r, 1).value), "tipo": tipo, "columnas": encabezados, "filas": filas})
    return titulo, secciones


def main():
    wbv = openpyxl.load_workbook(RUTA, data_only=True)
    wbf = openpyxl.load_workbook(RUTA, data_only=False)
    existentes = {p["nombre"] for p in rest("GET", "fdc_periodos?select=nombre")}
    for ws in wbv.worksheets:
        if ws.sheet_state != "visible" or ws.title.strip() in OMITIR:
            continue
        nombre = limpiar(ws.title)
        if nombre in existentes:
            print(f"· {nombre}: ya existe, se omite")
            continue
        titulo, secciones = leer_hoja(ws, wbf[ws.title])
        periodo = rest("POST", "fdc_periodos", {"nombre": nombre, "titulo": titulo, "orden": orden_de(nombre)})[0]
        n_valores = 0
        for i, s in enumerate(secciones):
            sec = rest("POST", "fdc_secciones", {"periodo_id": periodo["id"], "nombre": s["nombre"], "tipo": s["tipo"], "orden": i})[0]
            columnas = rest("POST", "fdc_columnas", [{"seccion_id": sec["id"], "nombre": n, "orden": j} for j, (_, n) in enumerate(s["columnas"])]) if s["columnas"] else []
            col_id = {c: columnas[j]["id"] for j, (c, _) in enumerate(s["columnas"])}
            if s["filas"]:
                items = rest("POST", "fdc_items", [{"seccion_id": sec["id"], "nombre": f["nombre"], "meta": f["meta"], "notas": f["notas"], "orden": j} for j, f in enumerate(s["filas"])])
                valores = [
                    {"item_id": items[j]["id"], "columna_id": col_id[c], "valor": v}
                    for j, f in enumerate(s["filas"]) for c, v in f["valores"].items() if v != 0 and c in col_id
                ]
                if valores:
                    rest("POST", "fdc_valores", valores)
                    n_valores += len(valores)
        print(f"✓ {nombre}: {len(secciones)} secciones, {sum(len(s['filas']) for s in secciones)} filas, {n_valores} valores")


if __name__ == "__main__":
    main()
