import { randomInt } from "node:crypto";

// Sin caracteres ambiguos (0/O, 1/l/I) para que sea fácil de dictar o transcribir.
const MAYUS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUS = "abcdefghjkmnpqrstuvwxyz";
const DIGITOS = "23456789";
const SIMBOLOS = "!#$%&*+-?@";

/** Genera una contraseña temporal de 12 caracteres con al menos una mayúscula, minúscula, dígito y símbolo. */
export function generarPassword(): string {
  const tomar = (s: string) => s[randomInt(s.length)];
  const todos = MAYUS + MINUS + DIGITOS + SIMBOLOS;
  const chars = [tomar(MAYUS), tomar(MINUS), tomar(DIGITOS), tomar(SIMBOLOS)];
  while (chars.length < 12) chars.push(tomar(todos));
  // Mezclar (Fisher-Yates)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
