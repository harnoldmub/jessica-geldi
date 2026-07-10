import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Check, X, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import { type RsvpResponse } from "@shared/schema";
import { laeticiaMaxime } from "@shared/laeticiaMaxime";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import logoBlack from "../../images/logo-lm-black.png";
import logoWhite from "../../images/logo-lm-white.png";
import civilBlessingPortraitImg from "../../images/couple-civil-blessing-portrait.jpg";
import redStaircaseFullImg from "../../images/couple-red-staircase-full.jpg";
import redPianoWideImg from "../../images/couple-red-piano-wide.jpg";

type InvitationGuest = RsvpResponse & { invitationUrl: string };

const reveal = { duration: 1.0, ease: [0.22, 1, 0.36, 1] as const };

/* Dates clés */
const SAT_DATE = new Date("2026-08-27T10:00:00+02:00");
const SUN_DATE = new Date("2026-08-29T18:00:00+02:00");
// Une fois le 27 août terminé, les invités des 2 dates basculent sur le 29 août.
const SAT_OVER = new Date("2026-08-28T00:00:00+02:00");

/* Palettes — deux ambiances distinctes */
const SAT = {
  bg: "#f8f1e8",
  panel: "rgba(255,255,255,0.72)",
  ink: "#281118",
  sub: "#7b4d4f",
  accent: "#7d1f30",
  line: "rgba(125,31,48,0.22)",
};
const SUN = {
  bg: "#070707",
  panel: "rgba(255,255,255,0.08)",
  ink: "#f6f0e6",
  sub: "#c7b99a",
  accent: "#c7b99a",
  line: "rgba(215,197,158,0.28)",
  dark: "#111111",
};
type Theme = typeof SAT;

/* ─── Ornement ────────────────────────────────────────────── */
function OrnamentRule({ color, opacity = 0.6 }: { color: string; opacity?: number }) {
  return (
    <div className="flex items-center justify-center gap-4" style={{ opacity }}>
      <span className="h-px w-16 flex-1" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      <span className="text-xs" style={{ color }}>✦</span>
      <span className="h-px w-16 flex-1" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  );
}

/* ─── Motif alliances (anneaux entrelacés animés) ─────────── */
function RingsMotif({ color }: { color: string }) {
  return (
    <motion.svg
      viewBox="0 0 130 90"
      className="mx-auto h-16 w-28"
      fill="none"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={reveal}
      aria-hidden
    >
      <motion.g
        animate={{ rotate: [0, 3.5, 0, -3.5, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "65px 50px" }}
      >
        <circle cx="52" cy="52" r="24" stroke={color} strokeWidth="2.4" />
        <circle cx="80" cy="52" r="24" stroke={color} strokeWidth="2.4" opacity="0.85" />
        {/* diamant sur l'anneau */}
        <path d="M80 12 l7 9 -7 10 -7 -10 z" fill={color} />
        <motion.circle
          cx="80" cy="17" r="1.6" fill="#fff"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.g>
    </motion.svg>
  );
}

/* ─── Compte à rebours ────────────────────────────────────── */
function Countdown({ target, theme }: { target: Date; theme: Theme }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const cells: [string, number][] = [
    ["Jours", Math.floor(diff / 86400000)],
    ["Heures", Math.floor(diff / 3600000) % 24],
    ["Min", Math.floor(diff / 60000) % 60],
    ["Sec", Math.floor(diff / 1000) % 60],
  ];
  return (
    <div className="flex justify-center gap-2.5">
      {cells.map(([label, value]) => (
        <div
          key={label}
          className="flex w-16 flex-col items-center rounded-xl py-3"
          style={{ background: theme.panel, border: `1px solid ${theme.line}` }}
        >
          <span className="font-serif text-2xl leading-none" style={{ color: theme.ink }}>
            {String(value).padStart(2, "0")}
          </span>
          <span className="mt-1.5 text-[8px] uppercase tracking-[0.28em]" style={{ color: theme.sub }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Ligne d'info (programme) ────────────────────────────── */
function TimeRow({
  icon: Icon,
  time,
  title,
  place,
  theme,
  delay = 0,
}: {
  icon: React.ElementType;
  time: string;
  title: string;
  place?: string;
  theme: Theme;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ ...reveal, delay }}
      className="flex items-start gap-4 px-5 py-4"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.4} style={{ color: theme.accent }} />
      <div>
        <p className="text-[9px] uppercase tracking-[0.4em]" style={{ color: theme.sub }}>
          {time}
        </p>
        <p className="mt-1 font-serif text-base" style={{ color: theme.ink }}>
          {title}
        </p>
        {place && (
          <p className="text-xs" style={{ color: `${theme.sub}` }}>
            {place}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Pastilles dress code ────────────────────────────────── */
function DressSwatches({ colors, names, theme }: { colors: string[]; names: string[]; theme: Theme }) {
  return (
    <div className="mt-5 flex flex-wrap items-start justify-center gap-4">
      {colors.map((color, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <span
            className="h-9 w-9 rounded-full shadow-md"
            style={{ backgroundColor: color, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }}
          />
          <span className="text-[8px] uppercase tracking-[0.24em]" style={{ color: theme.sub }}>
            {names[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function InvitationVisual({ theme, compact = false, image }: { theme: Theme; compact?: boolean; image: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden ${compact ? "aspect-[5/4]" : "aspect-[3/4]"}`}
      style={{ background: `linear-gradient(145deg, ${theme.ink} 0%, ${theme.accent}22 48%, ${theme.bg} 100%)` }}
    >
      <img src={image} alt={laeticiaMaxime.title} className="absolute inset-0 h-full w-full object-cover" />
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 1.5, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle at 26% 24%, rgba(255,255,255,0.16), transparent 24%), radial-gradient(circle at 78% 74%, rgba(125,31,48,0.18), transparent 30%)",
        }}
      />
      <div className="absolute inset-5 rounded-[1.5rem] border border-white/18" />
      <div className="absolute inset-10 rounded-full border border-white/16" />
      <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-white/42 to-transparent" />
      <div className="absolute inset-y-8 left-1/2 w-px bg-gradient-to-b from-transparent via-white/26 to-transparent" />
    </div>
  );
}

/* ─── RSVP simplifié : confirmer / décliner ───────────────── */
function SimpleRsvp({ token, status, theme }: { token: string; status: string; theme: Theme }) {
  const { toast } = useToast();
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState<null | "confirmed" | "declined">(null);

  async function setStatus(next: "confirmed" | "declined") {
    if (saving) return;
    setSaving(next);
    try {
      const res = await fetch(`/api/invitation/${token}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Une erreur est survenue.");
      }
      setCurrent(next);
      queryClient.invalidateQueries({ queryKey: [`/api/invitation/${token}`] });
      toast({
        title: next === "confirmed" ? "Présence confirmée" : "Réponse enregistrée",
        description:
          next === "confirmed"
            ? "Merci, nous avons hâte de vous accueillir."
            : "Votre réponse a bien été prise en compte. Vous pouvez la modifier à tout moment.",
      });
    } catch (e: any) {
      toast({ title: "Oups", description: e.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  const confirmed = current === "confirmed";
  const declined = current === "declined";

  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-[0.5em]" style={{ color: theme.accent }}>
        Votre réponse
      </p>
      <h3 className="mt-3 font-serif text-2xl" style={{ color: theme.ink }}>
        Serez-vous des nôtres ?
      </h3>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setStatus("confirmed")}
          disabled={!!saving}
          className="flex items-center justify-center gap-2 rounded-full py-4 text-[11px] uppercase tracking-[0.34em] transition-all disabled:opacity-60"
          style={
            confirmed
              ? { background: theme.accent, color: "#fff" }
              : { background: "transparent", color: theme.ink, border: `1px solid ${theme.accent}` }
          }
        >
          {saving === "confirmed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {confirmed ? "Je serai présent(e) ✓" : "Je serai présent(e)"}
        </button>

        <button
          type="button"
          onClick={() => setStatus("declined")}
          disabled={!!saving}
          className="flex items-center justify-center gap-2 rounded-full py-4 text-[11px] uppercase tracking-[0.34em] transition-all disabled:opacity-60"
          style={
            declined
              ? { background: theme.ink, color: "#fff" }
              : { background: "transparent", color: theme.sub, border: `1px solid ${theme.line}` }
          }
        >
          {saving === "declined" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          {declined ? "Je ne pourrai pas venir ✓" : "Je ne pourrai pas venir"}
        </button>
      </div>

      <p className="mt-4 text-[10px] tracking-wide" style={{ color: `${theme.sub}` }}>
        {confirmed
          ? "Présence confirmée — merci ! Vous pouvez modifier votre réponse ci-dessus."
          : declined
            ? "Réponse enregistrée. Vous pouvez la modifier ci-dessus si cela change."
            : "Un simple clic suffit. Vous pourrez modifier votre réponse à tout moment."}
      </p>
    </div>
  );
}

/* ─── Hero commun (photo + noms + date + rebours) ─────────── */
function InvitationHero({
  guest,
  dateLabel,
  target,
  theme,
  image,
  logo,
}: {
  guest: InvitationGuest;
  dateLabel: string;
  target: Date;
  theme: Theme;
  image: string;
  logo: string;
}) {
  return (
    <header className="px-4 pt-5">
      <motion.img
        src={logo}
        alt="Logo Laeticia & Maxime"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reveal}
        className="mx-auto mb-4 h-16 w-16 object-contain"
      />
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reveal}
        className="text-center text-[9px] uppercase tracking-[0.6em]"
        style={{ color: theme.accent }}
      >
        Save the date
      </motion.p>

      <motion.figure
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...reveal, delay: 0.1 }}
        className="relative mt-5 overflow-hidden rounded-[2rem] shadow-2xl"
        style={{ border: `1px solid ${theme.line}` }}
      >
        <InvitationVisual theme={theme} image={image} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,12,6,0.78) 0%, rgba(20,12,6,0.05) 45%, transparent 70%)" }} />
        <figcaption className="absolute inset-x-0 bottom-0 p-7 text-center text-white">
          <p className="text-[10px] uppercase tracking-[0.48em] text-white/75">{dateLabel}</p>
          <p className="mt-3 font-script text-6xl leading-none">{laeticiaMaxime.title}</p>
        </figcaption>
      </motion.figure>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...reveal, delay: 0.25 }}
        className="mt-6"
      >
        <p className="text-center font-serif text-base italic" style={{ color: theme.sub }}>
          À l'attention de
        </p>
        <p className="mt-1 text-center font-serif text-2xl" style={{ color: theme.ink }}>
          {guest.firstName} {guest.lastName}
        </p>
        <p className="mt-1 text-center text-[10px] uppercase tracking-[0.4em]" style={{ color: theme.accent }}>
          {(guest.guestCount || 1) === 1 ? "Seul(e) · 1 personne" : `En couple · ${guest.guestCount} personnes`}
        </p>
      </motion.div>

      <div className="mt-8">
        <Countdown target={target} theme={theme} />
      </div>
    </header>
  );
}

/* ─── Retour vers la page de choix ────────────────────────── */
function BackToChoice({ token, theme }: { token: string; theme: Theme }) {
  return (
    <div className="px-6 pt-6">
      <Link
        href={`/invitation/${token}`}
        className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.34em]"
        style={{ color: theme.accent }}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
        Choisir une autre date
      </Link>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE DE TRANSIT — choix de la date
   ════════════════════════════════════════════════════════════ */
function DateCard({
  href,
  dateLabel,
  title,
  subtitle,
  theme,
  image,
  past,
}: {
  href: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  theme: Theme;
  image: string;
  past?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <motion.figure
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={reveal}
        className="relative cursor-pointer overflow-hidden rounded-[1.75rem] shadow-xl transition-transform duration-500 group-hover:scale-[1.015]"
        style={{ border: `1px solid ${theme.line}` }}
      >
        <InvitationVisual theme={theme} compact image={image} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,12,6,0.82) 0%, rgba(20,12,6,0.15) 55%, rgba(20,12,6,0.05) 100%)" }} />
        {past && (
          <span className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-[8px] uppercase tracking-[0.3em] text-white/90">
            Passé
          </span>
        )}
        <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white">
          <p className="text-[10px] uppercase tracking-[0.46em] text-white/75">{dateLabel}</p>
          <p className="mt-1.5 font-serif text-2xl leading-tight">{title}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em]" style={{ color: "#fff" }}>
            {subtitle}
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.8} />
          </p>
        </figcaption>
      </motion.figure>
    </Link>
  );
}

type InvitationDateKey = "civil" | "soiree";

function TransitPage({ guest, token, dates }: { guest: InvitationGuest; token: string; dates: InvitationDateKey[] }) {
  const theme = SAT;
  const saturdayOver = Date.now() >= SAT_OVER.getTime();
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: theme.bg, color: theme.ink }}>
      <div className="mx-auto w-full max-w-md px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={reveal} className="text-center">
          <img src={logoBlack} alt="Logo Laeticia & Maxime" className="mx-auto mb-5 h-16 w-16 object-contain" />
          <p className="text-[9px] uppercase tracking-[0.6em]" style={{ color: theme.accent }}>
            Invitation officielle
          </p>
          <p className="mt-6 font-script text-6xl leading-none" style={{ color: theme.ink }}>
            {laeticiaMaxime.title}
          </p>
          <p className="mt-5 font-serif text-base italic" style={{ color: theme.sub }}>
            À l'attention de
          </p>
          <p className="mt-1 font-serif text-2xl" style={{ color: theme.ink }}>
            {guest.firstName} {guest.lastName}
          </p>
        </motion.div>

        <p className="mt-9 text-center text-sm leading-7" style={{ color: theme.sub }}>
          {dates.length > 1
            ? "Vous êtes convié(e) aux deux célébrations. Choisissez la date à découvrir."
            : "Découvrez votre invitation."}
        </p>

        <div className="mt-8 space-y-5">
          {dates.includes("civil") && (
            <DateCard
              href={`/invitation/${token}/civil`}
              dateLabel={laeticiaMaxime.date.display}
              title="Civil & bénédiction"
              subtitle="Voir l'invitation"
              theme={SAT}
              image={civilBlessingPortraitImg}
              past={saturdayOver}
            />
          )}
          {dates.includes("soiree") && (
            <DateCard
              href={`/invitation/${token}/soiree`}
              dateLabel={laeticiaMaxime.secondDate.display}
              title="Soirée dansante"
              subtitle="Voir l'invitation"
              theme={SUN}
              image={redStaircaseFullImg}
            />
          )}
        </div>

        <footer className="pt-12 text-center">
          <OrnamentRule color={theme.accent} opacity={0.45} />
          <p className="mt-5 text-[10px] uppercase tracking-[0.5em]" style={{ color: theme.sub }}>
            Avec joie, nous vous attendons
          </p>
        </footer>
      </div>
    </main>
  );
}

/* ════════════════════════════════════════════════════════════
   INVITATION — 27 août (Civil & bénédiction) · à l'anglaise
   ════════════════════════════════════════════════════════════ */
function SaturdayInvitation({ guest, token, showBack }: { guest: InvitationGuest; token: string; showBack?: boolean }) {
  const theme = SAT;

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: theme.bg, color: theme.ink }}>
      <div className="mx-auto w-full max-w-md pb-20">
        {showBack && <BackToChoice token={token} theme={theme} />}
        <InvitationHero
          guest={guest}
          dateLabel={laeticiaMaxime.date.display}
          target={SAT_DATE}
          theme={theme}
          image={civilBlessingPortraitImg}
          logo={logoBlack}
        />

        {/* Intro */}
        <section className="px-7 pt-14 text-center">
          <RingsMotif color={theme.accent} />
          <h2 className="mt-5 font-serif text-3xl" style={{ color: theme.ink }}>
            Civil &amp; bénédiction
          </h2>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-7" style={{ color: theme.sub }}>
            Une journée élégante, dans l'esprit à l'anglaise, pour célébrer notre union civile et notre bénédiction nuptiale.
          </p>
        </section>

        {/* RSVP */}
        <section className="px-6 pt-10">
          <div className="rounded-2xl p-8" style={{ background: theme.panel, border: `1px solid ${theme.line}` }}>
            <SimpleRsvp token={token} status={guest.status} theme={theme} />
          </div>
        </section>

        {/* Programme */}
        <section className="px-6 pt-12">
          <p className="text-center text-[9px] uppercase tracking-[0.5em]" style={{ color: theme.accent }}>
            Le programme
          </p>
          <div
            className="mt-5 divide-y overflow-hidden rounded-2xl"
            style={{ background: theme.panel, border: `1px solid ${theme.line}`, borderColor: theme.line }}
          >
            <TimeRow icon={Clock} time="À confirmer" title="Mariage civil" place="Saphir Events" theme={theme} />
            <TimeRow icon={Clock} time="À confirmer" title="Bénédiction nuptiale" place="Saphir Events" theme={theme} delay={0.06} />
            <TimeRow icon={MapPin} time="Lieu" title="Avenue Uvira 1054, croisement Batetela" place="En face du parking Pullman, Gombe / Kinshasa" theme={theme} delay={0.12} />
          </div>
        </section>

        {/* Dress code */}
        <section className="px-6 pt-12 text-center">
          <p className="text-[9px] uppercase tracking-[0.5em]" style={{ color: theme.accent }}>Dress code</p>
          <h3 className="mt-3 font-serif text-2xl italic" style={{ color: theme.ink }}>{laeticiaMaxime.dresscode.blessing.theme}</h3>
          <DressSwatches colors={laeticiaMaxime.dresscode.blessing.colors} names={laeticiaMaxime.dresscode.blessing.colorNames} theme={theme} />
        </section>

        {/* Closing */}
        <footer className="px-6 pt-14 text-center">
          <OrnamentRule color={theme.accent} opacity={0.5} />
          <img src={logoBlack} alt="Logo Laeticia & Maxime" className="mx-auto mt-7 h-16 w-16 object-contain" />
          <p className="mt-7 font-script text-5xl" style={{ color: theme.ink }}>{laeticiaMaxime.brand}</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.5em]" style={{ color: theme.sub }}>
            Avec joie, nous vous attendons
          </p>
        </footer>
      </div>
    </main>
  );
}

/* ════════════════════════════════════════════════════════════
   INVITATION — 29 août (Soirée dansante) · noir
   ════════════════════════════════════════════════════════════ */
function SundayInvitation({ guest, token, showBack }: { guest: InvitationGuest; token: string; showBack?: boolean }) {
  const theme = SUN;

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: theme.bg, color: theme.ink }}>
      <div className="mx-auto w-full max-w-md pb-20">
        {showBack && <BackToChoice token={token} theme={theme} />}
        <InvitationHero
          guest={guest}
          dateLabel={laeticiaMaxime.secondDate.display}
          target={SUN_DATE}
          theme={theme}
          image={redStaircaseFullImg}
          logo={logoWhite}
        />

        {/* Intro — style symétrique, double filet champagne */}
        <section className="px-7 pt-14 text-center">
          <RingsMotif color={theme.accent} />
          <div className="mx-auto mt-5 max-w-[16rem]">
            <div className="h-px w-full" style={{ background: theme.line }} />
            <h2 className="my-3 font-serif text-3xl tracking-wide" style={{ color: theme.ink }}>
              Soirée dansante
            </h2>
            <div className="h-px w-full" style={{ background: theme.line }} />
          </div>
          <p className="mx-auto mt-5 max-w-xs text-sm leading-7" style={{ color: theme.sub }}>
            Une soirée chic et festive pour prolonger la célébration, danser ensemble et célébrer l'amour en Full Black Chic.
          </p>
        </section>

        {/* RSVP — bloc sombre pour contraster avec le 29 août */}
        <section className="px-6 pt-10">
          <div className="rounded-2xl p-8" style={{ background: theme.dark }}>
            <SimpleRsvp
              token={token}
              status={guest.status}
              theme={{ ...theme, ink: "#f4ecd8", sub: "#cdb98a", panel: "transparent" }}
            />
          </div>
        </section>

        {/* Programme */}
        <section className="px-6 pt-12">
          <p className="text-center text-[9px] uppercase tracking-[0.5em]" style={{ color: theme.accent }}>
            Le déroulé
          </p>
          <div
            className="mt-5 divide-y overflow-hidden rounded-2xl"
            style={{ background: theme.panel, border: `1px solid ${theme.line}`, borderColor: theme.line }}
          >
            <TimeRow icon={CalendarDays} time="Samedi 29 août 2026" title="Soirée dansante" place="Salle Legacy" theme={theme} />
            <TimeRow icon={Clock} time="Horaire à confirmer" title="Entrée des mariés" place="Thème Full Black Chic" theme={theme} delay={0.06} />
            <TimeRow icon={MapPin} time="Lieu" title="Salle Legacy" place="Parking Galerie La Fontaine, Gombe / Kinshasa" theme={theme} delay={0.12} />
          </div>
        </section>

        {/* Dress code */}
        <section className="px-6 pt-12 text-center">
          <p className="text-[9px] uppercase tracking-[0.5em]" style={{ color: theme.accent }}>Dress code</p>
          <h3 className="mt-3 font-serif text-2xl italic" style={{ color: theme.ink }}>{laeticiaMaxime.dresscode.evening.theme}</h3>
          <DressSwatches colors={laeticiaMaxime.dresscode.evening.colors} names={laeticiaMaxime.dresscode.evening.colorNames} theme={theme} />
        </section>

        <section className="px-6 pt-12">
          <figure className="relative overflow-hidden rounded-[1.75rem] shadow-xl" style={{ border: `1px solid ${theme.line}` }}>
            <img src={redPianoWideImg} alt="Laeticia & Maxime" className="aspect-[4/5] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <figcaption className="absolute bottom-5 left-5 right-5 text-center">
              <p className="text-[9px] uppercase tracking-[0.42em] text-white/72">Rich red · élégance</p>
            </figcaption>
          </figure>
        </section>

        {/* Versets */}
        <section className="px-8 pt-14 text-center">
          <p className="font-serif text-lg italic leading-8" style={{ color: `${theme.ink}cc` }}>
            « Ainsi ils ne sont plus deux, mais ils ne font qu'une seule chair. »
          </p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.45em]" style={{ color: theme.sub }}>
            — Matthieu 19 : 6
          </p>
        </section>

        {/* Closing */}
        <footer className="px-6 pt-14 text-center">
          <OrnamentRule color={theme.accent} opacity={0.5} />
          <img src={logoWhite} alt="Logo Laeticia & Maxime" className="mx-auto mt-7 h-16 w-16 object-contain" />
          <p className="mt-7 font-script text-5xl" style={{ color: theme.ink }}>{laeticiaMaxime.brand}</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.5em]" style={{ color: theme.sub }}>
            Avec amour, nous vous attendons
          </p>
        </footer>
      </div>
    </main>
  );
}

/* ─── Composant principal ─────────────────────────────────── */
export default function Invitation() {
  const [, dateParams] = useRoute("/invitation/:token/:date");
  const [, baseParams] = useRoute("/invitation/:token");
  const token = dateParams?.token ?? baseParams?.token;
  const dateParam = dateParams?.date;

  const { data: guest, isLoading, error } = useQuery<InvitationGuest>({
    queryKey: [`/api/invitation/${token}`],
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6" style={{ background: SAT.bg }}>
        <Skeleton className="h-10 w-64 rounded-none" />
        <Skeleton className="h-[460px] w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (error || !guest || !token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-7 p-6 text-center" style={{ background: SAT.bg, color: SAT.ink }}>
        <OrnamentRule color={SAT.accent} opacity={0.4} />
        <img src={logoBlack} alt="Logo Laeticia & Maxime" className="h-20 w-20 object-contain" />
        <p className="font-script text-6xl" style={{ color: SAT.ink }}>{laeticiaMaxime.brand}</p>
        <h1 className="font-serif text-2xl">Invitation introuvable</h1>
        <p className="text-[10px] uppercase tracking-[0.42em] max-w-xs" style={{ color: SAT.sub }}>
          Ce lien semble invalide ou a expiré. Veuillez contacter les mariés directement.
        </p>
        <OrnamentRule color={SAT.accent} opacity={0.4} />
      </div>
    );
  }

  // Dates auxquelles l'invité est convié.
  const isSundayGuest = guest.ceremonyChoice === "evening";
  const isSaturdayGuest = guest.ceremonyChoice === "civil";
  const dates: InvitationDateKey[] = isSaturdayGuest
    ? ["civil"]
    : isSundayGuest
      ? ["soiree"]
      : ["civil", "soiree"]; // both ou non défini

  const multiple = dates.length > 1;
  const requested = dateParam === "civil" || dateParam === "soiree" ? dateParam : null;

  // Page de transit : choix de la date. Affichée quand aucune date valide n'est
  // demandée. Pour un invité d'une seule date, on l'envoie directement à la sienne.
  if (!requested || !dates.includes(requested)) {
    if (!multiple) {
      return dates[0] === "soiree" ? (
        <SundayInvitation guest={guest} token={token} />
      ) : (
        <SaturdayInvitation guest={guest} token={token} />
      );
    }
    return <TransitPage guest={guest} token={token} dates={dates} />;
  }

  return requested === "soiree" ? (
    <SundayInvitation guest={guest} token={token} showBack={multiple} />
  ) : (
    <SaturdayInvitation guest={guest} token={token} showBack={multiple} />
  );
}
