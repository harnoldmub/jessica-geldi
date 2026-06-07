import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  Loader2,
  Move,
  Check,
  RotateCcw,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type RsvpResponse } from "@shared/schema";
import PrettySelect from "@/components/PrettySelect";
import eveningPhotoUrl from "../../images/image-coutumier.png";
import pagneGlodieUrl from "../../images/glodie.png";
import pagneSamuelUrl from "../../images/samuel.png";

type GuestRecord = RsvpResponse & {
  invitationUrl?: string;
  invitationStatus?: "draft" | "sent";
};

interface CardGeneratorDialogProps {
  guest: GuestRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

// Couleurs de mariage élégantes prédéfinies
const COLOR_PRESETS = [
  { value: "#333333", name: "Anthracite", labelClass: "bg-[#333333]" },
  { value: "#C9A227", name: "Or royal", labelClass: "bg-[#C9A227]" },
  { value: "#8B0000", name: "Rouge", labelClass: "bg-[#8B0000]" },
  { value: "#000000", name: "Noir", labelClass: "bg-[#000000]" },
  { value: "#FFFFFF", name: "Blanc", labelClass: "bg-[#FFFFFF] border border-stone-300" },
];

// Polices élégantes disponibles
const FONT_PRESETS = [
  { value: "Cormorant Garamond", name: "Serif élégant (Cormorant)" },
  { value: "Great Vibes", name: "Manuscrite (Great Vibes)" },
  { value: "Playfair Display", name: "Éditorial (Playfair)" },
  { value: "Lato", name: "Moderne (Lato)" },
];

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1620;
const CARD_CONFIG_KEY = "glodie_samuel_invitation_card_config_v3";

function loadCardImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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
  ctx.drawImage(img, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
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
  ctx.fillRect(x, y, width, 170);
  ctx.strokeStyle = "rgba(166, 95, 59, 0.34)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, 170);
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

async function buildInvitationTemplate(kind: "civil" | "evening" | "both") {
  const [eveningPhoto, pagneGlodie, pagneSamuel] = await Promise.all([
    loadCardImage(eveningPhotoUrl),
    loadCardImage(pagneGlodieUrl),
    loadCardImage(pagneSamuelUrl),
  ]);

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
    ctx.fillStyle = "#b58b18";
    ctx.font = '38px "Lato", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("DIMANCHE 12 JUILLET 2026", CARD_WIDTH / 2, 1010);
    ctx.fillStyle = "#24180a";
    ctx.font = '82px "Playfair Display", serif';
    ctx.fillText("Soiree dansante", CARD_WIDTH / 2, 1118);
    ctx.font = '44px "Cormorant Garamond", serif';
    fillTextBlock(ctx, ["Accueil des invites · 19h30", "Entree des maries · 20h30", "Theme : blanc & doree"], CARD_WIDTH / 2, 1198, 58);
    ctx.font = '31px "Lato", sans-serif';
    fillTextBlock(ctx, ["Salle Exaudus Arena", "Avenue Bonga 23, croisement avenue du Stade", "En face du marche de Djakarta · Matonge · Kalamu"], CARD_WIDTH / 2, 1410, 42);
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
    ctx.fillText("Civil, benediction", 142, 392);
    ctx.fillText("& coutumier", 142, 456);

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
    ctx.fillStyle = "#a65f3b";
    ctx.font = '18px "Lato", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("ESPACE NOM DE L'INVITE", CARD_WIDTH / 2, 652);
    ctx.fillStyle = "rgba(36, 16, 23, 0.18)";
    ctx.fillRect(230, 682, 620, 2);

    drawInfoTile(ctx, 142, 780, 390, "Matinee", "11h00 · Mariage civil", [
      "13h00 · Benediction",
      "Cocktail au meme endroit",
    ]);
    drawInfoTile(ctx, 556, 780, 390, "Soiree", "20h00 · Coutumier", [
      "21h30 · Entree des maries",
      "Traditions & familles",
    ]);

    ctx.fillStyle = "#241017";
    ctx.font = '34px "Playfair Display", serif';
    ctx.textAlign = "center";
    ctx.fillText("Informations pagnes", CARD_WIDTH / 2, 1088);
    drawSquareImageCard(ctx, pagneGlodie, 214, 1130, 196, "Pagne Glodie");
    drawSquareImageCard(ctx, pagneSamuel, 670, 1130, 196, "Pagne Samuel");

    ctx.fillStyle = "rgba(36, 16, 23, 0.68)";
    ctx.font = '25px "Lato", sans-serif';
    ctx.fillText("Lieu du 04 juillet communique d'ici peu", CARD_WIDTH / 2, 1428);
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
    ctx.fillRect(88, 560, CARD_WIDTH - 176, 760);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.52)";
    ctx.lineWidth = 3;
    ctx.strokeRect(116, 588, CARD_WIDTH - 232, 704);

    ctx.fillStyle = "#241017";
    ctx.font = '64px "Playfair Display", serif';
    ctx.fillText("Deux dates, une celebration", CARD_WIDTH / 2, 680);

    drawInfoTile(ctx, 154, 770, 382, "04 Juillet", "Civil & coutumier", [
      "11h00 mariage civil",
      "13h00 benediction",
    ]);
    drawInfoTile(ctx, 556, 770, 382, "12 Juillet", "Soiree dansante", [
      "19h30 accueil invites",
      "20h30 entree maries",
    ]);

    ctx.fillStyle = "#6b3522";
    ctx.font = '28px "Lato", sans-serif';
    ctx.fillText("Pagnes du 04 juillet", CARD_WIDTH / 2, 1050);
    drawSquareImageCard(ctx, pagneGlodie, 248, 1084, 190, "Glodie");
    drawSquareImageCard(ctx, pagneSamuel, 642, 1084, 190, "Samuel");
  }

  ctx.fillStyle = kind === "civil" ? "#6b1733" : "#b58b18";
  ctx.font = '72px "Great Vibes", cursive';
  ctx.textAlign = "center";
  ctx.fillText("Glodie & Samuel", CARD_WIDTH / 2, 1485);

  return canvas.toDataURL("image/png");
}

export default function CardGeneratorDialog({
  guest,
  isOpen,
  onClose,
}: CardGeneratorDialogProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // États de style
  const [guestName, setGuestName] = useState("");
  const [fontFamily, setFontFamily] = useState("Cormorant Garamond");
  const [fontSize, setFontSize] = useState(42);
  const [fontColor, setFontColor] = useState("#333333");
  const [textX, setTextX] = useState(50); // En %
  const [textY, setTextY] = useState(42); // En % — la table est affichée 4% en dessous
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [rememberStyle, setRememberStyle] = useState(true);

  // États techniques
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Charger le nom de l'invité et les styles mémorisés
  useEffect(() => {
    if (guest && isOpen) {
      const baseName = `${guest.firstName} ${guest.lastName}`;
      setGuestName(
        (guest.guestCount ?? 1) >= 2
          ? `${baseName} & +1`
          : baseName
      );
      setTableNumber((guest as any).tableNumber ?? null);

      // Charger la configuration sauvegardée
      try {
        const saved = localStorage.getItem(CARD_CONFIG_KEY);
        if (saved) {
          const config = JSON.parse(saved);
          if (config.fontFamily) setFontFamily(config.fontFamily);
          if (config.fontSize) setFontSize(config.fontSize);
          if (config.fontColor) setFontColor(config.fontColor);
          if (config.textX !== undefined) setTextX(config.textX);
          if (config.textY !== undefined) setTextY(config.textY);
          if (config.textAlign) setTextAlign(config.textAlign);
          if (config.isBold !== undefined) setIsBold(config.isBold);
          if (config.isItalic !== undefined) setIsItalic(config.isItalic);
        }
      } catch (e) {
        console.error("Erreur lors du chargement des préférences de style", e);
      }
    }
  }, [guest, isOpen]);

  // Sauvegarder les styles si l'option est activée
  useEffect(() => {
    if (isOpen && rememberStyle) {
      try {
        const config = {
          fontFamily,
          fontSize,
          fontColor,
          textX,
          textY,
          textAlign,
          isBold,
          isItalic,
        };
        localStorage.setItem(CARD_CONFIG_KEY, JSON.stringify(config));
      } catch (e) {
        console.error(e);
      }
    }
  }, [
    isOpen,
    rememberStyle,
    fontFamily,
    fontSize,
    fontColor,
    textX,
    textY,
    textAlign,
    isBold,
    isItalic,
  ]);

  // Generer le fond selon la ceremonie du guest.
  useEffect(() => {
    if (isOpen && guest) {
      let cancelled = false;
      setIsImageLoading(true);
      const templateKind =
        guest.ceremonyChoice === "civil"
          ? "civil"
          : guest.ceremonyChoice === "evening"
          ? "evening"
          : "both";

      buildInvitationTemplate(templateKind)
        .then((dataUrl) => {
          if (cancelled) return;
          const img = new Image();
          img.onload = () => {
            if (cancelled) return;
            setImageObj(img);
            setIsImageLoading(false);
          };
          img.onerror = () => {
            if (cancelled) return;
            setIsImageLoading(false);
            toast({
              title: "Erreur de chargement",
              description: "Impossible de charger le modele de carte d'invitation.",
              variant: "destructive",
            });
          };
          img.src = dataUrl;
        })
        .catch(() => {
          if (cancelled) return;
          setIsImageLoading(false);
          toast({
            title: "Erreur de chargement",
            description: "Impossible de generer le modele de carte d'invitation.",
            variant: "destructive",
          });
        });

      return () => {
        cancelled = true;
      };
    } else {
      setImageObj(null);
    }
  }, [isOpen, guest, toast]);

  // Redessiner le canevas lorsque les styles changent
  useEffect(() => {
    if (!imageObj) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Définir la taille réelle de l'image sur le canevas pour conserver la HD
    canvas.width = imageObj.naturalWidth || 1024;
    canvas.height = imageObj.naturalHeight || 1536;

    // Nettoyer
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner le fond
    ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);

    // Configurer le texte
    const styleBold = isBold ? "bold " : "";
    const styleItalic = isItalic ? "italic " : "";
    ctx.font = `${styleItalic}${styleBold}${fontSize}px "${fontFamily}", sans-serif`;
    ctx.fillStyle = fontColor;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "middle";

    // Calculer les coordonnées réelles en pixels
    const pxX = (textX / 100) * canvas.width;
    const pxY = (textY / 100) * canvas.height;

    // Dessiner le nom
    ctx.fillText(guestName, pxX, pxY);

    // Dessiner le numéro de table (4% en dessous du nom, après le "TABLE :" imprimé sur l'image)
    if (tableNumber) {
      const tablePxY = ((textY + 4) / 100) * canvas.height;
      ctx.font = `${fontSize * 0.65}px "${fontFamily}", sans-serif`;
      ctx.fillText(`${tableNumber}`, pxX, tablePxY);
    }

  }, [
    imageObj,
    guest,
    guestName,
    tableNumber,
    fontFamily,
    fontSize,
    fontColor,
    textX,
    textY,
    textAlign,
    isBold,
    isItalic,
  ]);

  // Gérer le clic / déplacement sur le canevas
  const handleCanvasPointerAction = (
    clientX: number,
    clientY: number,
    isMove: boolean
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const rect = canvas.getBoundingClientRect();
    
    // Calculer les pourcentages par rapport au rectangle d'affichage client
    const pctX = ((clientX - rect.left) / rect.width) * 100;
    const pctY = ((clientY - rect.top) / rect.height) * 100;

    // Arrondir et limiter entre 0 et 100
    const finalX = Math.max(0, Math.min(100, Math.round(pctX)));
    const finalY = Math.max(0, Math.min(100, Math.round(pctY)));

    setTextX(finalX);
    setTextY(finalY);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleCanvasPointerAction(e.clientX, e.clientY, false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    handleCanvasPointerAction(e.clientX, e.clientY, true);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Support des écrans tactiles
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    setIsDragging(true);
    handleCanvasPointerAction(e.touches[0].clientX, e.touches[0].clientY, false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length === 0) return;
    handleCanvasPointerAction(e.touches[0].clientX, e.touches[0].clientY, true);
  };

  // Fonction de réinitialisation de la position
  const resetPosition = () => {
    setTextX(50);
    setTextY(42);
    setFontSize(42);
    setFontFamily("Cormorant Garamond");
    setFontColor("#333333");
    setTextAlign("center");
    setIsBold(false);
    setIsItalic(false);
  };

  // Lancer le téléchargement de l'image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const formattedName = guestName.trim().replace(/\s+/g, "_");
      const filename = `invitation_${formattedName}.png`;

      // Déclencher le téléchargement
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Téléchargement réussi !",
        description: `La carte d'invitation personnalisée pour ${guestName} a été enregistrée.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Échec de l'export",
        description: "Impossible d'exporter l'image. Vérifiez les autorisations de votre navigateur.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 flex flex-col max-h-[92vh] overflow-hidden rounded-none border border-primary/10">
        <DialogHeader className="px-6 py-4 border-b border-primary/8 shrink-0">
          <p className="text-[10px] uppercase tracking-[0.4em] text-primary/55">
            Générateur de carte
          </p>
          <DialogTitle className="font-serif text-2xl">
            Télécharger la carte d'invitation
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 bg-[#FBFBFA]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] h-full">
            {/* Colonne gauche : Aperçu interactif du canevas */}
            <div
              ref={containerRef}
              className="p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-primary/8 min-h-[350px] lg:min-h-0 bg-stone-50 select-none relative"
            >
              {isImageLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/60" strokeWidth={1.5} />
                  <p className="text-[10px] uppercase tracking-[0.25em] text-primary/50">
                    Chargement du modèle...
                  </p>
                </div>
              ) : (
                <div className="relative max-w-full max-h-[58vh] shadow-xl border border-primary/10 group cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUpOrLeave}
                    className="w-full h-auto max-h-[58vh] object-contain"
                  />
                  
                  {/* Indication visuelle temporaire au survol */}
                  <div className="absolute inset-x-0 top-4 pointer-events-none flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-[#101011]/85 text-white text-[10px] uppercase tracking-[0.25em] px-3 py-1.5 flex items-center gap-1.5">
                      <Move className="h-3 w-3" />
                      Glissez ou cliquez pour positionner le texte
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite : Contrôles de personnalisation */}
            <div className="p-6 md:p-8 space-y-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-5">
                <div className="border-b border-primary/8 pb-3">
                  <h3 className="font-serif text-lg text-foreground">Personnalisation</h3>
                  <p className="text-xs text-muted-foreground">
                    Modifiez le nom et ajustez le style visuel de l'invitation.
                  </p>
                </div>

                {/* Saisie du nom */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-foreground/75">
                    Nom sur la carte
                  </Label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="h-11 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
                    placeholder="Nom des invités"
                  />
                </div>

                {/* Choix de la police */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-foreground/75">
                    Style de police
                  </Label>
                  <PrettySelect
                    value={fontFamily}
                    onChange={setFontFamily}
                    options={FONT_PRESETS.map((font) => ({ value: font.value, label: font.name }))}
                    placeholder="Style de police"
                    buttonClassName="bg-transparent"
                  />
                </div>

                {/* Taille du texte */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] uppercase tracking-[0.3em] text-foreground/75">
                      Taille du texte
                    </Label>
                    <span className="text-[10px] font-mono text-muted-foreground">{fontSize} px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="100"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-1 bg-stone-200 accent-primary cursor-pointer"
                  />
                </div>

                {/* Choix de la couleur */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-foreground/75 block">
                    Couleur du texte
                  </Label>
                  <div className="flex flex-wrap items-center gap-3">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setCardColor(preset.value)}
                        className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                          preset.labelClass
                        } ${
                          fontColor === preset.value
                            ? "ring-2 ring-primary ring-offset-2 scale-110"
                            : "hover:scale-105"
                        }`}
                        title={preset.name}
                      >
                        {fontColor === preset.value && (
                          <Check
                            className={`h-3.5 w-3.5 ${
                              preset.value === "#FFFFFF" ? "text-stone-900" : "text-white"
                            }`}
                          />
                        )}
                      </button>
                    ))}
                    
                    {/* Sélecteur de couleur personnalisé */}
                    <div className="relative h-7 w-7 flex items-center justify-center rounded-full border border-stone-300 overflow-hidden hover:scale-105">
                      <input
                        type="color"
                        value={fontColor}
                        onChange={(e) => setCardColor(e.target.value)}
                        className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
                        title="Couleur personnalisée"
                      />
                    </div>
                  </div>
                </div>

                {/* Alignement & Styles (Gras/Italique) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.3em] text-foreground/75">
                      Alignement
                    </Label>
                    <div className="flex border border-primary/15">
                      <button
                        type="button"
                        onClick={() => setTextAlign("left")}
                        className={`flex-1 py-2 flex items-center justify-center hover:bg-stone-100 ${
                          textAlign === "left" ? "bg-primary text-white hover:bg-primary" : ""
                        }`}
                        title="Gauche"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTextAlign("center")}
                        className={`flex-1 py-2 flex items-center justify-center border-x border-primary/15 hover:bg-stone-100 ${
                          textAlign === "center" ? "bg-primary text-white hover:bg-primary" : ""
                        }`}
                        title="Centré"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTextAlign("right")}
                        className={`flex-1 py-2 flex items-center justify-center hover:bg-stone-100 ${
                          textAlign === "right" ? "bg-primary text-white hover:bg-primary" : ""
                        }`}
                        title="Droite"
                      >
                        <AlignRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.3em] text-foreground/75">
                      Style de texte
                    </Label>
                    <div className="flex border border-primary/15">
                      <button
                        type="button"
                        onClick={() => setIsBold(!isBold)}
                        className={`flex-1 py-2 flex items-center justify-center hover:bg-stone-100 border-r border-primary/15 ${
                          isBold ? "bg-primary text-white hover:bg-primary" : ""
                        }`}
                        title="Gras"
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsItalic(!isItalic)}
                        className={`flex-1 py-2 flex items-center justify-center hover:bg-stone-100 ${
                          isItalic ? "bg-primary text-white hover:bg-primary" : ""
                        }`}
                        title="Italique"
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ajustement fin X et Y */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] uppercase tracking-[0.3em] text-foreground/75">
                        Position X
                      </Label>
                      <span className="text-[9px] font-mono text-muted-foreground">{textX}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={textX}
                      onChange={(e) => setTextX(Number(e.target.value))}
                      className="w-full h-1 bg-stone-200 accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] uppercase tracking-[0.3em] text-foreground/75">
                        Position Y
                      </Label>
                      <span className="text-[9px] font-mono text-muted-foreground">{textY}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={textY}
                      onChange={(e) => setTextY(Number(e.target.value))}
                      className="w-full h-1 bg-stone-200 accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                {/* Option de mémorisation */}
                <div className="flex items-center gap-2.5 pt-3 border-t border-primary/5">
                  <input
                    type="checkbox"
                    id="remember_style_checkbox"
                    checked={rememberStyle}
                    onChange={(e) => setRememberStyle(e.target.checked)}
                    className="h-4 w-4 rounded-none border-primary/20 accent-primary cursor-pointer"
                  />
                  <Label
                    htmlFor="remember_style_checkbox"
                    className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 cursor-pointer select-none"
                  >
                    Mémoriser ce style par défaut
                  </Label>
                </div>
              </div>

              {/* Bouton de réinitialisation et de fermeture des contrôles */}
              <div className="pt-6 border-t border-primary/8 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetPosition}
                  className="rounded-none border-primary/15 h-11 text-[9px] uppercase tracking-[0.25em] text-primary"
                  title="Réinitialiser le style"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  type="button"
                  onClick={handleDownload}
                  disabled={isImageLoading || !imageObj}
                  className="flex-1 rounded-none bg-primary h-11 text-[10px] uppercase tracking-[0.35em] text-primary-foreground hover:bg-foreground gap-2"
                >
                  <Download className="h-4 w-4" />
                  Télécharger la carte
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-primary/8 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-none border-primary/15 px-6 py-5 text-[10px] uppercase tracking-[0.35em] text-primary"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Helper pour uniformiser le format des couleurs
  function setCardColor(color: string) {
    setFontColor(color);
  }
}
