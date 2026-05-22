import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Home from "@/pages/Home";
import RSVP from "@/pages/RSVP";
import Invitation from "@/pages/Invitation";
import Admin from "@/pages/Admin";
import CheckIn from "@/pages/CheckIn";
import NotFound from "@/pages/NotFound";

const SITE_ACCESS_CODE = "LoveMM2026";
const SITE_ACCESS_STORAGE_KEY = "mamisa-marylin-site-access";

function SiteAccessGate({ children }: { children: React.ReactNode }) {
  const isAdminRoute = window.location.pathname === "/admin" || window.location.pathname === "/accueil" || window.location.pathname === "/checkin";
  const [isUnlocked, setIsUnlocked] = useState(isAdminRoute);
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdminRoute) return;
    setIsUnlocked(window.sessionStorage.getItem(SITE_ACCESS_STORAGE_KEY) === "granted");
  }, [isAdminRoute]);

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-md border border-border bg-white p-8 text-center editorial-shadow md:p-10">
        <p className="text-[11px] uppercase tracking-[0.45em] text-primary/65">
          Mamisa & Marylin
        </p>
        <h1 className="mt-5 font-serif text-4xl text-foreground md:text-5xl">
          Accès privé
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-foreground/68">
          Entrez le code reçu avec l'invitation pour accéder au site.
        </p>

        <form
          className="mt-8 space-y-5 text-left"
          onSubmit={(event) => {
            event.preventDefault();
            if (accessCode.trim() === SITE_ACCESS_CODE) {
              window.sessionStorage.setItem(SITE_ACCESS_STORAGE_KEY, "granted");
              setIsUnlocked(true);
              setError("");
              return;
            }
            setError("Code incorrect. Veuillez vérifier le code reçu avec l'invitation.");
          }}
        >
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
              Code d'accès
            </label>
            <Input
              value={accessCode}
              onChange={(event) => {
                setAccessCode(event.target.value);
                setError("");
              }}
              className="h-12 rounded-none border-primary/15 bg-transparent text-center tracking-[0.25em] focus-visible:ring-primary/20"
              placeholder="Entrez votre code"
            />
            {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
          </div>

          <Button
            type="submit"
            className="w-full rounded-none bg-primary py-7 text-[10px] uppercase tracking-[0.4em] text-primary-foreground hover:bg-foreground"
          >
            Entrer
          </Button>
        </form>
      </section>
    </main>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/rsvp" component={RSVP} />
      <Route path="/invitation/:token" component={Invitation} />
      <Route path="/admin" component={Admin} />
      <Route path="/accueil" component={Admin} />
      <Route path="/checkin" component={CheckIn} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SiteAccessGate>
        <Router />
      </SiteAccessGate>
      <Toaster />
    </QueryClientProvider>
  );
}
