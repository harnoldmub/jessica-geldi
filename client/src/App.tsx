import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Une page = un fichier JavaScript : l'invitation envoyée aux invités (souvent en 3G/4G à Kinshasa)
// ne télécharge ni l'admin ni le site.
const EventHome = lazy(() => import("@/pages/Home"));
const EventChooser = lazy(() => import("@/pages/Home").then((m) => ({ default: m.EventChooser })));
const Invitation = lazy(() => import("@/pages/Invitation"));
const Admin = lazy(() => import("@/pages/Admin"));
const CheckIn = lazy(() => import("@/pages/CheckIn"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function PageLoading() {
  return <div className="min-h-dvh bg-[#2b2522]" aria-busy="true" />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Switch>
        <Route path="/" component={EventChooser} />
        <Route path="/coutumier">{() => <EventHome eventKey="customary" />}</Route>
        <Route path="/civil">{() => <EventHome eventKey="civil" />}</Route>
        <Route path="/soiree">{() => <EventHome eventKey="evening" />}</Route>
        <Route path="/rsvp" component={EventChooser} />
        <Route path="/invitation/:token/:date" component={Invitation} />
        <Route path="/invitation/:token" component={Invitation} />
        <Route path="/admin" component={Admin} />
        <Route path="/accueil" component={Admin} />
        <Route path="/checkin" component={CheckIn} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}
