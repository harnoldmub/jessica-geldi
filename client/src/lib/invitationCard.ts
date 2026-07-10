import { jsPDF } from "jspdf";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1620;

export type CardKind = "civil" | "evening" | "both";

export interface CardOptions {
  guestName?: string;
  tableNumber?: number | null;
}

async function ensureFontsLoaded() {
  if (!document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load('72px "Great Vibes"'),
      document.fonts.load('82px "Playfair Display"'),
      document.fonts.load('44px "Cormorant Garamond"'),
      document.fonts.load('31px "Lato"'),
    ]);
  } catch {
    // Les polices se chargeront via les fallbacks CSS.
  }
}

function fillTextBlock(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function drawGuestName(
  ctx: CanvasRenderingContext2D,
  name: string,
  nameY: number,
  color: string,
  tableNumber?: number | null,
  fontSize = 54,
) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.font = `italic 26px "Cormorant Garamond", serif`;
  ctx.fillText("À l'attention de", CARD_WIDTH / 2, nameY - fontSize - 8);
  ctx.font = `${fontSize}px "Great Vibes", cursive`;
  ctx.fillText(name, CARD_WIDTH / 2, nameY);
  if (tableNumber) {
    ctx.font = '23px "Lato", sans-serif';
    ctx.fillText(`TABLE ${tableNumber}`, CARD_WIDTH / 2, nameY + 42);
  }
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, stroke: string) {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.strokeRect(58, 58, CARD_WIDTH - 116, CARD_HEIGHT - 116);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(92, 92, CARD_WIDTH - 184, CARD_HEIGHT - 184);
  ctx.restore();
}

function drawOrbitalMark(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 250 - i * 34, 250 - i * 34, i * 0.34, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx - 330, cy);
  ctx.lineTo(cx + 330, cy);
  ctx.moveTo(cx, cy - 330);
  ctx.lineTo(cx, cy + 330);
  ctx.stroke();
  ctx.restore();
}

function drawInfoTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  eyebrow: string,
  title: string,
  details: string[],
  palette: { fill: string; stroke: string; accent: string; ink: string },
) {
  ctx.save();
  ctx.fillStyle = palette.fill;
  ctx.fillRect(x, y, width, 210);
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, 210);
  ctx.fillStyle = palette.accent;
  ctx.font = '18px "Lato", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(eyebrow.toUpperCase(), x + 26, y + 42);
  ctx.fillStyle = palette.ink;
  ctx.font = '30px "Playfair Display", serif';
  ctx.fillText(title, x + 26, y + 86);
  ctx.fillStyle = `${palette.ink}b8`;
  ctx.font = '20px "Lato", sans-serif';
  details.forEach((detail, index) => ctx.fillText(detail, x + 26, y + 124 + index * 30));
  ctx.restore();
}

function drawCivilCard(ctx: CanvasRenderingContext2D, options: CardOptions) {
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, "#f7f1e8");
  gradient.addColorStop(0.52, "#fffaf2");
  gradient.addColorStop(1, "#d8c7a7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  drawFrame(ctx, "rgba(31, 51, 40, 0.32)");
  drawOrbitalMark(ctx, "rgba(122, 138, 104, 0.25)", CARD_WIDTH / 2, 440);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1f3328";
  ctx.font = '24px "Lato", sans-serif';
  ctx.fillText("INVITATION OFFICIELLE", CARD_WIDTH / 2, 190);
  ctx.font = '86px "Playfair Display", serif';
  ctx.fillText("27 août 2026", CARD_WIDTH / 2, 330);
  ctx.font = '58px "Playfair Display", serif';
  ctx.fillText("Civil & bénédiction", CARD_WIDTH / 2, 420);
  ctx.font = '31px "Cormorant Garamond", serif';
  ctx.fillText("Thème à l'anglaise", CARD_WIDTH / 2, 484);

  if (options.guestName) {
    drawGuestName(ctx, options.guestName, 660, "#1f3328", options.tableNumber);
  } else {
    ctx.fillStyle = "rgba(31, 51, 40, 0.45)";
    ctx.font = '18px "Lato", sans-serif';
    ctx.fillText("ESPACE NOM DE L'INVITÉ", CARD_WIDTH / 2, 650);
    ctx.fillRect(250, 684, 580, 2);
  }

  const palette = {
    fill: "rgba(255, 255, 255, 0.72)",
    stroke: "rgba(122, 138, 104, 0.34)",
    accent: "#7a8a68",
    ink: "#1f3328",
  };
  drawInfoTile(ctx, 148, 820, 784, "Lieu", "Saphir Events", ["Avenue Uvira 1054", "Face parking Pullman"], palette);

  ctx.fillStyle = "#1f3328";
  ctx.font = '24px "Lato", sans-serif';
  ctx.fillText("Votre présence rendra ce moment encore plus précieux.", CARD_WIDTH / 2, 1230);
  ctx.font = '72px "Great Vibes", cursive';
  ctx.fillText("Laeticia & Maxime", CARD_WIDTH / 2, 1440);
}

function drawEveningCard(ctx: CanvasRenderingContext2D, options: CardOptions) {
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, "#050505");
  gradient.addColorStop(0.58, "#161616");
  gradient.addColorStop(1, "#2b261d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  drawFrame(ctx, "rgba(215, 197, 158, 0.46)");
  drawOrbitalMark(ctx, "rgba(215, 197, 158, 0.24)", CARD_WIDTH / 2, 475);

  ctx.textAlign = "center";
  ctx.fillStyle = "#d7c59e";
  ctx.font = '24px "Lato", sans-serif';
  ctx.fillText("SOIRÉE DANSANTE", CARD_WIDTH / 2, 190);
  ctx.fillStyle = "#fff8ec";
  ctx.font = '88px "Playfair Display", serif';
  ctx.fillText("29 août 2026", CARD_WIDTH / 2, 330);
  ctx.font = '58px "Playfair Display", serif';
  ctx.fillText("Full Black Chic", CARD_WIDTH / 2, 420);

  if (options.guestName) {
    drawGuestName(ctx, options.guestName, 635, "#fff8ec", options.tableNumber);
  }

  const palette = {
    fill: "rgba(255, 255, 255, 0.08)",
    stroke: "rgba(215, 197, 158, 0.32)",
    accent: "#d7c59e",
    ink: "#fff8ec",
  };
  drawInfoTile(ctx, 148, 800, 784, "Lieu", "Salle Legacy", ["Parking Galerie La Fontaine", "Gombe / Kinshasa"], palette);
  drawInfoTile(ctx, 148, 1050, 784, "Ambiance", "Full Black Chic", ["Tenue entièrement noire", "Danse, joie et célébration"], palette);

  ctx.fillStyle = "#d7c59e";
  ctx.font = '72px "Great Vibes", cursive';
  ctx.fillText("Laeticia & Maxime", CARD_WIDTH / 2, 1450);
}

function drawBothCard(ctx: CanvasRenderingContext2D, options: CardOptions) {
  ctx.fillStyle = "#fff8ec";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  drawFrame(ctx, "rgba(31, 51, 40, 0.28)");
  drawOrbitalMark(ctx, "rgba(31, 51, 40, 0.18)", CARD_WIDTH / 2, 430);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1f3328";
  ctx.font = '24px "Lato", sans-serif';
  ctx.fillText("LE MARIAGE DE", CARD_WIDTH / 2, 190);
  ctx.font = '86px "Great Vibes", cursive';
  ctx.fillText("Laeticia & Maxime", CARD_WIDTH / 2, 320);
  ctx.font = '54px "Playfair Display", serif';
  ctx.fillText("Deux dates, une célébration", CARD_WIDTH / 2, 430);

  if (options.guestName) {
    drawGuestName(ctx, options.guestName, 620, "#1f3328", options.tableNumber);
  }

  const civilPalette = {
    fill: "rgba(255,255,255,0.72)",
    stroke: "rgba(122,138,104,0.34)",
    accent: "#7a8a68",
    ink: "#1f3328",
  };
  const eveningPalette = {
    fill: "rgba(5,5,5,0.92)",
    stroke: "rgba(215,197,158,0.36)",
    accent: "#d7c59e",
    ink: "#fff8ec",
  };
  drawInfoTile(ctx, 154, 810, 382, "27 août", "Civil & bénédiction", ["Saphir Events", "Avenue Uvira 1054"], civilPalette);
  drawInfoTile(ctx, 556, 810, 382, "29 août", "Soirée dansante", ["Salle Legacy", "Full Black Chic"], eveningPalette);

  ctx.fillStyle = "#1f3328";
  ctx.font = '24px "Lato", sans-serif';
  fillTextBlock(
    ctx,
    ["Nous ne souhaitons pas de cadeaux matériels.", "Toute attention se fera en espèces lors des célébrations."],
    CARD_WIDTH / 2,
    1240,
    38,
  );
  ctx.font = '72px "Great Vibes", cursive';
  ctx.fillText("Laeticia & Maxime", CARD_WIDTH / 2, 1460);
}

export async function buildInvitationCanvas(
  kind: CardKind,
  options: CardOptions = {},
): Promise<HTMLCanvasElement> {
  await ensureFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");

  if (kind === "civil") {
    drawCivilCard(ctx, options);
  } else if (kind === "evening") {
    drawEveningCard(ctx, options);
  } else {
    drawBothCard(ctx, options);
  }

  return canvas;
}

export async function buildInvitationTemplate(
  kind: CardKind,
  options: CardOptions = {},
): Promise<string> {
  const canvas = await buildInvitationCanvas(kind, options);
  return canvas.toDataURL("image/png");
}

export function sanitizeFileName(name: string) {
  return name.trim().replace(/\s+/g, "_").replace(/[^\w\-À-ÿ]/g, "");
}

export function downloadCanvasAsPdf(canvas: HTMLCanvasElement, filename: string) {
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
    compress: true,
  });
  pdf.addImage(
    canvas.toDataURL("image/jpeg", 0.95),
    "JPEG",
    0,
    0,
    canvas.width,
    canvas.height,
  );
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
