import { jsPDF } from "jspdf";
import eveningPhotoUrl from "../../images/image-coutumier.png";
import pagneGlodieUrl from "../../images/glodie.png";
import pagneSamuelUrl from "../../images/samuel.png";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1620;

export type CardKind = "civil" | "evening" | "both";

export interface CardOptions {
  guestName?: string;
  tableNumber?: number | null;
}

function loadCardImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Attendre les polices avant de dessiner, sinon le canvas retombe sur une
// police système et la carte téléchargée est différente de l'aperçu.
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

function coverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const ratio = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const drawWidth = img.naturalWidth * ratio;
  const drawHeight = img.naturalHeight * ratio;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(img, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
}

function containImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const ratio = Math.min(width / img.naturalWidth, height / img.naturalHeight);
  const drawWidth = img.naturalWidth * ratio;
  const drawHeight = img.naturalHeight * ratio;
  ctx.drawImage(img, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
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

function drawSquareImageCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  label: string,
) {
  ctx.save();
  ctx.fillStyle = "#fffaf2";
  ctx.fillRect(x, y, size, size + 78);
  ctx.strokeStyle = "rgba(105, 54, 32, 0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size + 78);
  coverImage(ctx, img, x + 14, y + 14, size - 28, size - 28);
  ctx.fillStyle = "#6b3522";
  ctx.font = '22px "Lato", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(label, x + size / 2, y + size + 48);
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
) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 242, 0.92)";
  ctx.fillRect(x, y, width, 198);
  ctx.strokeStyle = "rgba(166, 95, 59, 0.34)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, 198);
  ctx.fillStyle = "#a65f3b";
  ctx.font = '18px "Lato", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(eyebrow.toUpperCase(), x + 26, y + 40);
  ctx.fillStyle = "#241017";
  ctx.font = '30px "Playfair Display", serif';
  ctx.fillText(title, x + 26, y + 82);
  ctx.fillStyle = "rgba(36, 16, 23, 0.72)";
  ctx.font = '20px "Lato", sans-serif';
  details.forEach((detail, index) => ctx.fillText(detail, x + 26, y + 118 + index * 28));
  ctx.restore();
}

function drawGuestName(
  ctx: CanvasRenderingContext2D,
  name: string,
  nameY: number,
  color: string,
  tableNumber?: number | null,
  fontSize = 52,
) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.font = `italic 26px "Cormorant Garamond", serif`;
  ctx.fillText("À l'attention de", CARD_WIDTH / 2, nameY - fontSize - 6);
  ctx.font = `${fontSize}px "Great Vibes", cursive`;
  ctx.fillText(name, CARD_WIDTH / 2, nameY);
  if (tableNumber) {
    ctx.font = '24px "Lato", sans-serif';
    ctx.fillText(`TABLE ${tableNumber}`, CARD_WIDTH / 2, nameY + 40);
  }
  ctx.restore();
}

/**
 * Construit le visuel de la carte d'invitation sur un canvas 1080×1620.
 * Si `guestName` est fourni, le nom est intégré directement au visuel
 * (utilisé pour le téléchargement PDF côté invité) ; sinon un espace
 * réservé est dessiné et l'admin positionne le texte par-dessus.
 */
export async function buildInvitationCanvas(
  kind: CardKind,
  options: CardOptions = {},
): Promise<HTMLCanvasElement> {
  const [eveningPhoto, pagneGlodie, pagneSamuel] = await Promise.all([
    loadCardImage(eveningPhotoUrl),
    loadCardImage(pagneGlodieUrl),
    loadCardImage(pagneSamuelUrl),
  ]);
  await ensureFontsLoaded();

  const { guestName, tableNumber } = options;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");

  ctx.fillStyle = "#fff8ec";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  if (kind === "evening") {
    coverImage(ctx, eveningPhoto, 0, 0, CARD_WIDTH, 940);
    const gradient = ctx.createLinearGradient(0, 450, 0, 1020);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.72, "rgba(255,248,236,0.92)");
    gradient.addColorStop(1, "#fff8ec");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 450, CARD_WIDTH, 620);
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 5;
    ctx.strokeRect(58, 58, CARD_WIDTH - 116, CARD_HEIGHT - 116);

    if (guestName) {
      drawGuestName(ctx, guestName, 925, "#24180a", tableNumber, 56);
    }

    ctx.fillStyle = "#b58b18";
    ctx.font = '38px "Lato", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("DIMANCHE 12 JUILLET 2026", CARD_WIDTH / 2, 1030);
    ctx.fillStyle = "#24180a";
    ctx.font = '82px "Playfair Display", serif';
    ctx.fillText("Mariage religieux", CARD_WIDTH / 2, 1130);
    ctx.font = '44px "Cormorant Garamond", serif';
    fillTextBlock(
      ctx,
      ["Mariage religieux · 19h30", "Entrée des mariés · 19h30", "Thème : blanc & doré"],
      CARD_WIDTH / 2,
      1205,
      56,
    );
    ctx.font = '31px "Lato", sans-serif';
    fillTextBlock(
      ctx,
      [
        "Paroisse Saint Augustin de Lemba",
        "Réf. maison communale",
        "Lemba · Kinshasa",
      ],
      CARD_WIDTH / 2,
      1390,
      40,
    );
  } else if (kind === "civil") {
    const topGradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, 0);
    topGradient.addColorStop(0, "#7f3f29");
    topGradient.addColorStop(0.46, "#f3dfcf");
    topGradient.addColorStop(1, "#fff8ec");
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    ctx.fillStyle = "#fff8ec";
    ctx.fillRect(62, 62, CARD_WIDTH - 124, CARD_HEIGHT - 124);
    ctx.strokeStyle = "rgba(166, 95, 59, 0.32)";
    ctx.lineWidth = 3;
    ctx.strokeRect(86, 86, CARD_WIDTH - 172, CARD_HEIGHT - 172);
    ctx.fillStyle = "#a65f3b";
    ctx.fillRect(86, 86, 12, CARD_HEIGHT - 172);
    ctx.fillStyle = "#d7a529";
    ctx.fillRect(CARD_WIDTH - 98, 86, 12, CARD_HEIGHT - 172);

    ctx.fillStyle = "#f7eadc";
    ctx.fillRect(620, 138, 312, 416);
    containImage(ctx, eveningPhoto, 632, 150, 288, 392);
    ctx.strokeStyle = "rgba(166, 95, 59, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(620, 138, 312, 416);

    ctx.textAlign = "left";
    ctx.fillStyle = "#6b3522";
    ctx.font = '24px "Lato", sans-serif';
    ctx.fillText("INVITATION AU MARIAGE", 142, 198);
    ctx.fillStyle = "#241017";
    ctx.font = '92px "Playfair Display", serif';
    ctx.fillText("04 Juillet", 142, 310);
    ctx.font = '58px "Playfair Display", serif';
    ctx.fillText("Civil & coutumier", 142, 392);
    ctx.fillText("Familles & traditions", 142, 456);

    ctx.fillStyle = "rgba(107, 53, 34, 0.12)";
    ctx.fillRect(142, 500, 420, 2);
    ctx.fillStyle = "#6b1733";
    ctx.font = '30px "Lato", sans-serif';
    ctx.fillText("Glodie & Samuel", 142, 558);

    ctx.fillStyle = "rgba(166, 95, 59, 0.08)";
    ctx.fillRect(142, 620, 804, 92);
    ctx.strokeStyle = "rgba(166, 95, 59, 0.28)";
    ctx.lineWidth = 2;
    ctx.strokeRect(142, 620, 804, 92);

    if (guestName) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#a65f3b";
      ctx.font = '16px "Lato", sans-serif';
      ctx.fillText("INVITATION PERSONNELLE DE", CARD_WIDTH / 2, 646);
      ctx.fillStyle = "#241017";
      ctx.font = '46px "Great Vibes", cursive';
      ctx.fillText(
        tableNumber ? `${guestName} · Table ${tableNumber}` : guestName,
        CARD_WIDTH / 2,
        698,
      );
      ctx.restore();
    } else {
      ctx.fillStyle = "#a65f3b";
      ctx.font = '18px "Lato", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("ESPACE NOM DE L'INVITÉ", CARD_WIDTH / 2, 652);
      ctx.fillStyle = "rgba(36, 16, 23, 0.18)";
      ctx.fillRect(230, 682, 620, 2);
    }

    drawInfoTile(ctx, 142, 780, 390, "Matinée", "10h30 · Mariage civil", [
      "Av. Bégonias 608",
      "11ème rue Limete résidentiel",
    ]);
    drawInfoTile(ctx, 556, 780, 390, "Soirée", "19h00 · Coutumier", [
      "20h30 · Entrée des mariés",
      "Traditions & familles",
    ]);

    ctx.fillStyle = "#241017";
    ctx.font = '34px "Playfair Display", serif';
    ctx.textAlign = "center";
    ctx.fillText("Informations pagnes", CARD_WIDTH / 2, 1088);
    drawSquareImageCard(ctx, pagneGlodie, 214, 1130, 196, "Famille Samuel");
    drawSquareImageCard(ctx, pagneSamuel, 670, 1130, 196, "Famille Glodie");

    ctx.fillStyle = "rgba(36, 16, 23, 0.68)";
    ctx.font = '23px "Lato", sans-serif';
    ctx.fillText("Entrée 10ème rue · réf. résidences Augustin Kabuya et WPM de la Justice", CARD_WIDTH / 2, 1442);
  } else {
    ctx.fillStyle = "#fff8ec";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.fillStyle = "#f7eadc";
    ctx.fillRect(290, 40, 500, 390);
    containImage(ctx, eveningPhoto, 310, 60, 460, 350);
    const topFade = ctx.createLinearGradient(0, 220, 0, 560);
    topFade.addColorStop(0, "rgba(255,248,236,0)");
    topFade.addColorStop(1, "#fff8ec");
    ctx.fillStyle = topFade;
    ctx.fillRect(0, 220, CARD_WIDTH, 340);

    ctx.fillStyle = "#241017";
    ctx.fillRect(74, 430, CARD_WIDTH - 148, 74);
    ctx.fillStyle = "#fff8ec";
    ctx.font = '24px "Lato", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("LE MARIAGE DE GLODIE & SAMUEL", CARD_WIDTH / 2, 478);

    ctx.fillStyle = "#fffaf2";
    ctx.fillRect(88, 560, CARD_WIDTH - 176, 810);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.52)";
    ctx.lineWidth = 3;
    ctx.strokeRect(116, 588, CARD_WIDTH - 232, 754);

    ctx.fillStyle = "#241017";
    if (guestName) {
      ctx.font = '56px "Playfair Display", serif';
      ctx.fillText("Deux dates, une célébration", CARD_WIDTH / 2, 656);
      drawGuestName(ctx, guestName, 760, "#241017", null, 50);
      if (tableNumber) {
        ctx.fillStyle = "#6b3522";
        ctx.font = '22px "Lato", sans-serif';
        ctx.fillText(`TABLE ${tableNumber}`, CARD_WIDTH / 2, 794);
        ctx.fillStyle = "#241017";
      }
    } else {
      ctx.font = '64px "Playfair Display", serif';
      ctx.fillText("Deux dates, une célébration", CARD_WIDTH / 2, 680);
    }

    drawInfoTile(ctx, 154, 810, 382, "04 Juillet", "Civil & coutumier", [
      "10h30 mariage civil",
      "19h00 coutumier",
      "20h30 entrée des mariés",
    ]);
    drawInfoTile(ctx, 556, 810, 382, "12 Juillet", "Mariage religieux", [
      "19h30 célébration",
      "19h30 entrée des mariés",
    ]);

    ctx.fillStyle = "#6b3522";
    ctx.font = '28px "Lato", sans-serif';
    ctx.fillText("Pagnes du 04 juillet", CARD_WIDTH / 2, 1068);
    drawSquareImageCard(ctx, pagneGlodie, 258, 1090, 170, "Samuel");
    drawSquareImageCard(ctx, pagneSamuel, 652, 1090, 170, "Glodie");
  }

  ctx.fillStyle = kind === "civil" ? "#6b1733" : "#b58b18";
  ctx.font = '72px "Great Vibes", cursive';
  ctx.textAlign = "center";
  ctx.fillText("Glodie & Samuel", CARD_WIDTH / 2, kind === "evening" ? 1535 : 1485);

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

/** Télécharge le contenu d'un canvas en PDF (une page au format de la carte). */
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
