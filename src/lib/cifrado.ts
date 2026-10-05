import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Cifrado de los secretos de la sección Credenciales.
 *
 * AES-256-GCM con la clave CREDENCIALES_CLAVE (32 bytes en base64 o hex), que
 * vive solo en el servidor. Cada secreto se ata al id de su credencial (AAD):
 * un cifrado copiado a otra fila no descifra. El prefijo de versión permite
 * rotar la clave más adelante sin romper lo ya guardado.
 *
 * Formato almacenado: "v1:<iv base64>:<tag base64>:<ct base64>".
 */

const VERSION = "v1";
const ALGORITMO = "aes-256-gcm";
const BYTES_IV = 12;
const BYTES_TAG = 16;

export type CodigoCifrado = "sin_clave" | "clave_invalida" | "payload_invalido" | "descifrado_fallido";

export class ErrorCifrado extends Error {
  constructor(public codigo: CodigoCifrado, mensaje: string) {
    super(mensaje);
    this.name = "ErrorCifrado";
  }
}

/** Lee CREDENCIALES_CLAVE. Lanza ErrorCifrado si falta o no mide 32 bytes. */
function obtenerClave(): Buffer {
  const cruda = process.env.CREDENCIALES_CLAVE?.trim();
  if (!cruda) throw new ErrorCifrado("sin_clave", "Falta CREDENCIALES_CLAVE en las variables de entorno.");
  const esHex = /^[0-9a-f]{64}$/i.test(cruda);
  const clave = Buffer.from(cruda, esHex ? "hex" : "base64");
  if (clave.length !== 32) {
    throw new ErrorCifrado("clave_invalida", "CREDENCIALES_CLAVE debe tener 32 bytes (base64 de 44 caracteres o hex de 64).");
  }
  return clave;
}

/** true si la clave existe y es válida; para avisos en la interfaz sin lanzar. */
export function hayClaveCifrado(): boolean {
  try {
    obtenerClave();
    return true;
  } catch {
    return false;
  }
}

/** Cifra `texto` atándolo a `aad` (el id de la credencial). */
export function cifrar(texto: string, aad: string): string {
  const clave = obtenerClave();
  const iv = randomBytes(BYTES_IV);
  const cipher = createCipheriv(ALGORITMO, clave, iv, { authTagLength: BYTES_TAG });
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ct = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":");
}

/** Descifra un payload producido por `cifrar` con el mismo `aad`. Los errores nunca incluyen el payload. */
export function descifrar(payload: string, aad: string): string {
  const partes = payload.split(":");
  if (partes.length !== 4 || partes[0] !== VERSION) {
    throw new ErrorCifrado("payload_invalido", "Formato de secreto no reconocido.");
  }
  const clave = obtenerClave();
  const [, ivB64, tagB64, ctB64] = partes;
  try {
    const decipher = createDecipheriv(ALGORITMO, clave, Buffer.from(ivB64, "base64"), { authTagLength: BYTES_TAG });
    decipher.setAAD(Buffer.from(aad, "utf8"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
  } catch {
    throw new ErrorCifrado("descifrado_fallido", "No fue posible descifrar: la clave cambió o el dato está dañado.");
  }
}
