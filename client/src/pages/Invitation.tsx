import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Check, Clock, Loader2, MapPin, X } from "lucide-react";
import { type RsvpResponse } from "@shared/schema";
import { getEventKeys, JessicaGeldi, weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type InvitationGuest = RsvpResponse & { invitationUrl: string };
const eventKeys = Object.keys(weddingEvents) as WeddingEventKey[];
const reveal = { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const };

function Ornament({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      <span className="text-xs" style={{ color }}>J&G</span>
      <span className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  );
}

function Monogram({ color }: { color: string }) {
  return (
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border" style={{ borderColor: `${color}88`, color }}>
      <div className="text-center">
        <p className="font-script text-4xl leading-none">J&G</p>
        <p className="text-[8px] uppercase tracking-[0.32em]">2026</p>
      </div>
    </div>
  );
}

function InvitationArt({ eventKey }: { eventKey: WeddingEventKey }) {
  const event = weddingEvents[eventKey];
  const isDark = eventKey === "reception";
  return (
    <figure
      className="relative aspect-[3/4] overflow-hidden rounded-[2rem] shadow-2xl"
      style={{ background: event.background, border: `1px solid ${event.accent}55` }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(circle at 50% 24%, rgba(213,179,106,.45), transparent 27%), radial-gradient(circle at 18% 78%, rgba(255,255,255,.12), transparent 24%), linear-gradient(160deg, transparent, rgba(0,0,0,.72))"
            : `radial-gradient(circle at 25% 20%, ${event.palette[1]}66, transparent 28%), radial-gradient(circle at 76% 70%, ${event.palette[2]}77, transparent 30%), linear-gradient(135deg, rgba(255,255,255,.72), transparent 50%)`,
        }}
      />
      <div className="absolute inset-6 rounded-[1.5rem] border border-white/35" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: `${event.accent}66` }} />
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: `${event.accent}55` }} />
      <figcaption className="absolute inset-x-0 bottom-0 p-7 text-center" style={{ color: event.ink }}>
        <p className="text-[10px] uppercase tracking-[0.5em]" style={{ color: event.accent }}>{event.theme}</p>
        <p className="mt-4 font-script text-6xl leading-none">Jessica & Geldi</p>
      </figcaption>
    </figure>
  );
}

function Countdown({ target, color, ink }: { target: Date; color: string; ink: string }) {
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
    <div className="grid grid-cols-4 gap-2">
      {cells.map(([label, value]) => (
        <div key={label} className="border bg-white/35 py-3 text-center" style={{ borderColor: `${color}44` }}>
          <p className="font-serif text-2xl" style={{ color: ink }}>{String(value).padStart(2, "0")}</p>
          <p className="text-[8px] uppercase tracking-[0.25em]" style={{ color }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

function SimpleRsvp({ token, status, eventKey }: { token: string; status: string; eventKey: WeddingEventKey }) {
  const { toast } = useToast();
  const event = weddingEvents[eventKey];
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
        description: next === "confirmed" ? "Merci, votre présence est confirmée." : "Votre absence a bien été prise en compte.",
      });
    } catch (e: any) {
      toast({ title: "Oups", description: e.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setStatus("confirmed")}
        disabled={!!saving}
        className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[10px] uppercase tracking-[0.32em] text-white disabled:opacity-60"
        style={{ background: current === "confirmed" ? event.accent : event.ink }}
      >
        {saving === "confirmed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {current === "confirmed" ? "Présence confirmée" : "Je serai présent(e)"}
      </button>
      <button
        type="button"
        onClick={() => setStatus("declined")}
        disabled={!!saving}
        className="flex w-full items-center justify-center gap-2 rounded-full border py-4 text-[10px] uppercase tracking-[0.32em] disabled:opacity-60"
        style={{ borderColor: `${event.accent}66`, color: event.ink, background: current === "declined" ? `${event.accent}22` : "transparent" }}
      >
        {saving === "declined" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        {current === "declined" ? "Absence enregistrée" : "Je ne pourrai pas venir"}
      </button>
    </div>
  );
}

function DateCard({ guest, token, eventKey }: { guest: InvitationGuest; token: string; eventKey: WeddingEventKey }) {
  const event = weddingEvents[eventKey];
  return (
    <Link href={`/invitation/${token}/${eventKey}`} className="block">
      <article className="group border bg-white/55 p-4 transition hover:-translate-y-1 hover:shadow-xl" style={{ borderColor: `${event.accent}44` }}>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, ${event.palette[0]}, ${event.accent})` }} />
          <div>
            <p className="font-serif text-xl" style={{ color: event.ink }}>{event.label}</p>
            <p className="text-[10px] uppercase tracking-[0.26em]" style={{ color: event.accent }}>
              {event.date} · {event.time} · {event.theme}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Invitation de {guest.firstName} {guest.lastName}</p>
          </div>
        </div>
      </article>
    </Link>
  );
}

function TransitPage({ guest, token, dates }: { guest: InvitationGuest; token: string; dates: WeddingEventKey[] }) {
  return (
    <main className="min-h-screen bg-[#FBF4EA] px-6 py-12">
      <div className="mx-auto max-w-md">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={reveal} className="text-center">
          <Monogram color="#B66E4B" />
          <p className="mt-7 text-[9px] uppercase tracking-[0.55em] text-primary/70">Invitation officielle</p>
          <h1 className="mt-5 font-script text-6xl leading-none">Jessica & Geldi</h1>
          <p className="mt-5 font-serif text-base italic text-muted-foreground">À l'attention de</p>
          <p className="mt-1 font-serif text-2xl">{guest.firstName} {guest.lastName}</p>
        </motion.div>
        <p className="mt-9 text-center text-sm leading-7 text-muted-foreground">
          Choisissez l'invitation que vous souhaitez ouvrir.
        </p>
        <div className="mt-8 space-y-4">
          {dates.map((key) => <DateCard key={key} guest={guest} token={token} eventKey={key} />)}
        </div>
      </div>
    </main>
  );
}

function InvitationPage({ guest, token, eventKey, showBack }: { guest: InvitationGuest; token: string; eventKey: WeddingEventKey; showBack?: boolean }) {
  const event = weddingEvents[eventKey];
  const dark = eventKey === "reception";
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: event.background, color: event.ink }}>
      <div className="mx-auto w-full max-w-md px-5 pb-20 pt-6">
        {showBack && (
          <Link href={`/invitation/${token}`} className="mb-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em]" style={{ color: event.accent }}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Autres invitations
          </Link>
        )}
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={reveal} className="text-center">
          <Monogram color={event.accent} />
          <p className="mt-6 text-[9px] uppercase tracking-[0.6em]" style={{ color: event.accent }}>Save the date</p>
          <div className="mt-5">
            <InvitationArt eventKey={eventKey} />
          </div>
          <p className="mt-7 font-serif text-base italic opacity-75">À l'attention de</p>
          <p className="mt-1 font-serif text-2xl">{guest.firstName} {guest.lastName}</p>
        </motion.header>

        <section className="pt-10">
          <Countdown target={new Date(event.iso)} color={event.accent} ink={event.ink} />
        </section>

        <section className="pt-12 text-center">
          <Ornament color={event.accent} />
          <h2 className="mt-6 font-serif text-3xl">{event.label}</h2>
          <p className="mt-3 text-[10px] uppercase tracking-[0.4em]" style={{ color: event.accent }}>{event.theme}</p>
          <p className="mx-auto mt-5 max-w-xs text-sm leading-7 opacity-75">{event.themeNote}</p>
        </section>

        <section className="pt-10">
          <div className="space-y-4 border p-6" style={{ borderColor: `${event.accent}44`, background: dark ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.48)" }}>
            <p className="text-center text-[9px] uppercase tracking-[0.45em]" style={{ color: event.accent }}>Détails</p>
            <p className="flex items-start gap-3 text-sm"><CalendarDays className="mt-1 h-4 w-4" /> {event.date}</p>
            <p className="flex items-start gap-3 text-sm"><Clock className="mt-1 h-4 w-4" /> {event.time}</p>
            <p className="flex items-start gap-3 text-sm"><MapPin className="mt-1 h-4 w-4" /> Lieu à confirmer · Kinshasa</p>
          </div>
        </section>

        <section className="pt-10 text-center">
          <p className="text-[9px] uppercase tracking-[0.45em]" style={{ color: event.accent }}>Couleurs</p>
          <div className="mt-5 flex flex-wrap justify-center gap-4">
            {event.palette.map((color, index) => (
              <div key={color} className="flex flex-col items-center gap-2">
                <span className="h-9 w-9 rounded-full border border-black/10" style={{ background: color }} />
                <span className="text-[8px] uppercase tracking-[0.22em] opacity-70">{event.colorNames[index]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-10">
          <div className="border p-7" style={{ borderColor: `${event.accent}44`, background: dark ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.48)" }}>
            <p className="mb-5 text-center text-[9px] uppercase tracking-[0.45em]" style={{ color: event.accent }}>Votre réponse</p>
            <SimpleRsvp token={token} status={guest.status} eventKey={eventKey} />
          </div>
        </section>

        <footer className="pt-14 text-center">
          <Ornament color={event.accent} />
          <p className="mt-7 font-script text-5xl">Jessica & Geldi</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.45em] opacity-65">Avec joie, nous vous attendons</p>
        </footer>
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#FBF4EA] p-6">
        <Skeleton className="h-10 w-64 rounded-none" />
        <Skeleton className="h-[460px] w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (error || !guest || !token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-[#FBF4EA] p-6 text-center">
        <Monogram color="#B66E4B" />
        <p className="font-script text-6xl">{JessicaGeldi.brand}</p>
        <h1 className="font-serif text-2xl">Invitation introuvable</h1>
        <p className="max-w-xs text-[10px] uppercase tracking-[0.36em] text-muted-foreground">
          Ce lien semble invalide ou a expiré. Veuillez contacter les mariés directement.
        </p>
      </div>
    );
  }

  const dates = getEventKeys(guest.ceremonyChoice);
  const requested = dateParam && eventKeys.includes(dateParam) ? dateParam : null;

  if (!requested || !dates.includes(requested)) {
    if (dates.length === 1) {
      return <InvitationPage guest={guest} token={token} eventKey={dates[0]} />;
    }
    return <TransitPage guest={guest} token={token} dates={dates} />;
  }

  return <InvitationPage guest={guest} token={token} eventKey={requested} showBack={dates.length > 1} />;
}
