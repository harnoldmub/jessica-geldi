import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { CalendarDays, Clock, MapPin, ChevronDown } from "lucide-react";
import { type RsvpResponse } from "@shared/schema";
import { glodieSamuel } from "@shared/glodieSamuel";
import { Skeleton } from "@/components/ui/skeleton";
import heroImg from "../../images/hero.png";

type InvitationGuest = RsvpResponse & { invitationUrl: string };

const reveal = { duration: 1.0, ease: [0.22, 1, 0.36, 1] as const };

/* ─── Ornamental rule ─────────────────────────────────────── */
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
      className={`p-8 text-center editorial-shadow border ${dark ? "dark bg-background border-border" : "bg-background border-border"}`}
    >
      <Icon className="mx-auto h-5 w-5 text-muted-foreground" strokeWidth={1.4} />
      <p className="mt-5 text-[9px] uppercase tracking-[0.5em] text-muted-foreground/80">
        {label}
      </p>
      <p className="mt-3 font-serif text-xl leading-snug text-foreground">
        {value}
      </p>
    </motion.article>
  );
}

/* ─── Theme badge + color swatches ───────────────────────── */
function ThemeBadge({
  theme,
  note,
  colors,
  colorNames,
  dark = false,
}: {
  theme: string;
  note: string;
  colors: string[];
  colorNames: string[];
  dark?: boolean;
}) {
  return (
    <div className="mt-7 space-y-5">
      <div
        className={`inline-flex items-center gap-3 px-6 py-3 border ${
          dark ? "border-border bg-background/50" : "border-border bg-background"
        }`}
      >
        <span className="text-[9px] uppercase tracking-[0.52em] text-muted-foreground">
          Thème vestimentaire
        </span>
        <span className="h-4 w-px bg-border" />
        <span className="font-serif text-sm italic text-foreground">{theme}</span>
      </div>

      {/* Color swatches */}
      <div className="flex flex-wrap items-start justify-center gap-5">
        {colors.map((color, i) => {
          const isGold = color === "#FFD700";
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={`h-10 w-10 rounded-full shadow-md ring-1 ring-white/20 ${isGold ? "gold-shimmer-swatch" : ""}`}
                style={isGold ? {} : { backgroundColor: color }}
              />
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70">
                {colorNames[i]}
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] tracking-wide text-muted-foreground/80">{note}</p>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────── */
export default function Invitation() {
  const [, params] = useRoute("/invitation/:token");
  const token = params?.token;
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
  if (error || !guest || !token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-7 p-6 text-center bg-background">
        <OrnamentRule opacity={0.2} />
        <p className="font-script text-6xl text-foreground/80">{glodieSamuel.brand}</p>
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
        className="relative isolate overflow-hidden min-h-[100svh]"
      >
        {/* Hero photo en fond parallax */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 -z-10"
        >
          <img
            src={heroImg}
            alt="Glodie & Samuel"
            className="h-full w-full object-cover object-center scale-110"
          />
          <div className="absolute inset-0 bg-black/52" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-8 py-20 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-[10px] uppercase tracking-[0.62em] text-white/70"
          >
            {glodieSamuel.hero.eyebrow}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12"
          >
            <p className="font-serif text-base italic text-white/60">
              À l'attention de
            </p>
            <h1
              className="mt-2 font-serif leading-tight text-white"
              style={{ fontSize: "clamp(2rem, 6vw, 3.75rem)" }}
            >
              {guest.firstName} {guest.lastName}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10"
          >
            <p
              className="font-script leading-tight text-white/90"
              style={{ fontSize: "clamp(3.5rem, 10vw, 6rem)" }}
            >
              {glodieSamuel.title}
            </p>
            <p className="mt-3 font-serif text-xl md:text-2xl text-white/70">
              vous invitent à leur mariage
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="mt-16 flex flex-col items-center gap-2"
          >
            <p className="text-[9px] uppercase tracking-[0.58em] text-white/50">
              Découvrir
            </p>
            <ChevronDown className="h-4 w-4 animate-bounce text-white/70" strokeWidth={1.4} />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MARIAGE CIVIL & BÉNÉDICTION
      ══════════════════════════════════════════════════════ */}
      {(guest.ceremonyChoice === "civil" || guest.ceremonyChoice === "both" || !guest.ceremonyChoice) && (
      <section className="relative overflow-hidden bg-background">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-32">
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
            <h2
              className="mt-5 font-serif leading-tight text-foreground"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              {glodieSamuel.ceremony.blessing.label}
            </h2>
            <ThemeBadge
              theme={glodieSamuel.ceremony.blessing.theme}
              note={glodieSamuel.ceremony.blessing.themeNote}
              colors={glodieSamuel.dresscode.blessing.colors}
              colorNames={glodieSamuel.dresscode.blessing.colorNames}
            />
          </motion.div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <InfoCard icon={CalendarDays} label="Date" value={glodieSamuel.date.display} delay={0} />
            <InfoCard icon={Clock} label="Heure" value={glodieSamuel.ceremony.blessing.time} delay={0.08} />
            <InfoCard
              icon={MapPin}
              label="Lieu"
              value={`${glodieSamuel.venues[0].name} · ${glodieSamuel.venues[0].city}`}
              delay={0.16}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.9 }}
            transition={{ ...reveal, delay: 0.28 }}
            className="mt-7 text-center text-sm italic text-muted-foreground"
          >
            {glodieSamuel.venues[0].note}
          </motion.p>
        </div>
      </section>
      )}

      {/* ══════════════════════════════════════════════════════
          SOIRÉE DANSANTE
      ══════════════════════════════════════════════════════ */}
      {(guest.ceremonyChoice === "evening" || guest.ceremonyChoice === "both" || !guest.ceremonyChoice) && (
      <section className="relative overflow-hidden dark bg-background">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 110%, hsl(var(--primary)/0.1) 0%, transparent 55%), radial-gradient(ellipse at 15% 45%, hsl(var(--primary)/0.05) 0%, transparent 38%)",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-32">
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
            <h2
              className="mt-5 font-serif leading-tight text-foreground"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              {glodieSamuel.ceremony.evening.label}
            </h2>
            <ThemeBadge
              theme={glodieSamuel.ceremony.evening.theme}
              note={glodieSamuel.ceremony.evening.themeNote}
              colors={glodieSamuel.dresscode.evening.colors}
              colorNames={glodieSamuel.dresscode.evening.colorNames}
              dark
            />
          </motion.div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <InfoCard icon={CalendarDays} label="Date" value={glodieSamuel.secondDate.display} dark delay={0} />
            <InfoCard icon={Clock} label="Heure" value={glodieSamuel.ceremony.evening.time} dark delay={0.08} />
            <InfoCard
              icon={MapPin}
              label="Lieu"
              value={`${glodieSamuel.venues[1].name} · ${glodieSamuel.venues[1].city}`}
              dark
              delay={0.16}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.9 }}
            transition={{ ...reveal, delay: 0.28 }}
            className="mt-7 text-center text-sm italic text-muted-foreground"
          >
            {glodieSamuel.venues[1].note}
          </motion.p>

          {/* Theme de soiree */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ ...reveal, delay: 0.38 }}
            className="mt-12 border-t border-border pt-10 text-center"
          >
            <p className="text-[9px] uppercase tracking-[0.58em] text-muted-foreground/60">
              Soiree · 19h30
            </p>
            <p className="mt-3 font-serif text-2xl italic text-primary/80">
              Blanc & doree
            </p>
            <p className="mt-4 mx-auto max-w-sm text-sm leading-7 text-muted-foreground">
              Pour la fete, les invites sont attendus dans le theme blanc et doree.
            </p>
          </motion.div>
        </div>
      </section>
      )}

      {/* ══════════════════════════════════════════════════════
          VERSETS BIBLIQUES
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-background">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28 space-y-12">
          {[
            {
              text: "Deux valent mieux qu'un, parce qu'ils retirent un meilleur salaire de leur travail. Car s'ils tombent, l'un relève l'autre ; mais malheur à celui qui est seul et qui tombe, sans avoir un second pour le relever.",
              ref: "Ecclésiaste 4 : 9–10",
            },
            {
              text: "Ainsi ils ne sont plus deux, mais ils ne font qu'une seule chair. Que l'homme donc ne sépare pas ce que Dieu a joint.",
              ref: "Matthieu 19 : 6",
            },
          ].map((verse, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ ...reveal, delay: i * 0.12 }}
              className="relative pl-6 border-l-0"
            >
              <span className="absolute -top-3 left-0 font-serif text-5xl leading-none text-primary/15 select-none">"</span>
              <blockquote className="font-serif text-lg md:text-xl leading-9 italic text-foreground/75">
                « {verse.text} »
              </blockquote>
              <p className="mt-5 text-[10px] uppercase tracking-[0.45em] text-muted-foreground/50">
                — {verse.ref}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          INFOS INVITÉ — Places réservées
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-background">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={reveal}
            className="space-y-8"
          >
            <OrnamentRule opacity={0.35} />

            <div>
              <p className="text-[10px] uppercase tracking-[0.55em] text-primary">
                Votre place
              </p>
              <h2
                className="mt-5 font-serif leading-tight text-foreground"
                style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
              >
                {guest.firstName} {guest.lastName}
              </h2>

              {/* Infos de participation */}
              <div className="mt-6 flex flex-col items-center gap-3">
                {/* Cérémonie(s) */}
                {(() => {
                  const c = guest.ceremonyChoice || "both";
                  const items =
                    c === "civil"
                      ? [{ label: "Mariage civil & Coutumier", time: "10h30 / 19h00" }]
                      : c === "evening"
                        ? [{ label: "Mariage religieux", time: "19h30" }]
                        : [
                            { label: "Mariage civil & Coutumier", time: "10h30 / 19h00" },
                            { label: "Mariage religieux", time: "19h30" },
                          ];
                  return (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {items.map((item) => (
                        <div
                          key={item.label}
                          className="inline-flex items-center gap-3 border border-border px-5 py-3"
                        >
                          <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="h-4 w-px bg-border" />
                          <span className="font-serif text-lg text-foreground">
                            {item.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Nombre de personnes */}
                <div className="inline-flex items-center gap-3 border border-border px-5 py-3">
                  <span className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground">
                    {(guest.guestCount || 1) === 1 ? "Seul(e)" : "En couple"}
                  </span>
                  <span className="h-4 w-px bg-border" />
                  <span className="font-serif text-lg text-foreground">
                    {guest.guestCount || 1} personne{(guest.guestCount || 1) > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {guest.status === "confirmed" && (
                <p className="mt-5 text-[10px] uppercase tracking-[0.45em] text-emerald-600">
                  ✓ Présence confirmée
                </p>
              )}
            </div>

            <p className="mx-auto max-w-md font-serif text-base italic leading-8 text-muted-foreground">
              {glodieSamuel.couple.statement}
            </p>

            <OrnamentRule opacity={0.35} />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ÉPILOGUE
      ══════════════════════════════════════════════════════ */}
      <footer className="px-6 py-16 text-center bg-secondary border-t border-border">
        <OrnamentRule opacity={0.5} />
        <div className="mt-10 mb-10">
          <p className="font-script text-6xl leading-none text-foreground">
            {glodieSamuel.brand}
          </p>
          <p className="mt-5 text-[10px] uppercase tracking-[0.55em] text-muted-foreground">
            {glodieSamuel.title} · 04 Juillet & 12 Juillet 2026 · Kinshasa
          </p>
          <p className="mt-7 mx-auto max-w-sm font-serif text-sm italic leading-7 text-muted-foreground/80">
            Avec joie, nous vous attendons.
          </p>
        </div>
        <OrnamentRule opacity={0.5} />
      </footer>
    </main>
  );
}
