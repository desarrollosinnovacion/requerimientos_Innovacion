// Versión para el navegador del generador de src/lib/password.ts (ese usa node:crypto).
// Mismo alfabeto sin caracteres ambiguos (0/O, 1/l/I) para que sea fácil de dictar.
const MAYUS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUS = "abcdefghjkmnpqrstuvwxyz";
const DIGITOS = "23456789";
const SIMBOLOS = "!#$%&*+-?@";

function enteroAleatorio(max: number): number {
  const buf = new Uint32Array(1);
  // Rechazo para evitar sesgo al reducir módulo `max`.
  const limite = Math.floor(0xffffffff / max) * max;
  do crypto.getRandomValues(buf); while (buf[0] >= limite);
  return buf[0] % max;
}

/** Genera una contraseña con al menos una mayúscula, minúscula, dígito y símbolo. */
export function generarPasswordNavegador(longitud = 16): string {
  const tomar = (s: string) => s[enteroAleatorio(s.length)];
  const todos = MAYUS + MINUS + DIGITOS + SIMBOLOS;
  const chars = [tomar(MAYUS), tomar(MINUS), tomar(DIGITOS), tomar(SIMBOLOS)];
  while (chars.length < longitud) chars.push(tomar(todos));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = enteroAleatorio(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
