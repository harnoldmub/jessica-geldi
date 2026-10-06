import type { CSSProperties } from "react";
import type { WeddingEventKey } from "@shared/JessicaGeldi";

/*
 * Couleurs des pages d'événement. Chaque valeur est un triplet RVB pour que Tailwind
 * puisse appliquer l'opacité (`text-tink/70`) : voir les couleurs `t*` de tailwind.config.ts
 * et les valeurs par défaut (bordeaux & crème) dans index.css.
 */
type PageTheme = {
  band: string;
  bandDeep: string;
  bandInk: string;
  lace: string;
  paper: string;
  ink: string;
  accent: string;
  seal: [string, string, string];
};

const hex = (value: string) => {
  const n = Number.parseInt(value.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

export const pageThemes: Record<WeddingEventKey, PageTheme> = {
  // Bohème chic : terracotta, argile, ivoire
  customary: {
    band: "#7a3f2a",
    bandDeep: "#4a2416",
    bandInk: "#f6e9dc",
    lace: "#e3b98f",
    paper: "#f4ece0",
    ink: "#3b261f",
    accent: "#a85d3c",
    seal: ["#d0915f", "#9a5536", "#552a17"],
  },
  // Pastel : rose poudré, lilas, crème
  civil: {
    band: "#b87a8c",
    bandDeep: "#7f4a5c",
    bandInk: "#fff6f8",
    lace: "#fbe3ea",
    paper: "#fff7f6",
    ink: "#3a2a33",
    accent: "#b0667e",
    seal: ["#e7a9bb", "#c07a90", "#874b5f"],
  },
  // Chic et élégant : noir, ivoire, or
  evening: {
    band: "#161514",
    bandDeep: "#000000",
    bandInk: "#f7f0e6",
    lace: "#c9a45c",
    paper: "#f6f1e7",
    ink: "#171717",
    accent: "#a8843f",
    seal: ["#ead08f", "#b8913f", "#6b521d"],
  },
};

export function themeVars(key: WeddingEventKey): CSSProperties {
  const t = pageThemes[key];
  return {
    "--band": hex(t.band),
    "--band-deep": hex(t.bandDeep),
    "--band-ink": hex(t.bandInk),
    "--lace": hex(t.lace),
    "--paper": hex(t.paper),
    "--ink": hex(t.ink),
    "--accent": hex(t.accent),
    "--seal-light": t.seal[0],
    "--seal-mid": t.seal[1],
    "--seal-dark": t.seal[2],
  } as CSSProperties;
}
