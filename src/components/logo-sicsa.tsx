import Image from "next/image";

type Props = {
  /** `verde` sobre fondos claros (principal); `beige` sobre Verde SICSA (inversa). */
  variante: "verde" | "beige";
  /** Ancho del logotipo completo en px. Mínimo en pantalla: 120 px (manual, p. 03). */
  ancho?: number;
  className?: string;
};

/** Logotipo SICSA completo (palabra + símbolo). Proporción 2:1. */
export function LogoSicsa({ variante, ancho = 140, className }: Props) {
  return (
    <Image
      src={`/marca/logo-${variante}.png`}
      alt="SICSA"
      width={ancho}
      height={ancho / 2}
      priority
      className={className}
    />
  );
}

/** Solo el símbolo (estrella en círculo): para espacios menores a 120 px de ancho. */
export function SimboloSicsa({ variante, tamano = 36, className }: Omit<Props, "ancho"> & { tamano?: number }) {
  return (
    <Image
      src={`/marca/simbolo-${variante}.png`}
      alt="SICSA"
      width={tamano}
      height={tamano}
      priority
      className={className}
    />
  );
}
