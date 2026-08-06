import { jsPDF } from "jspdf";
import { weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1620;

export type CardKind = WeddingEventKey | "all";

export interface CardOptions {
  guestName?: string;
  tableNumber?: number | null;
}

async function ensureFontsLoaded() {
  if (!document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load('88px "Great Vibes"'),
      document.fonts.load('82px "Playfair Display"'),
      document.fonts.load('34px "Cormorant Garamond"'),
      document.fonts.load('24px "Lato"'),
    ]);
  } catch {
    // Browser fallbacks will take over.
  }
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

function drawMonogram(ctx: CanvasRenderingContext2D, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(CARD_WIDTH / 2, 250, 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.font = '76px "Great Vibes", cursive';
  ctx.fillText("J&G", CARD_WIDTH / 2, 266);
  ctx.font = '18px "Lato", sans-serif';
  ctx.fillText("2026", CARD_WIDTH / 2, 303);
  ctx.restore();
}

function drawGuestName(ctx: CanvasRenderingContext2D, options: CardOptions, y: number, color: string) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  if (options.guestName) {
    ctx.font = 'italic 28px "Cormorant Garamond", serif';
    ctx.fillText("À l'attention de", CARD_WIDTH / 2, y - 66);
    ctx.font = '64px "Great Vibes", cursive';
    ctx.fillText(options.guestName, CARD_WIDTH / 2, y);
    if (options.tableNumber) {
      ctx.font = '22px "Lato", sans-serif';
      ctx.fillText(`TABLE ${options.tableNumber}`, CARD_WIDTH / 2, y + 48);
    }
  } else {
    ctx.globalAlpha = 0.55;
    ctx.font = '18px "Lato", sans-serif';
    ctx.fillText("ESPACE NOM DE L'INVITÉ", CARD_WIDTH / 2, y);
    ctx.fillRect(250, y + 34, 580, 2);
  }
  ctx.restore();
}

function drawTile(
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
  ctx.fillRect(x, y, width, 218);
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, 218);
  ctx.fillStyle = palette.accent;
  ctx.font = '18px "Lato", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(eyebrow.toUpperCase(), x + 28, y + 44);
  ctx.fillStyle = palette.ink;
  ctx.font = '32px "Playfair Display", serif';
  ctx.fillText(title, x + 28, y + 90);
  ctx.fillStyle = `${palette.ink}cc`;
  ctx.font = '21px "Lato", sans-serif';
  details.forEach((detail, index) => ctx.fillText(detail, x + 28, y + 130 + index * 32));
  ctx.restore();
}

function drawOrnaments(ctx: CanvasRenderingContext2D, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(CARD_WIDTH / 2, 560, 300 - i * 34, 190 - i * 20, i * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEventCard(ctx: CanvasRenderingContext2D, kind: WeddingEventKey, options: CardOptions) {
  const event = weddingEvents[kind];
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, event.background);
  gradient.addColorStop(0.55, event.palette[0]);
  gradient.addColorStop(1, kind === "reception" ? "#050505" : `${event.accent}55`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  drawFrame(ctx, `${event.accent}88`);
  drawOrnaments(ctx, event.accent);
  drawMonogram(ctx, event.accent);

  ctx.textAlign = "center";
  ctx.fillStyle = event.ink;
  ctx.font = '24px "Lato", sans-serif';
  ctx.fillText("INVITATION OFFICIELLE", CARD_WIDTH / 2, 410);
  ctx.font = '72px "Playfair Display", serif';
  ctx.fillText(event.label, CARD_WIDTH / 2, 520);
  ctx.font = '36px "Cormorant Garamond", serif';
  ctx.fillText(event.theme, CARD_WIDTH / 2, 586);

  drawGuestName(ctx, options, 750, event.ink);

  const tilePalette = {
    fill: kind === "reception" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.62)",
    stroke: `${event.accent}66`,
    accent: event.accent,
    ink: event.ink,
  };
  drawTile(ctx, 148, 920, 784, "Date", event.date, [`Heure : ${event.time}`, "Lieu : à confirmer"], tilePalette);
  drawTile(ctx, 148, 1180, 784, "Dress code", event.theme, event.colorNames.slice(0, 3), tilePalette);

  ctx.fillStyle = event.ink;
  ctx.font = '78px "Great Vibes", cursive';
  ctx.fillText("Jessica & Geldi", CARD_WIDTH / 2, 1470);
}

function drawAllCard(ctx: CanvasRenderingContext2D, options: CardOptions) {
  ctx.fillStyle = "#FBF4EA";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  drawFrame(ctx, "rgba(182,110,75,0.45)");
  drawMonogram(ctx, "#B66E4B");
  drawOrnaments(ctx, "#B66E4B");

  ctx.textAlign = "center";
  ctx.fillStyle = "#3B261F";
  ctx.font = '24px "Lato", sans-serif';
  ctx.fillText("LE MARIAGE DE", CARD_WIDTH / 2, 410);
  ctx.font = '92px "Great Vibes", cursive';
  ctx.fillText("Jessica & Geldi", CARD_WIDTH / 2, 530);
  ctx.font = '46px "Playfair Display", serif';
  ctx.fillText("Quatre célébrations", CARD_WIDTH / 2, 612);
  drawGuestName(ctx, options, 760, "#3B261F");

  const keys = Object.keys(weddingEvents) as WeddingEventKey[];
  keys.forEach((key, index) => {
    const event = weddingEvents[key];
    const x = index % 2 === 0 ? 126 : 556;
    const y = index < 2 ? 920 : 1168;
    drawTile(ctx, x, y, 398, event.date.replace(" 2026", ""), event.shortLabel, [`${event.time}`, event.theme], {
      fill: "rgba(255,255,255,0.64)",
      stroke: `${event.accent}66`,
      accent: event.accent,
      ink: "#3B261F",
    });
  });

  ctx.fillStyle = "#3B261F";
  ctx.font = '24px "Lato", sans-serif';
  ctx.fillText("Avec joie, nous vous attendons.", CARD_WIDTH / 2, 1490);
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

  if (kind === "all") {
    drawAllCard(ctx, options);
  } else {
    drawEventCard(ctx, kind, options);
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
