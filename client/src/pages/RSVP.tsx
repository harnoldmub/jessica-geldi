import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import RsvpForm from "@/components/RsvpForm";

export default function RSVP() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-primary/70 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
          Retour à l'invitation
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <section className="space-y-6">
            <p className="text-[11px] uppercase tracking-[0.45em] text-primary/60">
              RSVP
            </p>
            <h1 className="font-serif text-4xl leading-tight text-foreground md:text-6xl">
              Une réponse simple pour Jessica & Geldi.
            </h1>
            <p className="max-w-xl text-base leading-8 text-foreground/72">
              Cette page reste disponible si vous souhaitez partager un lien
              RSVP direct, mais le formulaire est aussi intégré à l'invitation
              officielle de Jessica & Geldi.
            </p>
          </section>

          <RsvpForm variant="page" />
        </div>
      </div>
    </main>
  );
}
