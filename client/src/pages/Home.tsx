import { useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { JessicaGeldi, weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";
import RsvpForm from "@/components/RsvpForm";
import Countdown from "@/components/Countdown";

import flowerStem from "../../images/pattern/flower-stem.png";

/* Programme en ordre chronologique */
const schedule = (Object.keys(weddingEvents) as WeddingEventKey[])
  .map((key) => weddingEvents[key])
  .sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());

const ease = [0.22, 1, 0.36, 1] as const;

/* ─── Monogramme JG (icône) ─── */
function MonogramMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 250" className={className} fill="none" aria-hidden>
      <ellipse cx="100" cy="118" rx="94" ry="116" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="100" cy="118" rx="84" ry="104" stroke="currentColor" strokeWidth="2" strokeDasharray="0.5 7" strokeLinecap="round" opacity="0.85" />
      <text x="101" y="156" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic" fontSize="118" fill="currentColor" letterSpacing="-6">JG</text>
    </svg>
  );
}

/* ─── Logo complet (icône + nom script) ─── */
function MonogramLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <MonogramMark className="h-28 w-auto" />
      <p className="mt-3 font-script text-4xl leading-none">Jessica &amp; Geldi</p>
    </div>
  );
}

/* ─── Placeholder photo cinématographique (prêt à recevoir les vraies photos N&B) ─── */
function PhotoFrame({ className = "", children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={`photo-frame grain relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <MonogramMark className="h-24 w-auto text-white/10" />
      </div>
      {children}
    </div>
  );
}

function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-body text-xs uppercase tracking-[0.42em] ${className}`}>{children}</p>;
}

function Reveal({ children, y = 22, delay = 0, className = "" }: { children: ReactNode; y?: number; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-5 ${className}`}>
      <span className="rule-fine w-16" />
      <span className="botanical block h-6 w-6" style={{ WebkitMaskImage: `url(${flowerStem})`, maskImage: `url(${flowerStem})`, backgroundColor: "currentColor" }} />
      <span className="rule-fine w-16" />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-6 py-5 text-left">
        <span className="font-serif text-lg md:text-xl">{q}</span>
        <span className="shrink-0 opacity-60 transition-transform duration-300" style={{ transform: open ? "rotate(90deg)" : "none" }}>
          {open ? <Minus className="h-4 w-4" strokeWidth={1.2} /> : <Plus className="h-4 w-4" strokeWidth={1.2} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden">
            <p className="pb-6 text-lg leading-8 text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Nav() {
  const links = [
    { href: "#histoire", label: "Histoire" },
    { href: "#programme", label: "Programme" },
    { href: "#rsvp", label: "RSVP" },
  ];
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease, delay: 1 }}
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-center"
    >
      <nav className="mt-5 flex items-center gap-8 border border-white/15 bg-black/25 px-7 py-2.5 text-white backdrop-blur-md">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="font-body text-[11px] uppercase tracking-[0.34em] text-white/80 transition-colors hover:text-white">
            {l.label}
          </a>
        ))}
      </nav>
    </motion.header>
  );
}

/* ─── Page ─── */
export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const isUpcoming = JessicaGeldi.weddingDate.getTime() > Date.now();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Nav />

      {/* ══════════════ HÉROS ══════════════ */}
      <section ref={heroRef} className="dark relative flex h-[100svh] min-h-[600px] items-center justify-center overflow-hidden bg-background text-foreground">
        <motion.div style={{ scale: heroScale }} className="photo-frame grain absolute inset-0">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
            <MonogramMark className="h-[70%] w-auto text-white" />
          </div>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        <motion.div style={{ y: heroTextY, opacity: heroFade }} className="relative z-10 flex flex-col items-center px-6 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, ease, delay: 0.2 }}>
            <MonogramMark className="h-40 w-auto md:h-52" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.7 }} className="mt-6 font-serif text-2xl uppercase tracking-[0.4em] md:text-3xl">
            Jessica &amp; Geldi
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.9 }} className="mt-4 font-body text-sm uppercase tracking-[0.5em] text-white/75">
            11 · 13 Février 2026
          </motion.p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center text-white/70">
          <p className="font-body text-[10px] uppercase tracking-[0.5em]">Défiler</p>
          <div className="mx-auto mt-3 h-10 w-px bg-white/40" />
        </motion.div>
      </section>

      {/* ══════════════ VOUS ÊTES INVITÉS ══════════════ */}
      <section className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <PhotoFrame className="aspect-[3/4] w-full" />
          </Reveal>
          <Reveal delay={0.12} className="text-center md:text-left">
            <p className="font-script text-5xl md:text-6xl">Vous êtes invités</p>
            <Ornament className="mt-8 text-foreground/40 md:justify-start" />
            <p className="mx-auto mt-8 max-w-md text-lg leading-8 text-muted-foreground md:mx-0">
              Avec nos familles, nous, <span className="text-foreground">Jessica &amp; Geldi</span>, avons la joie de vous convier à célébrer notre union.
            </p>
            <p className="mt-8 font-serif text-2xl md:text-3xl">Mercredi 11 &amp; Vendredi 13 Février 2026</p>
            <p className="mt-3 font-body text-xs uppercase tracking-[0.4em] text-muted-foreground">Kinshasa · République Démocratique du Congo</p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ COMPTE À REBOURS ══════════════ */}
      <section className="dark relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-background text-foreground">
        <PhotoFrame className="absolute inset-0" />
        <div className="absolute inset-0 bg-black/55" />
        <Reveal className="relative z-10 px-6 text-center text-white">
          <Label className="text-white/70">Dans l'attente du grand jour</Label>
          <div className="mt-10">
            {isUpcoming ? <Countdown target={JessicaGeldi.weddingDate} /> : <p className="font-serif text-4xl italic">Le grand jour est arrivé.</p>}
          </div>
          <p className="mt-10 font-serif text-xl italic text-white/80">Nous avons hâte de vous accueillir.</p>
        </Reveal>
      </section>

      {/* ══════════════ NOTRE HISTOIRE ══════════════ */}
      <section id="histoire" className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-4xl">
          <Reveal className="text-center">
            <Label className="text-muted-foreground">Notre histoire</Label>
            <h2 className="mt-6 font-serif text-4xl md:text-6xl">Comment tout a commencé</h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">{JessicaGeldi.couple.narrative}</p>
            <Ornament className="mt-10 text-foreground/40" />
          </Reveal>

          <div className="mt-20 space-y-20 md:space-y-28">
            {JessicaGeldi.story.map((chapter, i) => (
              <Reveal key={chapter.title} delay={0.05}>
                <div className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
                  <PhotoFrame className="aspect-[4/5] w-full" />
                  <div className={i % 2 === 1 ? "md:text-right" : ""}>
                    <p className="font-body text-xs uppercase tracking-[0.4em] text-muted-foreground">{chapter.period}</p>
                    <h3 className="mt-4 font-serif text-3xl md:text-4xl">{chapter.title}</h3>
                    <p className="mt-5 text-lg leading-8 text-muted-foreground">{chapter.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ LE PROGRAMME (sans couleur) ══════════════ */}
      <section id="programme" className="bg-secondary/50 px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-3xl">
          <Reveal className="mb-16 text-center">
            <Label className="text-muted-foreground">Le déroulé des festivités</Label>
            <h2 className="mt-6 font-serif text-4xl md:text-6xl">Le programme</h2>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
              Quatre rendez-vous sur deux journées. Votre invitation personnalisée précise les célébrations prévues pour vous.
            </p>
          </Reveal>

          <div className="divide-y divide-border border-y border-border">
            {schedule.map((event, i) => {
              const [day, ...rest] = event.date.split(" ");
              return (
                <Reveal key={event.key} delay={i * 0.06}>
                  <div className="grid grid-cols-[auto_1fr] items-baseline gap-6 py-8 md:grid-cols-[8rem_1fr_auto] md:gap-10">
                    <div className="text-center md:text-left">
                      <p className="font-serif text-3xl leading-none md:text-4xl">{event.time}</p>
                      <p className="mt-2 font-body text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{day} {rest.join(" ").replace(" 2026", "")}</p>
                    </div>
                    <div className="col-span-1">
                      <h3 className="font-serif text-2xl uppercase tracking-[0.12em] md:text-3xl">{event.label}</h3>
                      <p className="mt-2 text-base leading-7 text-muted-foreground">Thème : {event.theme} · Lieu à confirmer, Kinshasa.</p>
                    </div>
                    <p className="hidden font-body text-[10px] uppercase tracking-[0.32em] text-muted-foreground md:block">{event.shortLabel}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ RSVP (juste après le programme) ══════════════ */}
      <section id="rsvp" className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 text-center lg:text-left">
            <Reveal>
              <MonogramMark className="mx-auto h-24 w-auto text-foreground lg:mx-0" />
              <Label className="mt-8 text-muted-foreground">RSVP</Label>
              <h2 className="mt-5 font-serif text-4xl md:text-5xl">Serez-vous des nôtres&nbsp;?</h2>
              <p className="mx-auto mt-6 max-w-md text-lg leading-8 text-muted-foreground lg:mx-0">
                Une seule réponse à donner. Dites-nous si vous venez, choisissez la ou les célébrations
                auxquelles vous participerez, et ajoutez vos préférences.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1} y={30}>
            <RsvpForm
              title="Répondre à l'invitation"
              description="Dites-nous si vous serez présent(e). Si oui, sélectionnez la ou les célébrations, précisez si vous venez seul(e) ou en couple, et votre boisson souhaitée."
              submitLabel="Envoyer ma réponse"
              successDescription="Merci du fond du cœur. Votre réponse est bien enregistrée — nous avons hâte de célébrer avec vous."
            />
          </Reveal>
        </div>
      </section>

      {/* ══════════════ PRÉSENCE & CONTRIBUTION ══════════════ */}
      <section className="dark relative overflow-hidden bg-background px-6 py-24 text-center text-foreground md:px-10 md:py-28">
        <PhotoFrame className="absolute inset-0" />
        <div className="absolute inset-0 bg-black/60" />
        <Reveal className="relative z-10 mx-auto max-w-2xl text-white">
          <Label className="text-white/70">Présence &amp; contribution</Label>
          <p className="mt-8 font-serif text-3xl leading-snug md:text-5xl">Votre présence est notre plus beau cadeau.</p>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/75">
            Pour celles et ceux qui souhaitent nous témoigner une attention, une contribution
            en espèces pourra se faire directement lors des célébrations.
          </p>
        </Reveal>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section id="faq" className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-2xl">
          <Reveal className="mb-12 text-center">
            <Label className="text-muted-foreground">Bon à savoir</Label>
            <h2 className="mt-6 font-serif text-4xl md:text-5xl">Questions fréquentes</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="border-t border-border">
              {JessicaGeldi.faq.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="dark relative overflow-hidden bg-background px-6 py-20 text-center text-foreground md:px-10">
        <div className="relative">
          <MonogramLogo className="text-white" />
          <p className="mt-6 font-body text-[10px] uppercase tracking-[0.5em] text-white/55">11 &amp; 13 Février 2026 · Kinshasa</p>
          <p className="mx-auto mt-8 max-w-md text-lg italic leading-8 text-white/70">{JessicaGeldi.couple.statement}</p>
        </div>
      </footer>
    </main>
  );
}
