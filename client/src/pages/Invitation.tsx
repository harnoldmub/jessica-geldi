import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock, ExternalLink, MapPin } from "lucide-react";
import { type RsvpResponse } from "@shared/schema";
import { getEventKeys, JessicaGeldi, weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";
import { defaultSiteSettings, type SiteSettings } from "@shared/siteSettings";
import RsvpForm from "@/components/RsvpForm";
import { Skeleton } from "@/components/ui/skeleton";

type InvitationGuest = RsvpResponse & { invitationUrl: string };

const eventKeys = Object.keys(weddingEvents) as WeddingEventKey[];
const reveal = { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const };

function PearlStrand({ small = false, className = "" }: { small?: boolean; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-0.5 ${className}`} aria-hidden="true">
      {Array.from({ length: 17 }, (_, index) => (
        <span
          key={index}
          className={`pearl ${small ? "pearl-small" : ""}`}
          style={{ transform: `translateY(${Math.sin((index / 16) * Math.PI) * 20}px) scale(${0.82 + Math.sin((index / 16) * Math.PI) * 0.18})` }}
        />
      ))}
    </div>
  );
}

function Ornament({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-4" aria-hidden="true">
      <span className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      <span className="font-serif text-xs italic" style={{ color }}>J &amp; G</span>
      <span className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  );
}

function Monogram({ color }: { color: string }) {
  return (
    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border" style={{ borderColor: `${color}88`, color }}>
      <div className="text-center">
        <p className="font-script text-4xl leading-none">J&amp;G</p>
        <p className="mt-1 font-sans text-[8px] uppercase tracking-[0.3em]">2027</p>
      </div>
    </div>
  );
}

function InvitationArt({ eventKey }: { eventKey: WeddingEventKey }) {
  const event = weddingEvents[eventKey];
  const [weekday, day, month] = event.date.replace(" 2027", "").split(" ");

  return (
    <figure
      className="relative aspect-[4/5] overflow-hidden border invitation-paper editorial-shadow"
      style={{ borderColor: `${event.accent}55`, backgroundColor: event.background }}
    >
      <div className="absolute -left-20 top-8 w-72 -rotate-[34deg]"><PearlStrand small /></div>
      <div className="absolute -right-24 bottom-24 w-80 rotate-[28deg]"><PearlStrand /></div>
      <div className="absolute inset-5 border" style={{ borderColor: `${event.accent}3f` }} />

      <figcaption className="relative z-10 flex h-full flex-col items-center px-8 pb-9 pt-10 text-center" style={{ color: event.ink }}>
        <p className="font-sans text-[8px] uppercase tracking-[0.38em]" style={{ color: event.accent }}>
          Invitation officielle
        </p>
        <p className="mt-7 font-serif text-[11px] uppercase tracking-[0.26em]">Le mariage de</p>
        <h1 className="invitation-cover-title mt-3 font-serif font-medium uppercase">
          Jessica<br />Geldi
        </h1>
        <p className="mt-2 font-script text-5xl leading-none" style={{ color: event.accent }}>Notre grand jour</p>

        <div className="mt-auto w-full border-y py-5" style={{ borderColor: `${event.accent}42` }}>
          <p className="font-serif text-2xl">{event.shortLabel}</p>
          <p className="mt-2 font-sans text-[9px] uppercase tracking-[0.28em]" style={{ color: event.accent }}>
            {weekday} {day} {month} · {event.time}
          </p>
          <p className="mt-2 font-serif text-sm italic">{event.theme}</p>
        </div>
      </figcaption>
    </figure>
  );
}

function Countdown({ target, color, ink }: { target: Date; color: string; ink: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = Math.max(0, target.getTime() - now);
  const cells: [string, number][] = [
    ["Jours", Math.floor(diff / 86400000)],
    ["Heures", Math.floor(diff / 3600000) % 24],
    ["Min", Math.floor(diff / 60000) % 60],
    ["Sec", Math.floor(diff / 1000) % 60],
  ];

  return (
    <div className="grid grid-cols-4 border-y py-5" style={{ borderColor: `${color}42` }} aria-label="Compte à rebours">
      {cells.map(([label, value], index) => (
        <div key={label} className={`text-center ${index ? "border-l" : ""}`} style={{ borderColor: `${color}42` }}>
          <p className="font-serif text-xl tabular-nums sm:text-2xl" style={{ color: ink }}>{String(value).padStart(2, "0")}</p>
          <p className="mt-1 font-sans text-[7px] uppercase tracking-[0.18em]" style={{ color }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

function DateCard({ token, eventKey }: { token: string; eventKey: WeddingEventKey }) {
  const event = weddingEvents[eventKey];
  return (
    <Link href={`/invitation/${token}/${eventKey}`} className="group block focus-visible:outline-none focus-visible:ring-2" style={{ color: event.ink }}>
      <article className="border bg-white/60 p-5 transition-transform duration-300 group-hover:-translate-y-1 group-active:scale-[0.99]" style={{ borderColor: `${event.accent}55` }}>
        <div className="flex items-center gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border" style={{ borderColor: event.accent }}>
            <span className="h-11 w-11 rounded-full" style={{ background: event.palette[0], boxShadow: `inset 0 0 0 10px ${event.palette[1]}55` }} />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-xl">{event.label}</p>
            <p className="mt-1 font-sans text-[9px] uppercase leading-5 tracking-[0.2em]" style={{ color: event.accent }}>
              {event.date}<br />{event.time} · {event.theme}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}

function TransitPage({ guest, token, dates }: { guest: InvitationGuest; token: string; dates: WeddingEventKey[] }) {
  return (
    <main className="min-h-dvh bg-[#b5a99e] px-4 py-8 sm:py-12">
      <div className="invitation-paper mx-auto max-w-lg border border-white/40 px-6 py-10 sm:px-12 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={reveal} className="text-center">
          <Monogram color="#8b6e5d" />
          <p className="mt-8 font-sans text-[9px] uppercase tracking-[0.45em] text-[#8b6e5d]">Vos invitations</p>
          <h1 className="mt-5 font-serif text-5xl uppercase leading-[0.92] sm:text-6xl">Jessica<br />Geldi</h1>
          <p className="mt-2 font-script text-4xl text-[#8b6e5d]">Notre grand jour</p>
          <PearlStrand small className="mx-auto mt-8 max-w-[270px]" />
          <p className="mt-12 font-serif text-base italic text-muted-foreground">À l'attention de</p>
          <p className="mt-1 font-serif text-2xl">{guest.firstName} {guest.lastName}</p>
          <p className="mx-auto mt-5 max-w-sm text-base leading-7 text-muted-foreground">
            Nous avons la joie de vous convier à plusieurs temps de notre mariage. Ouvrez chaque faire-part pour découvrir ses détails.
          </p>
        </motion.div>
        <div className="mt-9 space-y-4">
          {dates.map((key) => <DateCard key={key} token={token} eventKey={key} />)}
        </div>
      </div>
    </main>
  );
}

function InvitationPage({ guest, token, eventKey, settings, showBack }: { guest: InvitationGuest; token: string; eventKey: WeddingEventKey; settings: SiteSettings; showBack?: boolean }) {
  const event = weddingEvents[eventKey];
  const details = settings.events[eventKey];
  const program = settings.program.filter((item) => item.event === eventKey);
  const eventDate = new Date(event.iso);
  const day = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "Africa/Kinshasa" }).format(eventDate);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "Africa/Kinshasa" }).format(eventDate);
  const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Africa/Kinshasa" }).format(eventDate);

  return (
    <main className="min-h-dvh overflow-x-hidden px-0 py-0 sm:px-5 sm:py-10" style={{ background: `${event.accent}66`, color: event.ink }}>
      <div className="mx-auto w-full max-w-[540px]">
        {showBack && (
          <Link href={`/invitation/${token}`} className="mx-5 mb-5 inline-flex min-h-11 items-center gap-2 font-sans text-[9px] uppercase tracking-[0.24em] sm:mx-0" style={{ color: event.ink }}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Toutes mes invitations
          </Link>
        )}

        <article className="invitation-paper overflow-hidden sm:border sm:border-white/50">
          <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={reveal} className="p-5 sm:p-8">
            <InvitationArt eventKey={eventKey} />
          </motion.header>

          <section className="px-7 pb-12 pt-7 text-center sm:px-12" aria-labelledby="guest-name">
            <p className="font-sans text-[8px] uppercase tracking-[0.35em]" style={{ color: event.accent }}>Une invitation rien que pour vous</p>
            <h2 id="guest-name" className="mt-5 font-script text-5xl leading-none" style={{ color: event.accent }}>{guest.firstName}</h2>
            <p className="mx-auto mt-5 max-w-sm text-lg leading-8 text-black/70">{settings.invitationText}</p>
            <p className="mt-6 inline-block border-y px-4 py-2 font-sans text-[8px] uppercase tracking-[0.22em]" style={{ borderColor: `${event.accent}55` }}>
              Invitation pour {guest.invitedCount || 1} personne{(guest.invitedCount || 1) > 1 ? "s" : ""}
            </p>
          </section>

          <section className="px-7 pb-12 sm:px-12"><Countdown target={eventDate} color={event.accent} ink={event.ink} /></section>

          <section className="border-y px-7 py-14 text-center sm:px-12" style={{ borderColor: `${event.accent}3d`, background: `${event.palette[0]}99` }} aria-labelledby="date-title">
            <p className="font-script text-5xl leading-none" style={{ color: event.accent }}>{month}</p>
            <p id="date-title" className="mt-4 font-serif text-[5rem] leading-none sm:text-[6rem]">{day}</p>
            <p className="mt-4 font-sans text-[9px] uppercase tracking-[0.34em]">{weekday} · {event.time} · 2027</p>
            <div className="mt-9 grid grid-cols-3 border-y" style={{ borderColor: `${event.accent}48` }}>
              {eventKeys.map((key) => {
                const item = weddingEvents[key];
                const active = key === eventKey;
                return (
                  <div key={key} className="py-4 text-center" style={{ background: active ? event.accent : "transparent", color: active ? "#fff" : event.ink }}>
                    <p className="font-sans text-[7px] uppercase tracking-[0.18em]">{item.shortLabel}</p>
                    <p className="mt-1 font-serif text-xl">{new Date(item.iso).getDate()}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="px-7 py-14 sm:px-12" aria-labelledby="event-title">
            <div className="text-center">
              <Ornament color={event.accent} />
              <h2 id="event-title" className="mt-7 font-serif text-3xl sm:text-4xl">{event.label}</h2>
              <p className="mt-3 font-script text-4xl" style={{ color: event.accent }}>{event.theme}</p>
              <p className="mx-auto mt-5 max-w-sm text-lg leading-8 text-black/65">{details.note || event.themeNote}</p>
            </div>

            <div className="mt-10 border-y py-7" style={{ borderColor: `${event.accent}42` }}>
              <p className="flex items-start gap-4 text-base leading-7"><CalendarDays className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> {event.date}</p>
              <p className="mt-4 flex items-start gap-4 text-base"><Clock className="h-4 w-4 shrink-0" aria-hidden="true" /> {event.time}</p>
              <p className="mt-4 flex items-start gap-4 text-base leading-7"><MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> <span>{details.venue}<br />{details.address}</span></p>
              {details.mapsUrl && (
                <a href={details.mapsUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 font-sans text-[9px] uppercase tracking-[0.22em] underline underline-offset-4" style={{ color: event.accent }}>
                  Voir l'itinéraire <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </section>

          {program.length > 0 && (
            <section className="px-7 pb-14 sm:px-12" aria-labelledby="program-title">
              <p className="text-center font-script text-5xl" style={{ color: event.accent }}>Programme</p>
              <h2 id="program-title" className="sr-only">Programme de la célébration</h2>
              <div className="mt-8 border-y" style={{ borderColor: `${event.accent}42` }}>
                {program.map((item, index) => (
                  <div key={`${item.time}-${index}`} className="grid grid-cols-[76px_1fr] gap-5 border-b py-5 last:border-b-0" style={{ borderColor: `${event.accent}32` }}>
                    <p className="font-serif text-2xl" style={{ color: event.accent }}>{item.time}</p>
                    <div><h3 className="font-serif text-xl">{item.title}</h3>{item.text && <p className="mt-2 text-base leading-6 text-black/60">{item.text}</p>}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="border-y px-7 py-14 text-center sm:px-12" style={{ borderColor: `${event.accent}3d`, background: `${event.palette[0]}8f` }} aria-labelledby="dress-title">
            <h2 id="dress-title" className="font-serif text-3xl">Tenue &amp; couleurs</h2>
            <p className="mt-2 font-script text-4xl" style={{ color: event.accent }}>{event.theme}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {event.palette.map((color, index) => (
                <div key={color} className="flex w-12 flex-col items-center gap-2">
                  <span className="h-10 w-10 rounded-full border border-black/10 shadow-sm" style={{ background: color }} />
                  <span className="font-sans text-[7px] uppercase leading-3 tracking-[0.12em] opacity-65">{event.colorNames[index]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="px-5 py-14 sm:px-9" aria-label="Réponse à l'invitation">
            <RsvpForm
              variant="invitation"
              submitEndpoint={`/api/invitation/${token}/rsvp`}
              maxGuests={guest.invitedCount || 1}
              allowedEvents={getEventKeys(guest.invitedCeremonyChoice || guest.ceremonyChoice)}
              initialValues={{
                firstName: guest.firstName,
                lastName: guest.lastName,
                email: guest.email || "",
                phone: guest.phone || "",
                status: guest.status as "pending" | "confirmed" | "declined",
                guestCount: guest.guestCount,
                ceremonyChoice: guest.ceremonyChoice || eventKey,
                mealChoice: guest.mealChoice || "",
                beverageChoice: guest.beverageChoice || "",
                allergies: guest.allergies || "",
                message: guest.message || "",
              }}
              title="Serez-vous des nôtres ?"
              description={`Votre invitation prévoit jusqu'à ${guest.invitedCount || 1} personne(s). Vous pourrez modifier votre réponse à tout moment.`}
              submitLabel="Enregistrer ma réponse"
            />
          </section>

          <footer className="border-t px-7 py-14 text-center sm:px-12" style={{ borderColor: `${event.accent}3d` }}>
            <PearlStrand small className="mx-auto max-w-[270px]" />
            <p className="mt-12 font-script text-5xl" style={{ color: event.accent }}>Jessica &amp; Geldi</p>
            <p className="mt-4 font-sans text-[8px] uppercase tracking-[0.34em] opacity-60">Kinshasa · 2027</p>
          </footer>
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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-[#b5a99e] p-6">
        <Skeleton className="h-10 w-64 rounded-none" />
        <Skeleton className="h-[540px] w-full max-w-md rounded-none" />
      </div>
    );
  }

  if (error || !guest || !token) {
    return (
      <div className="invitation-paper flex min-h-dvh flex-col items-center justify-center gap-7 p-6 text-center">
        <Monogram color="#8b6e5d" />
        <p className="font-script text-6xl">{JessicaGeldi.brand}</p>
        <h1 className="font-serif text-2xl">Invitation introuvable</h1>
        <p className="max-w-sm text-base leading-7 text-muted-foreground">Ce lien semble invalide ou a expiré. Veuillez contacter les mariés directement.</p>
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
