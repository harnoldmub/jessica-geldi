import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import EventHome, { EventChooser } from "@/pages/Home";
import Invitation from "@/pages/Invitation";
import Admin from "@/pages/Admin";
import CheckIn from "@/pages/CheckIn";
import NotFound from "@/pages/NotFound";

function Router() {
  return (
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
