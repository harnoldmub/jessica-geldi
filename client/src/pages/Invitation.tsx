import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { type RsvpResponse } from "@shared/schema";
import { getEventKeys, JessicaGeldi, weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";
import { defaultSiteSettings, type SiteSettings } from "@shared/siteSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { DrumIcon, GlassesIcon, LaceFrame, RingsIcon } from "@/components/Stationery";

import heroMain from "../../images/hero-main.jpeg";
import gallery1 from "../../images/gallery-1.jpeg";
import gallery2 from "../../images/gallery-2.jpeg";
import gallery3 from "../../images/gallery-3.jpeg";
import gallery4 from "../../images/gallery-4.jpeg";
import flowerStem from "../../images/pattern/flower-stem.png";
import peony from "../../images/pattern/peony.png";
import roseBud from "../../images/pattern/rose-bud.png";

type InvitationGuest = RsvpResponse & { invitationUrl: string };

const eventKeys = Object.keys(weddingEvents) as WeddingEventKey[];
const reveal = { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const };

/*
 * Une invitation par célébration : même faire-part, déclinée dans les couleurs du thème.
 * band = bandeaux pleins, paper = papier, wash = lavis d'aquarelle de la couverture.
 */
const inviteThemes: Record<WeddingEventKey, {
  band: string;
  bandInk: string;
  bandAccent: string;
  paper: string;
  ink: string;
  accent: string;
  soft: string;
  wash: [string, string];
  botanical: string;
  Icon: (props: { className?: string }) => JSX.Element;
}> = {
  customary: {
    band: "#7a3f2a",
    bandInk: "#f6e9dc",
    bandAccent: "#e3b98f",
    paper: "#f6efe4",
    ink: "#3b261f",
    accent: "#b66e4b",
    soft: "#d8a677",
    wash: ["#ead6bd", "#d8b896"],
    botanical: flowerStem,
    Icon: DrumIcon,
  },
  civil: {
    band: "#b87a8c",
    bandInk: "#fff6f8",
    bandAccent: "#fbe3ea",
    paper: "#fff8f8",
    ink: "#3a2a33",
    accent: "#c88fa0",
    soft: "#dcc6e8",
    wash: ["#f8d7da", "#f3c3cb"],
    botanical: peony,
    Icon: RingsIcon,
  },
  evening: {
    band: "#161514",
    bandInk: "#f7f0e6",
    bandAccent: "#c9a45c",
    paper: "#f8f5ef",
    ink: "#171717",
    accent: "#a8843f",
    soft: "#c9a45c",
    wash: ["#ece5d8", "#ddd2bd"],
    botanical: roseBud,
    Icon: GlassesIcon,
  },
};

const tz = "Africa/Kinshasa";
const fmt = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { timeZone: tz, ...options }).format(date);

function Botanical({ src, color, className = "", style }: { src: string; color: string; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`botanical pointer-events-none absolute block ${className}`}
      style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, backgroundColor: color, ...style }}
    />
  );
}

/* Mode PDF (?pdf=1, ouvert depuis l'admin) : rendu figé, sans animation, capturé en PDF. */
const PDF_MODE = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("pdf");

function Panel({ children, className = "", style, id, divider = false }: { children: ReactNode; className?: string; style?: CSSProperties; id?: string; divider?: boolean }) {
  return (
    <motion.section
      id={id}
      initial={PDF_MODE ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={reveal}
      className={`relative overflow-hidden px-8 py-10 text-center sm:px-12 ${className}`}
      style={style}
    >
      {divider && <span aria-hidden className="mx-auto -mt-2 mb-8 block h-px w-12 bg-current opacity-20" />}
      {children}
    </motion.section>
  );
}

/* Deux familles seulement : Cormorant (serif) pour les titres et le texte, Jost (sans fine) pour les mentions.
   La script (Pinyon) est réservée aux prénoms et au « Save the Date ». */
function Caps({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <p className={`font-sans text-[11px] font-normal uppercase leading-5 tracking-[0.18em] ${className}`} style={style}>{children}</p>;
}

function Title({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <h2 className={`font-body text-[2.1rem] font-normal italic leading-tight ${className}`} style={style}>{children}</h2>;
}

function Rule({ color, className = "" }: { color: string; className?: string }) {
  return <span aria-hidden className={`mx-auto block h-px w-16 ${className}`} style={{ background: color }} />;
}

/* Mélange deux couleurs hexadécimales (pour obtenir la teinte claire pleine, utile à la dentelle). */
function mixHex(a: string, b: string, amount: number) {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - amount) + ((pb >> shift) & 255) * amount);
  return `#${[16, 8, 0].map((shift) => ch(shift).toString(16).padStart(2, "0")).join("")}`;
}

/* Bordure dentelle : festons de la couleur claire qui mordent sur le bloc fort, avec leurs jours (petits trous) */
function LaceEdge({ light, strong }: { light: string; strong: string }) {
  return (
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-[22px]"
      style={{
        background: [
          `radial-gradient(circle, ${strong} 1.4px, transparent 1.9px) 10px 13px / 20px 22px repeat-x`,
          `radial-gradient(circle at 50% 100%, ${light} 10px, transparent 10.5px) 0 0 / 20px 22px repeat-x`,
        ].join(", "),
      }}
    />
  );
}

/* Bande de cinq jours autour de la date, le jour J mis en avant */
function DayStrip({ date, accent, ink }: { date: Date; accent: string; ink: string }) {
  const day = Number(fmt(date, { day: "numeric" }));
  const month = Number(fmt(date, { month: "numeric" })) - 1;
  const year = Number(fmt(date, { year: "numeric" }));
  const days = Array.from({ length: 5 }, (_, i) => new Date(Date.UTC(year, month, day - 2 + i)).getUTCDate());
  return (
    <div className="mx-auto mt-5 flex items-center justify-center gap-2.5" style={{ color: ink }}>
      {days.map((n, i) =>
        i === 2 ? (
          <span key={n} className="grid h-[64px] w-[64px] place-items-center rounded-full font-body text-[1.9rem] text-white" style={{ background: accent }}>
            {n}
            <span className="sr-only"> : jour de la célébration</span>
          </span>
        ) : (
          <span key={n} className="grid h-11 w-11 place-items-center rounded-full font-body text-[1.15rem]" style={{ background: `${accent}1f` }}>{n}</span>
        ),
      )}
    </div>
  );
}

/* Médaillon sobre : double filet ovale, monogramme en serif */
function OvalMonogram({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 160 200" className="mx-auto h-40 w-auto" aria-hidden>
      <ellipse cx="80" cy="100" rx="74" ry="94" fill="none" stroke={color} strokeWidth="0.8" />
      <ellipse cx="80" cy="100" rx="68" ry="88" fill="none" stroke={color} strokeWidth="0.5" opacity="0.6" />
      <text x="80" y="118" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontSize="58" fill={color}>J&amp;G</text>
    </svg>
  );
}

function Countdown({ target, color }: { target: Date; color: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  if (!diff) return null;
  const cells: [string, number][] = [
    ["Jours", Math.floor(diff / 86400000)],
    ["Heures", Math.floor(diff / 3600000) % 24],
    ["Min", Math.floor(diff / 60000) % 60],
    ["Sec", Math.floor(diff / 1000) % 60],
  ];
  return (
    <div className="mx-auto mt-6 grid max-w-xs grid-cols-4" aria-label="Compte à rebours">
      {cells.map(([label, value]) => (
        <div key={label}>
          <p className="font-body text-[1.7rem] tabular-nums">{String(value).padStart(2, "0")}</p>
          <p className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.16em]" style={{ color }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

/* Seule action de l'invitation : confirmer sa présence ou son absence (modifiable à tout moment). */
function PresenceConfirm({ guest, token, accent, ink, onAccent = "#fff" }: { guest: InvitationGuest; token: string; accent: string; ink: string; onAccent?: string }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(guest.status === "pending");
  const mutation = useMutation({
    mutationFn: async (status: "confirmed" | "declined") => {
      const response = await apiRequest("PATCH", `/api/invitation/${token}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invitation/${token}`] });
      setEditing(false);
    },
    onError: (error: Error) => toast({ title: "Réponse non enregistrée", description: error.message, variant: "destructive" }),
  });
  const answered = guest.status === "confirmed" || guest.status === "declined";

  if (answered && !editing) {
    return (
      <div aria-live="polite">
        <Title style={{ color: accent }}>{guest.status === "confirmed" ? "Merci !" : "Vous nous manquerez"}</Title>
        <p className="mx-auto mt-3 max-w-xs font-body text-lg leading-7">
          {guest.status === "confirmed" ? "Votre présence est confirmée. Nous avons hâte de vous retrouver." : "Votre absence est bien notée. Merci de nous avoir prévenus."}
        </p>
        <button type="button" onClick={() => setEditing(true)} className="mt-4 min-h-11 font-sans text-[11px] uppercase tracking-[0.18em] underline underline-offset-4" style={{ color: ink }}>
          Modifier ma réponse
        </button>
      </div>
    );
  }

  return (
    <div>
      <Title style={{ color: accent }}>Confirmer ma présence</Title>
      <p className="mx-auto mt-2 max-w-xs font-body text-lg leading-7">Merci de nous répondre au plus tôt.</p>
      <div className="mx-auto mt-6 grid max-w-xs gap-2.5">
        {([
          ["confirmed", "Je serai là"],
          ["declined", "Je serai absent(e)"],
        ] as const).map(([status, label]) => {
          const active = guest.status === status;
          return (
            <button
              key={status}
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(status)}
              className="min-h-12 border px-6 font-sans text-[11px] uppercase tracking-[0.18em] transition-opacity hover:opacity-85 disabled:opacity-50"
              style={status === "confirmed" || active ? { background: accent, borderColor: accent, color: onAccent } : { borderColor: `${ink}55`, color: ink }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Page de transit : une carte par date ─── */
function DateCard({ token, eventKey }: { token: string; eventKey: WeddingEventKey }) {
  const event = weddingEvents[eventKey];
  const theme = inviteThemes[eventKey];
  const date = new Date(event.iso);
  return (
    <Link href={`/invitation/${token}/${eventKey}`} className="group block focus-visible:outline-none focus-visible:ring-2" style={{ color: theme.ink }}>
      <article className="relative overflow-hidden p-6 transition-transform duration-300 group-hover:-translate-y-1 group-active:scale-[0.99]" style={{ background: `radial-gradient(120% 90% at 20% 10%, ${theme.wash[0]}, ${theme.paper} 70%)` }}>
        <Botanical src={theme.botanical} color={theme.accent} className="-bottom-4 -right-6 h-32 w-24 opacity-40" />
        <p className="font-body text-5xl leading-none opacity-30" style={{ color: theme.accent }}>{fmt(date, { day: "2-digit" })}.{fmt(date, { month: "2-digit" })}</p>
        <p className="signature -mt-4 text-4xl">Save the Date</p>
        <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.3em]">{event.label}</p>
        <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.2em] opacity-60">{event.date} · {event.time}</p>
        <p className="mt-4 font-sans text-[10px] uppercase tracking-[0.3em]" style={{ color: theme.accent }}>Ouvrir l'invitation →</p>
      </article>
    </Link>
  );
}

function TransitPage({ guest, token, dates }: { guest: InvitationGuest; token: string; dates: WeddingEventKey[] }) {
  return (
    <main className="min-h-dvh bg-[#2b2522] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={reveal} className="cream-band px-7 py-12 text-center">
          <Caps className="opacity-60">Vos invitations</Caps>
          <p className="signature mt-5 text-6xl">Jessica &amp; Geldy</p>
          <p className="mt-8 font-body text-base italic opacity-70">À l'attention de</p>
          <p className="mt-1 font-body text-2xl">{guest.firstName} {guest.lastName}</p>
          <p className="mx-auto mt-5 max-w-sm text-base leading-7 opacity-75">
            Nous avons la joie de vous convier à {dates.length > 1 ? "plusieurs temps" : "un temps"} de notre mariage. Chaque célébration a son faire-part : ouvrez-les un à un.
          </p>
        </motion.div>
        <div className="mt-4 space-y-4">
          {dates.map((key) => <DateCard key={key} token={token} eventKey={key} />)}
        </div>
      </div>
    </main>
  );
}

/* ─── Le faire-part d'une célébration ─── */
function InvitationPage({ guest, token, eventKey, settings, showBack }: { guest: InvitationGuest; token: string; eventKey: WeddingEventKey; settings: SiteSettings; showBack?: boolean }) {
  const event = weddingEvents[eventKey];
  const theme = inviteThemes[eventKey];
  const details = settings.events[eventKey];
  const program = settings.program.filter((item) => item.event === eventKey);
  const date = new Date(event.iso);
  const dd = fmt(date, { day: "2-digit" });
  const mm = fmt(date, { month: "2-digit" });
  const yy = fmt(date, { year: "2-digit" });
  const monthName = fmt(date, { month: "long" });
  const seats = guest.invitedCount || 1;
  const Icon = theme.Icon;

  const band: CSSProperties = { background: theme.band, color: theme.bandInk };
  const paper: CSSProperties = { background: theme.paper, color: theme.ink };
  // Teinte légère posée sur le papier (et non sur le fond sombre de la page).
  const tint: CSSProperties = { color: theme.ink, background: `linear-gradient(${theme.wash[0]}66, ${theme.wash[0]}66), ${theme.paper}` };
  const cardRef = useRef<HTMLElement>(null);
  const [pdfState, setPdfState] = useState<"idle" | "working" | "done" | "error">(PDF_MODE ? "working" : "idle");
  const invitationUrl = `${window.location.origin}/invitation/${token}/${eventKey}#confirmer`;
  const confirmLinkRef = useRef<HTMLAnchorElement>(null);

  // Arrivée depuis le PDF (#confirmer) : on amène directement à la réponse.
  useEffect(() => {
    if (PDF_MODE || window.location.hash !== "#confirmer") return;
    const id = window.setTimeout(() => document.getElementById("confirmer")?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
    return () => window.clearTimeout(id);
  }, []);

  /*
   * PDF vectoriel et léger : on passe par l'impression native du navigateur (« Enregistrer au format PDF »).
   * Le texte reste du texte (polices intégrées en sous-ensemble), les liens restent cliquables,
   * et la page prend la taille exacte du faire-part pour sortir en une seule page longue.
   */
  async function exportPdf() {
    const node = cardRef.current;
    if (!node) return;
    setPdfState("working");
    try {
      await document.fonts.ready;
      const width = Math.ceil(node.offsetWidth);
      const height = Math.ceil(node.offsetHeight);
      // Attendre que toutes les photos soient chargées avant d'imprimer
      await Promise.all(
        Array.from(node.querySelectorAll("img")).map((img) =>
          img.complete ? null : new Promise((resolve) => { img.addEventListener("load", resolve, { once: true }); img.addEventListener("error", resolve, { once: true }); }),
        ),
      );
      let style = document.getElementById("invitation-print-page") as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = "invitation-print-page";
        document.head.appendChild(style);
      }
      style.textContent = `@page { size: ${width}px ${height}px; margin: 0; }`;
      const previousTitle = document.title;
      // Nom proposé pour le fichier PDF
      document.title = `invitation-${event.slug}-${guest.firstName}-${guest.lastName}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
      window.print();
      document.title = previousTitle;
      setPdfState("done");
    } catch (error) {
      console.error("PDF", error);
      setPdfState("error");
    }
  }

  type Tone = { style: CSSProperties; ink: string; accent: string; onAccent: string };
  const strong: Tone = { style: band, ink: theme.bandInk, accent: theme.bandAccent, onAccent: theme.band };
  const light: Tone = { style: tint, ink: theme.ink, accent: theme.accent, onAccent: "#fff" };
  const lightSolid = mixHex(theme.paper, theme.wash[0], 0.4);
  const programItems = program.length ? program : [{ time: event.time, title: event.label, text: "" }];

  /*
   * Rythme du faire-part (inspiré des invitations « billet ») : un billet fort en ouverture,
   * une longue zone claire, le programme en bloc fort, une zone claire, puis une carte forte pour signer.
   */
  const sections: { key: string; tone: "strong" | "light"; render: (t: Tone) => ReactNode }[] = [
    {
      key: "opening",
      tone: "strong",
      render: (t) => (
        <div className="pb-6">
          <div className="relative mx-auto max-w-[360px]">
            <div className="mx-auto w-[72%]" style={{ color: t.accent }}>
              <LaceFrame className="aspect-[320/380]">
                <img src={heroMain} alt="Jessica et Geldy" className="h-full w-full object-cover object-[50%_32%]" />
              </LaceFrame>
            </div>
            <p className="pointer-events-none absolute inset-0" style={{ color: t.ink }}>
              <span className="signature absolute left-0 top-[12%] block text-[3.6rem] leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">Jessica</span>
              <span className="absolute left-1/2 top-[44%] block -translate-x-1/2 font-body text-[2.4rem] italic leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">&amp;</span>
              <span className="signature absolute bottom-[8%] right-0 block text-[3.6rem] leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">Geldy</span>
            </p>
          </div>
          <Caps className="mt-6" style={{ color: t.accent }}>{event.label}</Caps>
          <Caps className="mt-1 opacity-90">Kinshasa, Congo</Caps>
          <LaceEdge light={lightSolid} strong={theme.band} />
        </div>
      ),
    },
    {
      key: "guest",
      tone: "light",
      render: (t) => (
        <>
          <Title style={{ color: t.accent }}>Cher(e) {guest.firstName.trim()},</Title>
          <p className="mx-auto mt-4 max-w-sm font-body text-[1.15rem] leading-8">{settings.invitationText}</p>
          <p className="mx-auto mt-3 max-w-sm font-body text-[1.15rem] leading-8">
            Nous serons heureux de vous accueillir {details.venue && details.venue !== "Lieu à confirmer" ? <>au {details.venue}, </> : null}{details.address}.
          </p>
        </>
      ),
    },
    {
      key: "calendar",
      tone: "light",
      render: (t) => (
        <>
          <div className="mb-8 grid grid-cols-3 gap-2" aria-hidden>
            {[gallery1, gallery2, gallery4].map((src) => (
              <img key={src} src={src} alt="" className="aspect-[4/5] w-full object-cover grayscale" />
            ))}
          </div>
          <Caps style={{ color: t.accent }}>Ce jour-là</Caps>
          <DayStrip date={date} accent={t.accent} ink={t.ink} />
          <p className="mt-4 font-body text-[1.5rem] uppercase tracking-[0.06em]">{monthName} {fmt(date, { year: "numeric" })}</p>
          <Caps className="mt-1 opacity-85">{fmt(date, { weekday: "long" })} · {event.time}</Caps>
          <Countdown target={date} color={t.accent} />
        </>
      ),
    },
    {
      key: "program",
      tone: "strong",
      render: (t) => (
        <>
          <img src={gallery3} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[50%_40%] grayscale" />
          <span aria-hidden className="absolute inset-0" style={{ background: theme.band, opacity: 0.72 }} />
          <div className="relative">
          <Title style={{ color: t.accent }}>Programme</Title>
          {details.venue && !/à confirmer/i.test(details.venue) && (
            <p className="mt-2 font-body text-[1.1rem] leading-6">
              {details.venue}
              {details.address && <span className="block text-[0.95rem] opacity-85">{details.address}</span>}
            </p>
          )}
          <ol className="relative mx-auto mt-8 max-w-[300px] text-left">
            <span aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px" style={{ background: `${t.ink}55` }} />
            {programItems.map((item, index) => (
              <li key={`${item.time}-${index}`} className="relative pb-6 pl-8 last:pb-0">
                <span aria-hidden className="absolute left-0 top-[0.45rem] h-[15px] w-[15px] rounded-full border" style={{ borderColor: t.accent, background: theme.band }} />
                <p className="font-body text-[1.5rem] italic leading-none" style={{ color: t.accent }}>{item.time}</p>
                <Caps className="mt-1.5">{item.title}</Caps>
                {item.text && <p className="mt-1 font-body text-base leading-6 opacity-90">{item.text}</p>}
              </li>
            ))}
          </ol>
          </div>
        </>
      ),
    },
    {
      key: "dress",
      tone: "light",
      render: (t) => (
        <>
          <Title style={{ color: t.accent }}>Dress code</Title>
          <p className="mx-auto mt-3 max-w-xs font-body text-[1.15rem] leading-7">Nous serons ravis si vos tenues accompagnent notre palette&nbsp;: {event.theme.toLowerCase()}.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {event.palette.map((color, index) => (
              <div key={color} className="flex w-14 flex-col items-center gap-2">
                <span className="h-10 w-10 rounded-full ring-1 ring-black/10" style={{ background: color }} />
                <span className="font-sans text-[10px] uppercase leading-3 tracking-[0.1em] opacity-85">{event.colorNames[index]}</span>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-xs font-body text-base italic leading-7 opacity-90">{details.note || event.themeNote}</p>
        </>
      ),
    },
    ...(settings.contribution.enabled
      ? [{
          key: "gifts",
          tone: "light" as const,
          render: (t: Tone) => (
            <>
              <Title style={{ color: t.accent }}>Vos attentions</Title>
              <p className="mx-auto mt-3 max-w-xs font-body text-[1.15rem] leading-7">{settings.contribution.title}</p>
              <p className="mx-auto mt-2 max-w-xs font-body text-base leading-7 opacity-90">{settings.contribution.message}</p>
            </>
          ),
        }]
      : []),
    {
      key: "confirm",
      tone: "light",
      render: (t) =>
        PDF_MODE ? (
          <div>
            <Title style={{ color: t.accent }}>Confirmer ma présence</Title>
            <p className="mx-auto mt-2 max-w-xs font-body text-lg leading-7">Merci de nous répondre sur votre invitation en ligne.</p>
            <a
              ref={confirmLinkRef}
              href={invitationUrl}
              className="mx-auto mt-6 flex min-h-12 max-w-xs items-center justify-center px-6 font-sans text-[11px] uppercase tracking-[0.18em]"
              style={{ background: t.accent, color: t.onAccent }}
            >
              Confirmer ou modifier
            </a>
          </div>
        ) : (
          <PresenceConfirm guest={guest} token={token} accent={t.accent} ink={t.ink} onAccent={t.onAccent} />
        ),
    },
    {
      key: "closing",
      tone: "light",
      render: () => (
        <div className="rounded-[22px] px-6 py-10" style={{ background: theme.band, color: theme.bandInk }}>
          <p className="font-body text-[1.6rem] italic leading-snug">Avec impatience de vous retrouver</p>
          <p className="signature mt-5 text-[2.8rem] leading-none" style={{ color: theme.bandAccent }}>Jessica &amp; Geldy</p>
          <Caps className="mt-3 opacity-85">{dd} / {mm} / 20{yy} · Kinshasa</Caps>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (!PDF_MODE) return;
    const id = window.setTimeout(() => void exportPdf(), 600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={`min-h-dvh overflow-x-hidden bg-[#2b2522] sm:px-5 sm:py-10 print:min-h-0 print:bg-transparent print:p-0 ${PDF_MODE ? "invitation-print" : ""}`}>
      <div className="mx-auto w-full max-w-[480px]">
        {PDF_MODE && (
          <div className="sticky top-0 z-20 mx-auto mb-4 flex items-center justify-between gap-3 bg-[#2b2522] px-5 py-3 font-sans text-[12px] text-white/85 print:hidden sm:px-0">
            <span aria-live="polite">
              {pdfState === "working" ? "Préparation du PDF…" : pdfState === "error" ? "Le PDF n'a pas pu être préparé." : "Choisissez « Enregistrer au format PDF » dans la fenêtre d'impression."}
            </span>
            <button type="button" disabled={pdfState === "working"} onClick={() => void exportPdf()} className="h-9 rounded-full bg-white px-4 text-[12px] font-medium text-[#2b2522] disabled:opacity-50">
              Enregistrer en PDF
            </button>
          </div>
        )}

        {showBack && !PDF_MODE && (
          <Link href={`/invitation/${token}`} className="mx-5 mb-4 mt-4 inline-flex min-h-11 items-center gap-2 font-sans text-[10px] uppercase tracking-[0.24em] text-white/75 sm:mx-0 sm:mt-0">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Toutes mes invitations
          </Link>
        )}

        <article ref={cardRef} className={`shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] print:shadow-none ${PDF_MODE ? "w-[480px] max-w-none" : ""}`} style={{ color: theme.ink }}>

          {sections.map((section, index) => {
            const tone = section.tone === "strong" ? strong : light;
            const previous = sections[index - 1];
            // Dans une même zone claire, les sections s'enchaînent sans rupture, juste un peu d'air.
            const continues = previous && previous.tone === section.tone;
            const spacing = index === 0 ? "!pb-0 pt-12" : continues ? "pt-2" : "pt-12";
            const closing = section.key === "closing" ? "!px-5 !pb-5 !pt-4" : "";
            return (
              <Panel key={section.key} id={section.key === "confirm" ? "confirmer" : undefined} style={tone.style} className={`${spacing} ${closing}`}>
                {section.render(tone)}
              </Panel>
            );
          })}
        </article>
      </div>
    </main>
  );
}

export default function Invitation() {
  const [, dateParams] = useRoute("/invitation/:token/:date");
  const [, baseParams] = useRoute("/invitation/:token");
  const token = dateParams?.token ?? baseParams?.token;
  const dateParam = dateParams?.date as WeddingEventKey | undefined;

  const { data: guest, isLoading, error } = useQuery<InvitationGuest>({
    queryKey: [`/api/invitation/${token}`],
    enabled: !!token,
  });
  const { data: settings = defaultSiteSettings } = useQuery<SiteSettings>({ queryKey: ["/api/site-settings"] });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-[#2b2522] p-6">
        <Skeleton className="h-10 w-64 rounded-none" />
        <Skeleton className="h-[540px] w-full max-w-md rounded-none" />
      </div>
    );
  }

  if (error || !guest || !token) {
    return (
      <div className="cream-band flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
        <p className="signature text-6xl">{JessicaGeldi.brand}</p>
        <h1 className="font-body text-2xl">Invitation introuvable</h1>
        <p className="max-w-sm text-base leading-7 opacity-70">Ce lien semble invalide ou a expiré. Veuillez contacter les mariés directement.</p>
      </div>
    );
  }

  const dates = getEventKeys(guest.invitedCeremonyChoice || guest.ceremonyChoice);
  const requested = dateParam && eventKeys.includes(dateParam) ? dateParam : null;

  if (!requested || !dates.includes(requested)) {
    if (dates.length === 1) return <InvitationPage guest={guest} token={token} eventKey={dates[0]} settings={settings} />;
    return <TransitPage guest={guest} token={token} dates={dates} />;
  }

  return <InvitationPage guest={guest} token={token} eventKey={requested} settings={settings} showBack={dates.length > 1} />;
}
