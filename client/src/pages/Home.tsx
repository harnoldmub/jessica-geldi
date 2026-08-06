import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, MapPin, Gift, Plus, Minus, ChevronDown } from "lucide-react";
import { JessicaGeldi, weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";
import RsvpForm from "@/components/RsvpForm";
import Countdown from "@/components/Countdown";

import flowerStem from "../../images/pattern/flower-stem.png";
import peony from "../../images/pattern/peony.png";
import roseOpen from "../../images/pattern/rose-open.png";
import roseBud from "../../images/pattern/rose-bud.png";

const flowers = [flowerStem, peony, roseOpen, roseBud];
const eventFlower: Record<WeddingEventKey, string> = {
  civil: roseBud,
  customary: flowerStem,
  religious: peony,
  reception: roseOpen,
};

/* Programme en ordre chronologique */
const timeline = (Object.keys(weddingEvents) as WeddingEventKey[])
  .map((key) => weddingEvents[key])
  .sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = { duration: 0.9, ease };

/* ─── Motif botanique (le line-art PNG sert de masque, teinté à volonté) ─── */
function Botanical({
  src,
  tint = "hsl(var(--primary))",
  className = "",
  style,
}: {
  src: string;
  tint?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={`botanical block ${className}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        backgroundColor: tint,
        ...style,
      }}
    />
  );
}

/* ─── Reveal on scroll ─── */
function Reveal({
  children,
  y = 26,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  y?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ ...reveal, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[10px] uppercase tracking-[0.55em] ${className}`}>{children}</p>;
}

function Monogram({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-24 w-24" : size === "sm" ? "h-14 w-14" : "h-20 w-20";
  const script = size === "lg" ? "text-4xl" : size === "sm" ? "text-2xl" : "text-3xl";
  return (
    <div className={`relative flex ${dims} items-center justify-center rounded-full border border-primary/40 text-primary`}>
      <span className="absolute inset-1.5 rounded-full border border-current opacity-40" />
      <div className="text-center leading-none">
        <p className={`font-script ${script}`}>J&amp;G</p>
        <p className="mt-1 text-[7px] uppercase tracking-[0.3em] opacity-70">2026</p>
      </div>
    </div>
  );
}

/* ─── FAQ ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-6 py-5 text-left">
        <span className="font-serif text-lg text-foreground md:text-xl">{q}</span>
        <span className="shrink-0 text-primary transition-transform duration-300" style={{ transform: open ? "rotate(90deg)" : "none" }}>
          {open ? <Minus className="h-4 w-4" strokeWidth={1.4} /> : <Plus className="h-4 w-4" strokeWidth={1.4} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="overflow-hidden"
          >
            <p className="pb-6 font-body text-lg leading-8 text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Nav ─── */
function Nav() {
  const links = [
    { href: "#programme", label: "Programme" },
    { href: "#couleurs", label: "Couleurs" },
    { href: "#faq", label: "Infos" },
  ];
  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease, delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-40"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 border border-white/10 bg-[#181513]/70 px-4 py-2.5 backdrop-blur-xl md:my-3 md:rounded-full md:px-6">
        <a href="#top" className="font-script text-2xl leading-none text-primary">J&amp;G</a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-[10px] uppercase tracking-[0.32em] text-foreground/70 transition-colors hover:text-primary">
              {l.label}
            </a>
          ))}
        </nav>
        <a href="#rsvp" className="rounded-full bg-primary px-5 py-2 text-[9px] uppercase tracking-[0.3em] text-primary-foreground transition-colors hover:brightness-110">
          RSVP
        </a>
      </div>
    </motion.header>
  );
}

/* ─── Timeline item ─── */
function TimelineItem({ event, index }: { event: (typeof timeline)[number]; index: number }) {
  const [day, ...rest] = event.date.split(" ");
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ ...reveal, delay: index * 0.08 }}
      className="relative pl-12 md:pl-16"
    >
      {/* nœud */}
      <span className="absolute left-0 top-1.5 flex h-5 w-5 -translate-x-1/2 items-center justify-center">
        <span className="absolute inset-0 rounded-full opacity-30" style={{ background: event.accent }} />
        <span className="h-2.5 w-2.5 rounded-full ring-4 ring-background" style={{ background: event.accent }} />
      </span>

      <div className="group relative overflow-hidden border border-border bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/40 md:p-8">
        <Botanical
          src={eventFlower[event.key]}
          tint={event.accent}
          className="absolute -right-6 -top-8 h-40 w-40 opacity-[0.12] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6"
        />
        <div className="relative flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-serif text-2xl text-foreground">{event.time}</span>
          <span className="text-[10px] uppercase tracking-[0.32em]" style={{ color: event.accent }}>
            {day} {rest.join(" ").replace(" 2026", "")}
          </span>
        </div>
        <h3 className="relative mt-2 font-serif text-3xl text-foreground md:text-4xl">{event.label}</h3>
        <p className="relative mt-1 text-[11px] uppercase tracking-[0.3em]" style={{ color: event.accent }}>
          Thème · {event.theme}
        </p>
        <p className="relative mt-4 max-w-xl font-body text-lg leading-7 text-muted-foreground">{event.themeNote}</p>

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {event.palette.map((color, i) => (
              <span key={`${color}-${i}`} title={event.colorNames[i]} className="h-6 w-6 rounded-full border border-white/15 shadow-sm" style={{ background: color }} />
            ))}
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" style={{ color: event.accent }} /> Lieu à confirmer · Kinshasa
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ─── */
export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroScroll, [0, 1], ["0%", "22%"]);
  const heroFade = useTransform(heroScroll, [0, 0.85], [1, 0]);

  const isUpcoming = JessicaGeldi.weddingDate.getTime() > Date.now();
  const marquee = "Jessica & Geldi · 11 · 13 Février 2026 · Kinshasa · ";

  return (
    <main id="top" className="dark relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* barre de progression */}
      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-primary via-accent to-sage" />

      <Nav />

      {/* ══════════════ HÉROS ══════════════ */}
      <section
        ref={heroRef}
        className="paper-grain relative flex min-h-[100svh] items-center overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 100% at 15% 12%, #211a17 0%, #17110f 45%, #1a1016 76%, #100c12 100%)",
        }}
      >
        <Botanical src={peony} tint="hsl(var(--primary))" className="absolute left-[4%] top-[16%] h-40 w-40 opacity-[0.14] animate-drift" />
        <Botanical src={roseOpen} tint="hsl(var(--sage))" className="absolute right-[6%] top-[10%] hidden h-52 w-52 opacity-[0.12] animate-float-slow md:block" />
        <Botanical src={roseBud} tint="hsl(var(--accent))" className="absolute bottom-[8%] left-[10%] hidden h-36 w-36 opacity-[0.14] animate-sway md:block" />
        <Botanical src={flowerStem} tint="hsl(var(--primary))" className="absolute -right-6 bottom-[6%] h-64 w-40 opacity-[0.1] animate-float" />

        <motion.div style={{ y: heroY, opacity: heroFade }} className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-28 md:grid-cols-[1.05fr_.95fr] md:px-10">
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...reveal, delay: 0.15 }}>
              <Eyebrow className="text-primary/80">Save the Date · Invitation officielle</Eyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.25, ease }}
              className="mt-6 font-script leading-[0.9] text-foreground"
              style={{ fontSize: "clamp(4.2rem, 11vw, 8.5rem)" }}
            >
              Jessica
              <span className="mx-2 align-middle text-[0.55em] text-primary">&amp;</span>
              Geldi
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="mt-6 max-w-md font-body text-xl leading-relaxed text-foreground/75">
              {JessicaGeldi.tagline}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.7 }} className="mt-10">
              <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-primary/70">
                {isUpcoming ? "Le grand jour approche" : "Rendez-vous les 11 & 13 février"}
              </p>
              {isUpcoming ? (
                <Countdown target={JessicaGeldi.weddingDate} dark />
              ) : (
                <p className="font-serif text-3xl text-foreground md:text-4xl">11 &amp; 13 Février 2026 · Kinshasa</p>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.9 }} className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#rsvp" className="inline-flex items-center gap-3 bg-primary px-9 py-4 text-[10px] uppercase tracking-[0.4em] text-primary-foreground transition-all hover:-translate-y-0.5 hover:brightness-110">
                Confirmer ma présence
              </a>
              <a href="#programme" className="text-[10px] uppercase tracking-[0.4em] text-foreground/60 underline-offset-8 transition hover:text-primary hover:underline">
                Voir le programme
              </a>
            </motion.div>
          </div>

          {/* composition florale */}
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.35, ease }} className="relative mx-auto hidden aspect-[4/5] w-full max-w-sm md:block">
            <div className="absolute inset-0 rounded-[999px_999px_16px_16px] border border-primary/25 bg-white/[0.03] backdrop-blur-sm editorial-shadow" />
            <div className="absolute inset-6 rounded-[999px_999px_10px_10px] border border-primary/15" />
            <Botanical src={roseOpen} tint="hsl(var(--primary))" className="absolute left-1/2 top-10 h-40 w-40 -translate-x-1/2 opacity-80 animate-float-slow" />
            <Botanical src={peony} tint="hsl(var(--sage))" className="absolute bottom-16 left-8 h-28 w-28 opacity-80 animate-sway" />
            <Botanical src={roseBud} tint="hsl(var(--accent))" className="absolute bottom-24 right-8 h-24 w-24 opacity-80 animate-float" />
            <div className="absolute inset-x-0 bottom-10 text-center">
              <p className="font-serif text-2xl text-foreground">11 · 13 Février</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.4em] text-primary/80">Kinshasa · 2026</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="absolute inset-x-0 bottom-6 flex justify-center">
          <ChevronDown className="h-5 w-5 animate-bounce text-primary/50" strokeWidth={1.3} />
        </motion.div>
      </section>

      {/* ══════════════ MARQUEE ══════════════ */}
      <div className="overflow-hidden border-y border-border bg-secondary/50 py-4">
        <div className="flex w-max animate-marquee whitespace-nowrap">
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="flex items-center">
                  <span className="mx-6 font-serif text-lg tracking-wide text-foreground/70">{marquee}</span>
                  <Botanical src={flowers[i % flowers.length]} tint="hsl(var(--primary))" className="h-5 w-5 opacity-80" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ INTRO ══════════════ */}
      <section className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32">
        <Botanical src={flowerStem} tint="hsl(var(--sage))" className="absolute -left-10 top-10 h-72 w-40 opacity-[0.08] animate-float-slow" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal><Eyebrow className="text-primary">Notre promesse</Eyebrow></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-6 font-serif text-4xl leading-tight text-foreground md:text-6xl">
              Quatre célébrations,<br />une même histoire d'amour.
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-7 max-w-2xl font-body text-xl leading-8 text-muted-foreground">{JessicaGeldi.couple.narrative}</p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="ornamental-divider mx-auto mt-10 max-w-xs text-primary">
              <Botanical src={roseBud} tint="hsl(var(--primary))" className="h-8 w-8 opacity-90" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ PROGRAMME · TIMELINE ══════════════ */}
      <section id="programme" className="relative overflow-hidden bg-secondary/40 px-6 py-24 md:px-10 md:py-32">
        <Botanical src={peony} tint="hsl(var(--primary))" className="absolute -right-16 top-24 h-80 w-80 opacity-[0.06] animate-drift" />
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <Reveal><Eyebrow className="text-primary">Le déroulé</Eyebrow></Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-6 font-serif text-4xl text-foreground md:text-6xl">Le programme</h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-7 text-muted-foreground">
                Quatre rendez-vous sur deux journées. Votre invitation personnalisée précise les célébrations prévues pour vous.
              </p>
            </Reveal>
          </div>

          <div className="relative">
            {/* ligne verticale */}
            <div className="absolute bottom-2 left-0 top-2 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
            <div className="space-y-8">
              {timeline.map((event, i) => (
                <TimelineItem key={event.key} event={event} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ RSVP (unique, juste après le programme) ══════════════ */}
      <section
        id="rsvp"
        className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32"
        style={{ background: "radial-gradient(120% 90% at 85% 8%, #23181d 0%, #151210 55%)" }}
      >
        <Botanical src={roseBud} tint="hsl(var(--primary))" className="absolute left-[6%] top-[12%] hidden h-40 w-40 opacity-[0.1] animate-float md:block" />
        <Botanical src={flowerStem} tint="hsl(var(--sage))" className="absolute -right-8 bottom-8 h-72 w-44 opacity-[0.08] animate-float-slow" />
        <div className="relative mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div className="lg:sticky lg:top-28">
            <Reveal><Monogram size="lg" /></Reveal>
            <Reveal delay={0.08}><Eyebrow className="mt-8 text-primary">RSVP</Eyebrow></Reveal>
            <Reveal delay={0.14}>
              <h2 className="mt-5 font-serif text-4xl leading-tight text-foreground md:text-5xl">Serez-vous des nôtres&nbsp;?</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-md font-body text-lg leading-8 text-muted-foreground">
                Une seule réponse à donner. Dites-nous si vous venez, choisissez la ou les célébrations
                et ajoutez vos préférences — nous préparerons chaque instant avec soin.
              </p>
            </Reveal>
            <Reveal delay={0.26}>
              <div className="mt-8 space-y-3 border-l-2 border-primary/30 pl-5">
                <p className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" /> {JessicaGeldi.date.display} — {JessicaGeldi.date.time}
                </p>
                <p className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" /> {JessicaGeldi.secondDate.display} — {JessicaGeldi.secondDate.time}
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12} y={34}>
            <RsvpForm
              title="Répondre à l'invitation"
              description="Dites-nous si vous serez présent(e). Si oui, sélectionnez la ou les célébrations, précisez si vous venez seul(e) ou en couple, et votre boisson souhaitée."
              submitLabel="Envoyer ma réponse"
              successDescription="Merci du fond du cœur. Votre réponse est bien enregistrée — nous avons hâte de célébrer avec vous."
            />
          </Reveal>
        </div>
      </section>

      {/* ══════════════ COULEURS / DRESS CODE ══════════════ */}
      <section id="couleurs" className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32">
        <Botanical src={roseOpen} tint="hsl(var(--primary))" className="absolute -left-12 top-16 h-72 w-72 opacity-[0.06] animate-drift" />
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <Reveal><Eyebrow className="text-primary">Dress code</Eyebrow></Reveal>
            <Reveal delay={0.08}><h2 className="mt-6 font-serif text-4xl text-foreground md:text-6xl">Les couleurs de la fête</h2></Reveal>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map((event, i) => (
              <Reveal key={event.key} delay={i * 0.07}>
                <div className="group h-full border border-border bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:editorial-shadow">
                  <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: event.accent }}>{event.shortLabel}</p>
                  <h3 className="mt-2 font-serif text-2xl text-foreground">{event.theme}</h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {event.palette.map((color, idx) => (
                      <span key={`${color}-${idx}`} className="block h-9 w-9 rounded-full border border-white/15 shadow-sm" style={{ background: color }} title={event.colorNames[idx]} />
                    ))}
                  </div>
                  <p className="mt-5 font-body text-base leading-6 text-muted-foreground">{event.colorNames.join(" · ")}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CAGNOTTE ══════════════ */}
      <section className="relative overflow-hidden bg-secondary/60 px-6 py-24 text-center md:px-10 md:py-28">
        <Botanical src={roseOpen} tint="hsl(var(--accent))" className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 opacity-[0.06] animate-spin-slow" />
        <div className="relative mx-auto max-w-2xl">
          <Reveal>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 text-primary">
              <Gift className="h-6 w-6" strokeWidth={1.4} />
            </div>
          </Reveal>
          <Reveal delay={0.08}><p className="mt-8 text-[10px] uppercase tracking-[0.5em] text-primary">Présence & contribution</p></Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 font-serif text-3xl leading-snug text-foreground md:text-5xl">Votre présence est notre plus beau cadeau.</p>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-8 text-muted-foreground">
              Pour celles et ceux qui souhaitent nous témoigner une attention, une contribution
              en espèces pourra se faire directement lors des célébrations.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section id="faq" className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <Reveal><Eyebrow className="text-primary">Bon à savoir</Eyebrow></Reveal>
            <Reveal delay={0.08}><h2 className="mt-6 font-serif text-4xl text-foreground md:text-5xl">Questions fréquentes</h2></Reveal>
          </div>
          <Reveal delay={0.12}>
            <div className="border-t border-border">
              {JessicaGeldi.faq.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="relative overflow-hidden border-t border-border bg-[#0d0a09] px-6 py-20 text-center md:px-10">
        <Botanical src={peony} tint="hsl(var(--accent))" className="absolute left-[8%] top-10 h-28 w-28 opacity-[0.09] animate-sway" />
        <Botanical src={roseOpen} tint="hsl(var(--accent))" className="absolute right-[8%] bottom-10 h-32 w-32 opacity-[0.09] animate-float" />
        <div className="relative">
          <Monogram size="md" />
          <p className="mt-8 font-script text-6xl text-foreground">Jessica &amp; Geldi</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.5em] text-muted-foreground">11 &amp; 13 Février 2026 · Kinshasa</p>
          <p className="mx-auto mt-8 max-w-md font-body text-lg italic leading-8 text-muted-foreground">{JessicaGeldi.couple.statement}</p>
        </div>
      </footer>
    </main>
  );
}
