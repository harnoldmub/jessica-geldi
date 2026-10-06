import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Mail } from "lucide-react";
import { type RsvpResponse } from "@shared/schema";
import { getEventKeys, JessicaGeldi, weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";
import { defaultSiteSettings, type SiteSettings } from "@shared/siteSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { DrumIcon, GlassesIcon, RingsIcon, Wreath } from "@/components/Stationery";

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
/* Bord festonné : une pastille par feston sur la marge, le centre reste plein. */
const scallopMask = "radial-gradient(circle, #000 7px, transparent 7.5px) 0 0 / 16px 16px round, linear-gradient(#000 0 0) content-box";
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

function Panel({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={reveal}
      className={`relative overflow-hidden px-7 py-14 text-center sm:px-12 ${className}`}
      style={style}
    >
      {children}
    </motion.section>
  );
}

function Caps({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <p className={`font-sans text-[10px] uppercase leading-5 tracking-[0.28em] ${className}`} style={style}>{children}</p>;
}

function OutlineLink({ href, children, color }: { href: string; children: ReactNode; color: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="mt-7 inline-flex min-h-11 items-center justify-center border px-8 font-sans text-[10px] uppercase tracking-[0.3em] transition-opacity hover:opacity-70" style={{ borderColor: color, color }}>
      {children}
    </a>
  );
}

/* Calendrier du mois, jour de la célébration marqué d'un cœur */
function MonthCalendar({ date, accent, ink }: { date: Date; accent: string; ink: string }) {
  const year = Number(fmt(date, { year: "numeric" }));
  const month = Number(fmt(date, { month: "numeric" })) - 1;
  const day = Number(fmt(date, { day: "numeric" }));
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // lundi = 0
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [...Array.from({ length: firstWeekday }, () => 0), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="mx-auto mt-6 max-w-[300px]" style={{ color: ink }}>
      <div className="grid grid-cols-7 gap-y-3 font-sans text-[10px] uppercase tracking-[0.1em] opacity-60">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-y-2 font-serif text-[15px]">
        {cells.map((n, i) => (
          <span key={i} className="relative grid h-8 place-items-center">
            {n === day ? (
              <>
                <Heart className="absolute h-8 w-8" style={{ color: accent, fill: accent }} strokeWidth={0} aria-hidden />
                <span className="relative text-white">{n}</span>
                <span className="sr-only">jour de la célébration</span>
              </>
            ) : n ? n : ""}
          </span>
        ))}
      </div>
    </div>
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
    <div className="mx-auto mt-8 grid max-w-xs grid-cols-4" aria-label="Compte à rebours">
      {cells.map(([label, value]) => (
        <div key={label}>
          <p className="font-serif text-2xl tabular-nums">{String(value).padStart(2, "0")}</p>
          <p className="mt-1 font-sans text-[8px] uppercase tracking-[0.2em]" style={{ color }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

/* Seule action de l'invitation : confirmer sa présence ou son absence (modifiable à tout moment). */
function PresenceConfirm({ guest, token, accent, ink }: { guest: InvitationGuest; token: string; accent: string; ink: string }) {
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
        <h2 className="signature text-5xl" style={{ color: accent }}>{guest.status === "confirmed" ? "Merci !" : "Vous nous manquerez"}</h2>
        <Caps className="mx-auto mt-5 max-w-xs">
          {guest.status === "confirmed" ? "Votre présence est confirmée. Nous avons hâte de vous retrouver." : "Votre absence est bien notée. Merci de nous avoir prévenus."}
        </Caps>
        <button type="button" onClick={() => setEditing(true)} className="mt-6 min-h-11 font-sans text-[10px] uppercase tracking-[0.28em] underline underline-offset-4" style={{ color: ink }}>
          Modifier ma réponse
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="signature text-5xl" style={{ color: accent }}>Confirmer ma présence</h2>
      <Caps className="mx-auto mt-4 max-w-xs">Merci de nous répondre au plus tôt.</Caps>
      <div className="mx-auto mt-8 grid max-w-xs gap-3">
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
              className="min-h-12 border px-6 font-sans text-[11px] uppercase tracking-[0.3em] transition-opacity hover:opacity-80 disabled:opacity-50"
              style={status === "confirmed" || active ? { background: accent, borderColor: accent, color: "#fff" } : { borderColor: ink, color: ink }}
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
        <p className="font-serif text-5xl leading-none opacity-30" style={{ color: theme.accent }}>{fmt(date, { day: "2-digit" })}.{fmt(date, { month: "2-digit" })}</p>
        <p className="signature -mt-5 text-4xl">Save the Date</p>
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
          <p className="signature mt-5 text-6xl">Jessica &amp; Geldi</p>
          <p className="mt-8 font-serif text-base italic opacity-70">À l'attention de</p>
          <p className="mt-1 font-serif text-2xl">{guest.firstName} {guest.lastName}</p>
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

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#2b2522] sm:px-5 sm:py-10">
      <div className="mx-auto w-full max-w-[480px]">
        {showBack && (
          <Link href={`/invitation/${token}`} className="mx-5 mb-4 mt-4 inline-flex min-h-11 items-center gap-2 font-sans text-[10px] uppercase tracking-[0.24em] text-white/75 sm:mx-0 sm:mt-0">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Toutes mes invitations
          </Link>
        )}

        <article className="shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)]">
          {/* 1 · Couverture « Save the Date » : grande date en filigrane, lavis, végétal */}
          <motion.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="relative overflow-hidden px-6 pb-14 pt-16 text-center"
            style={{ ...paper, background: `radial-gradient(70% 55% at 18% 18%, ${theme.wash[0]}, transparent 70%), radial-gradient(60% 50% at 85% 85%, ${theme.wash[1]}, transparent 70%), ${theme.paper}` }}
          >
            <Botanical src={theme.botanical} color={theme.accent} className={eventKey === "civil" ? "-right-10 bottom-0 h-56 w-48 opacity-50" : "-bottom-6 -left-8 h-64 w-36 opacity-45"} />
            <p className="font-serif text-[clamp(4.2rem,22vw,6.5rem)] font-normal leading-none tracking-[0.04em]" style={{ color: theme.accent, opacity: 0.55 }}>
              {dd}.{mm}.{yy}
            </p>
            <h1 className="signature relative -mt-[0.45em] text-[clamp(3.6rem,17vw,5rem)]">Save the Date</h1>
            <div className="mx-auto mt-6 flex max-w-[220px] items-center gap-3" aria-hidden>
              <span className="h-px flex-1" style={{ background: `${theme.accent}80` }} />
              <Heart className="h-3.5 w-3.5" style={{ color: theme.accent, fill: theme.accent }} strokeWidth={0} />
              <span className="h-px flex-1" style={{ background: `${theme.accent}80` }} />
            </div>
            <p className="mt-4 font-serif text-3xl">Jessica &amp; Geldi</p>
            <Caps className="mt-3 tracking-[0.34em]">{event.label}</Caps>
            <Caps className="tracking-[0.34em]">{details.venue} · Kinshasa, Congo</Caps>
          </motion.header>

          {/* 2 · Médaillon & monogramme sur bandeau */}
          <Panel style={band} className="py-16">
            <p className="signature text-5xl" style={{ color: theme.bandAccent }}>{event.shortLabel}</p>
            <Wreath className="mx-auto mt-6 aspect-[200/240] w-48" >
              <span className="signature text-6xl" style={{ color: theme.bandAccent }}>JG</span>
            </Wreath>
            <p className="signature mt-6 text-5xl" style={{ color: theme.bandAccent }}>Jessica &amp; Geldi</p>
            <Caps className="mt-3 opacity-80">{dd} / {mm} / 20{yy} · {details.venue}</Caps>
          </Panel>

          {/* 3 · Chers invités */}
          <Panel style={paper}>
            <h2 className="signature text-5xl" style={{ color: theme.accent }}>Cher(e) {guest.firstName}&nbsp;!</h2>
            <p className="mx-auto mt-6 max-w-sm font-sans text-[11px] uppercase leading-6 tracking-[0.16em]">{settings.invitationText}</p>
            <p className="mx-auto mt-6 max-w-sm font-sans text-[11px] uppercase leading-6 tracking-[0.16em]">
              Nous serons heureux de vous accueillir {details.venue && details.venue !== "Lieu à confirmer" ? <>à «&nbsp;{details.venue}&nbsp;», </> : null}{details.address}.
            </p>
            <Icon className="mx-auto mt-10 h-32 w-32 opacity-80" />
            {details.mapsUrl && <OutlineLink href={details.mapsUrl} color={theme.ink}>Ouvrir la carte</OutlineLink>}
            <div>
              <p className="mt-8 inline-block border-y px-4 py-2 font-sans text-[9px] uppercase tracking-[0.24em]" style={{ borderColor: `${theme.accent}55` }}>
                Invitation pour {seats} personne{seats > 1 ? "s" : ""}
              </p>
            </div>
          </Panel>

          {/* 4 · Calendrier du mois */}
          <Panel style={{ ...paper, background: theme.wash[0] }}>
            <h2 className="signature text-6xl capitalize">{monthName}</h2>
            <MonthCalendar date={date} accent={theme.accent} ink={theme.ink} />
            <Caps className="mt-6">{event.date} · {event.time}</Caps>
            <Countdown target={date} color={theme.accent} />
          </Panel>

          {/* 5 · Programme sur carte festonnée */}
          <Panel style={band} className="py-16">
            <div className="relative mx-auto max-w-[330px] p-[8px]" style={{ background: theme.paper, color: theme.ink, WebkitMask: scallopMask, mask: scallopMask }}>
              <div className="relative px-7 py-12">
              <div className="absolute inset-2 border" style={{ borderColor: `${theme.accent}55` }} />
              <h2 className="signature relative text-5xl" style={{ color: theme.accent }}>Programme</h2>
              <Caps className="relative opacity-70">de la journée</Caps>
              <div className="relative mt-8 space-y-6">
                {(program.length ? program : [{ time: event.time, title: event.label, text: "" }]).map((item, index) => (
                  <div key={`${item.time}-${index}`}>
                    <p className="font-serif text-3xl italic" style={{ color: theme.accent }}>{item.time}</p>
                    <Caps className="mt-1">{item.title}</Caps>
                    {item.text && <p className="mx-auto mt-1 max-w-[240px] text-sm leading-6 opacity-70">{item.text}</p>}
                  </div>
                ))}
              </div>
              </div>
            </div>
          </Panel>

          {/* 6 · Dress code */}
          <Panel style={paper}>
            <h2 className="signature text-6xl" style={{ color: theme.accent }}>Dress code</h2>
            <Caps className="mx-auto mt-5 max-w-xs">Nous serons ravis si vos tenues accompagnent notre palette&nbsp;: {event.theme}.</Caps>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {event.palette.map((color, index) => (
                <div key={color} className="flex w-14 flex-col items-center gap-2">
                  <span className="h-11 w-11 rounded-full border border-black/10 shadow-sm" style={{ background: color }} />
                  <span className="font-sans text-[8px] uppercase leading-3 tracking-[0.12em] opacity-65">{event.colorNames[index]}</span>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-xs text-base italic leading-7 opacity-75">{details.note || event.themeNote}</p>
          </Panel>

          {/* 7 · Attentions */}
          {settings.contribution.enabled && (
            <Panel style={{ ...paper, borderTop: `1px solid ${theme.accent}30` }}>
              <h2 className="signature text-5xl" style={{ color: theme.accent }}>Vos attentions</h2>
              <Mail className="mx-auto mt-6 h-7 w-7 opacity-70" strokeWidth={1.2} aria-hidden />
              <Caps className="mx-auto mt-4 max-w-xs">{settings.contribution.title}</Caps>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 opacity-70">{settings.contribution.message}</p>
            </Panel>
          )}

          {/* 8 · Réponse */}
          <Panel style={{ ...paper, background: theme.wash[0] }}>
            <PresenceConfirm guest={guest} token={token} accent={theme.accent} ink={theme.ink} />
          </Panel>

          {/* 9 · Clôture */}
          <Panel style={band} className="py-16">
            <p className="signature text-5xl leading-tight" style={{ color: theme.bandAccent }}>Avec impatience de vous retrouver&nbsp;!</p>
            <p className="signature mt-10 text-5xl" style={{ color: theme.bandAccent }}>Jessica &amp; Geldi</p>
            <Caps className="mt-3 opacity-80">{dd} / {mm} / 20{yy} · Kinshasa</Caps>
          </Panel>
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
        <h1 className="font-serif text-2xl">Invitation introuvable</h1>
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
