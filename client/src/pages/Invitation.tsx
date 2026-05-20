import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { CalendarDays, Clock, MapPin, ChevronDown } from "lucide-react";
import { type RsvpResponse } from "@shared/schema";
import { mamisaMarylin } from "@shared/mamisaMarylin";
import { Skeleton } from "@/components/ui/skeleton";
import RsvpForm from "@/components/RsvpForm";

type InvitationGuest = RsvpResponse & { invitationUrl: string };

const reveal = { duration: 1.0, ease: [0.22, 1, 0.36, 1] as const };

/* ─── Ornamental horizontal rule ─────────────────────────── */
function OrnamentRule({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <div className="flex items-center justify-center gap-5" style={{ opacity }}>
      <div className="h-px w-16 flex-1 bg-gradient-to-r from-transparent to-primary/40" />
      <span className="text-xs text-primary">✦</span>
      <div className="h-px w-16 flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
    </div>
  );
}

/* ─── Ceremony info card ──────────────────────────────────── */
function InfoCard({
  icon: Icon,
  label,
  value,
  dark = false,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  dark?: boolean;
  delay?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ ...reveal, delay }}
      className={`p-8 text-center editorial-shadow border ${dark ? 'dark bg-background border-border' : 'bg-background border-border'}`}
    >
      <Icon
        className="mx-auto h-5 w-5 text-muted-foreground"
        strokeWidth={1.4}
      />
      <p className="mt-5 text-[9px] uppercase tracking-[0.5em] text-muted-foreground/80">
        {label}
      </p>
      <p className="mt-3 font-serif text-xl leading-snug text-foreground">
        {value}
      </p>
    </motion.article>
  );
}

/* ─── Theme badge ─────────────────────────────────────────── */
function ThemeBadge({ theme, note, dark = false }: { theme: string; note: string; dark?: boolean }) {
  return (
    <div className="mt-7 space-y-2">
      <div
        className={`inline-flex items-center gap-3 px-6 py-3 border ${dark ? 'border-border bg-background/50' : 'border-border bg-background'}`}
      >
        <span className="text-[9px] uppercase tracking-[0.52em] text-muted-foreground">
          Thème vestimentaire
        </span>
        <span className="h-4 w-px bg-border" />
        <span className="font-serif text-sm italic text-foreground">
          {theme}
        </span>
      </div>
      <p className="text-[10px] tracking-wide text-muted-foreground/80">
        {note}
      </p>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────── */
export default function Invitation() {
  const [, params] = useRoute("/invitation/:token");
  const token = params?.token;
  const [guestPreview, setGuestPreview] = useState<InvitationGuest | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  const { data: guest, isLoading, error } = useQuery<InvitationGuest>({
    queryKey: [`/api/invitation/${token}`],
    enabled: !!token,
  });

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0]);

  const currentGuest = guestPreview || guest;

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 bg-background">
        <Skeleton className="h-10 w-64 rounded-none bg-secondary" />
        <Skeleton className="h-[480px] w-full max-w-4xl rounded-none bg-secondary" />
      </div>
    );
  }

  /* ── Not found ── */
  if (error || !currentGuest || !token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-7 p-6 text-center bg-background">
        <OrnamentRule opacity={0.2} />
        <p className="font-script text-6xl text-foreground/80">{mamisaMarylin.brand}</p>
        <h1 className="font-serif text-2xl text-foreground">Invitation introuvable</h1>
        <p className="text-[10px] uppercase tracking-[0.42em] max-w-xs text-muted-foreground">
          Ce lien semble invalide ou a expiré. Veuillez contacter les mariés directement.
        </p>
        <OrnamentRule opacity={0.2} />
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">

      {/* ══════════════════════════════════════════════════════
          PRÉLUDE — Invitation
      ══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative isolate overflow-hidden min-h-[100svh] bg-gradient-to-br from-background via-background to-secondary"
      >
        {/* Ambient radial */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 28% 20%, hsl(var(--primary)/0.05) 0%, transparent 48%), radial-gradient(ellipse at 78% 74%, hsl(var(--primary)/0.05) 0%, transparent 44%)",
          }}
        />

        {/* Corner marks */}
        <span className="absolute top-8 left-8 text-xl select-none pointer-events-none text-muted-foreground/30">✦</span>
        <span className="absolute top-8 right-8 text-xl select-none pointer-events-none text-muted-foreground/30">✦</span>
        <span className="absolute bottom-16 left-8 text-xl select-none pointer-events-none text-muted-foreground/20">✦</span>
        <span className="absolute bottom-16 right-8 text-xl select-none pointer-events-none text-muted-foreground/20">✦</span>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-8 py-20 text-center"
        >
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-[10px] uppercase tracking-[0.62em] text-primary"
          >
            {mamisaMarylin.hero.eyebrow}
          </motion.p>

          {/* Guest salutation */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12"
          >
            <p className="font-serif text-base italic text-muted-foreground">
              À l'attention de
            </p>
            <h1 className="mt-2 font-serif leading-tight text-foreground" style={{ fontSize: "clamp(2rem, 6vw, 3.75rem)" }}>
              {currentGuest.firstName} {currentGuest.lastName}
            </h1>
          </motion.div>

          {/* Brand + subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10"
          >
            <p className="font-script leading-tight text-foreground/80" style={{ fontSize: "clamp(3.5rem, 10vw, 6rem)" }}>
              {mamisaMarylin.title}
            </p>
            <p className="mt-3 font-serif text-xl md:text-2xl text-foreground/70">
              vous invitent à leur mariage
            </p>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="mt-16 flex flex-col items-center gap-2"
          >
            <p className="text-[9px] uppercase tracking-[0.58em] text-muted-foreground">
              Découvrir
            </p>
            <ChevronDown className="h-4 w-4 animate-bounce text-primary" strokeWidth={1.4} />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MARIAGE CIVIL
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-background">
        {/* Top fade line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-32">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={reveal}
            className="text-center"
          >
            <p className="text-[9px] uppercase tracking-[0.68em] text-primary">
              ✦ &nbsp; Première partie &nbsp; ✦
            </p>
            <h2 className="mt-5 font-serif leading-tight text-foreground" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              {mamisaMarylin.ceremony.blessing.label}
            </h2>
            <ThemeBadge
              theme={mamisaMarylin.ceremony.blessing.theme}
              note={mamisaMarylin.ceremony.blessing.themeNote}
            />
          </motion.div>

          {/* Info cards */}
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <InfoCard icon={CalendarDays} label="Date" value={mamisaMarylin.date.display} delay={0} />
            <InfoCard icon={Clock} label="Heure" value={mamisaMarylin.ceremony.blessing.time} delay={0.08} />
            <InfoCard
              icon={MapPin}
              label="Lieu"
              value={`${mamisaMarylin.venues[0].name} · ${mamisaMarylin.venues[0].city}`}
              delay={0.16}
            />
          </div>

          {/* Venue note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.9 }}
            transition={{ ...reveal, delay: 0.28 }}
            className="mt-7 text-center text-sm italic text-muted-foreground"
          >
            {mamisaMarylin.venues[0].note}
          </motion.p>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CÉRÉMONIE RELIGIEUSE & SOIRÉE
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden dark bg-background">
        {/* Warm ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 110%, hsl(var(--primary)/0.1) 0%, transparent 55%), radial-gradient(ellipse at 15% 45%, hsl(var(--primary)/0.05) 0%, transparent 38%)",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-32">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={reveal}
            className="text-center"
          >
            <p className="text-[9px] uppercase tracking-[0.68em] text-primary">
              ✦ &nbsp; Deuxième partie &nbsp; ✦
            </p>
            <h2 className="mt-5 font-serif leading-tight text-foreground" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              {mamisaMarylin.ceremony.evening.label}
            </h2>
            <ThemeBadge
              theme={mamisaMarylin.ceremony.evening.theme}
              note={mamisaMarylin.ceremony.evening.themeNote}
              dark
            />
          </motion.div>

          {/* Info cards */}
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <InfoCard icon={CalendarDays} label="Date" value={mamisaMarylin.date.display} dark delay={0} />
            <InfoCard icon={Clock} label="Heure" value={mamisaMarylin.ceremony.evening.time} dark delay={0.08} />
            <InfoCard
              icon={MapPin}
              label="Lieu"
              value={`${mamisaMarylin.venues[1].name} · ${mamisaMarylin.venues[1].city}`}
              dark
              delay={0.16}
            />
          </div>

          {/* Venue note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.9 }}
            transition={{ ...reveal, delay: 0.28 }}
            className="mt-7 text-center text-sm italic text-muted-foreground"
          >
            {mamisaMarylin.venues[1].note}
          </motion.p>

          {/* Dress code */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ ...reveal, delay: 0.36 }}
            className="mt-12 border-t border-border pt-10 text-center"
          >
            <p className="text-[9px] uppercase tracking-[0.58em] text-muted-foreground/60">
              Code vestimentaire
            </p>
            <p className="mt-3 font-serif text-2xl italic text-primary/80">
              {mamisaMarylin.ceremony.evening.dress}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          RSVP — Confirmation de présence
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-background">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:px-10 md:py-28 lg:grid-cols-[1fr_1.45fr]">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={reveal}
            className="space-y-8"
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.55em] text-primary">
                Votre réponse
              </p>
              <h2 className="mt-5 font-serif leading-tight text-foreground" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
                Merci de confirmer votre présence.
              </h2>
              <p className="mt-6 text-base leading-8 text-muted-foreground">
                {mamisaMarylin.couple.narrative}
              </p>
            </div>

            {/* Venue list */}
            <div className="space-y-7">
              {mamisaMarylin.venues.map((venue) => (
                <article
                  key={venue.label}
                  className="border-l-2 border-border pl-5"
                >
                  <p className="text-[9px] uppercase tracking-[0.44em] text-muted-foreground">
                    {venue.label}
                  </p>
                  <p className="mt-2 font-serif text-xl text-foreground">
                    {venue.name}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground/80">
                    {venue.address}, {venue.city}
                  </p>
                </article>
              ))}
            </div>
          </motion.div>

          {/* RSVP form */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ ...reveal, delay: 0.1 }}
          >
            <RsvpForm
              variant="page"
              submitEndpoint={`/api/invitation/${token}/rsvp`}
              initialValues={{
                firstName: currentGuest.firstName,
                lastName: currentGuest.lastName,
                email: currentGuest.email || "",
                phone: currentGuest.phone || "",
                status: currentGuest.status as "pending" | "confirmed" | "declined",
                guestCount: currentGuest.guestCount || 1,
                message: currentGuest.message || "",
              }}
              title="Répondre à votre invitation"
              description="Vos informations sont pré-remplies. Confirmez ou ajustez votre réponse."
              submitLabel="Confirmer ma présence"
              successTitle="Votre réponse est enregistrée"
              successDescription="Merci. Votre réponse a bien été enregistrée pour le mariage de Mamisa & Marylin."
              onSubmitted={(updatedGuest) =>
                setGuestPreview({
                  ...currentGuest,
                  ...updatedGuest,
                  invitationUrl: currentGuest.invitationUrl,
                })
              }
            />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ÉPILOGUE — Clôture
      ══════════════════════════════════════════════════════ */}
      <footer className="px-6 py-16 text-center bg-secondary border-t border-border">
        <OrnamentRule opacity={0.5} />

        <div className="mt-10 mb-10">
          <p className="font-script text-6xl leading-none text-foreground">
            {mamisaMarylin.brand}
          </p>
          <p className="mt-5 text-[10px] uppercase tracking-[0.55em] text-muted-foreground">
            {mamisaMarylin.title} · 25 Juillet 2026 · Kinshasa
          </p>
          <p className="mt-7 mx-auto max-w-sm font-serif text-sm italic leading-7 text-muted-foreground/80">
            {mamisaMarylin.couple.statement}
          </p>
        </div>

        <OrnamentRule opacity={0.5} />
      </footer>
    </main>
  );
}
