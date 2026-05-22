import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Copy,
  Download,
  Loader2,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { Link } from "wouter";
import {
  type AdminGuestInput,
  type RsvpResponse,
  type SafeUser,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type GuestRecord = RsvpResponse & {
  invitationUrl?: string;
  invitationStatus?: "draft" | "sent";
};

type GuestFormState = AdminGuestInput;

const emptyGuestForm: GuestFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  status: "pending",
  guestCount: 1,
  mealChoice: "",
  message: "",
};

async function getCurrentUser() {
  const res = await fetch("/api/user", {
    credentials: "include",
  });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Serveur API indisponible. Vérifiez que le backend est lancé et configuré.");
    }

    const error = await res.json();
    throw new Error(error.message || "Impossible de vérifier la session.");
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Serveur API indisponible. Vérifiez que le backend est lancé et configuré.");
  }

  return (await res.json()) as SafeUser;
}

export default function Admin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "declined">("all");
  const [invitationFilter, setInvitationFilter] = useState<"all" | "draft" | "sent">("all");
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [guestForm, setGuestForm] = useState<GuestFormState>(emptyGuestForm);
  const [editingGuestId, setEditingGuestId] = useState<number | null>(null);

  const { data: user, isLoading: isCheckingSession } = useQuery<SafeUser | null>({
    queryKey: ["/api/user"],
    queryFn: getCurrentUser,
  });

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<GuestRecord[]>({
    queryKey: ["/api/admin/guests"],
    enabled: Boolean(user),
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/login", credentials);
      return (await response.json()) as SafeUser;
    },
    onSuccess: (loggedUser) => {
      queryClient.setQueryData(["/api/user"], loggedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'espace administrateur.",
      });
      setCredentials((current) => ({ ...current, password: "" }));
    },
    onError: (error: Error) => {
      toast({
        title: "Connexion impossible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.removeQueries({ queryKey: ["/api/admin/guests"] });
      toast({
        title: "Déconnecté",
        description: "La session administrateur est maintenant fermée.",
      });
    },
  });

  const saveGuestMutation = useMutation({
    mutationFn: async () => {
      const endpoint = editingGuestId
        ? `/api/admin/guests/${editingGuestId}`
        : "/api/admin/guests";
      const method = editingGuestId ? "PATCH" : "POST";
      const response = await apiRequest(method, endpoint, guestForm);
      return (await response.json()) as GuestRecord;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({
        title: editingGuestId ? "Invité mis à jour" : "Invité ajouté",
        description: editingGuestId
          ? "Les informations et le lien restent à jour."
          : "Le lien d'invitation personnalisé est prêt à être partagé.",
      });
      setGuestForm(emptyGuestForm);
      setEditingGuestId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Impossible d'enregistrer l'invité",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: async (guestId: number) => {
      await apiRequest("DELETE", `/api/admin/guests/${guestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({
        title: "Invité supprimé",
        description: "L'invité a été retiré de la liste.",
      });
      setGuestForm(emptyGuestForm);
      setEditingGuestId(null);
    },
  });

  const regenerateLinkMutation = useMutation({
    mutationFn: async (guestId: number) => {
      const response = await apiRequest("POST", `/api/admin/guests/${guestId}/regenerate-link`);
      return (await response.json()) as GuestRecord;
    },
    onSuccess: async (guest) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      if (guest.invitationUrl) {
        await navigator.clipboard.writeText(guest.invitationUrl);
      }
      toast({
        title: "Lien régénéré",
        description: "Le nouveau lien d'invitation a été copié.",
      });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/rsvp/${id}/check-in`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({
        title: "Présence enregistrée",
        description: "Le check-in de l'invité a été validé.",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (guestId: number) => {
      const response = await apiRequest("PATCH", `/api/admin/guests/${guestId}`, { status: "declined" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({ title: "Invité marqué comme indisponible" });
    },
  });

  const stats = {
    totalInvites: guests.length,
    pendingInvites: guests.filter((guest) => guest.status === "pending").length,
    confirmedInvites: guests.filter((guest) => guest.status === "confirmed").length,
    declinedInvites: guests.filter((guest) => guest.status === "declined").length,
    sentInvitations: guests.filter((guest) => guest.invitationStatus === "sent").length,
    attendingGuests: guests
      .filter((guest) => guest.status === "confirmed")
      .reduce((sum, guest) => sum + (guest.guestCount || 1), 0),
  };

  const filteredGuests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return guests.filter((guest) => {
      const matchesStatus = statusFilter === "all" || guest.status === statusFilter;
      const matchesInvitation =
        invitationFilter === "all" || guest.invitationStatus === invitationFilter;

      if (!matchesStatus || !matchesInvitation) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [
        guest.firstName,
        guest.lastName,
        guest.email || "",
        guest.phone || "",
        guest.status,
        guest.invitationStatus || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [guests, invitationFilter, searchTerm, statusFilter]);

  async function copyInvitationLink(guest: GuestRecord) {
    const invitationUrl =
      guest.invitationUrl || `${window.location.origin}/invitation/${guest.token}`;
    await navigator.clipboard.writeText(invitationUrl);
    await apiRequest("POST", `/api/admin/guests/${guest.id}/mark-sent`);
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
    toast({
      title: "Lien copié",
      description: "Le lien d'invitation est prêt à être partagé et l'envoi a été enregistré.",
    });
  }

  function shareViaWhatsApp(guest: GuestRecord) {
    const url =
      guest.invitationUrl || `${window.location.origin}/invitation/${guest.token}`;
    const message =
      `Bonjour ${guest.firstName} 👋\n\n` +
      `Nous avons la joie de vous inviter au mariage de *Mamisa & Marylin*, le *25 juillet 2026* à Kinshasa.\n\n` +
      `Voici votre invitation personnelle :\n${url}\n\n` +
      `Avec joie de vous avoir parmi nous 💍`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    apiRequest("POST", `/api/admin/guests/${guest.id}/mark-sent`).then(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
    });
  }

  function startEditingGuest(guest: GuestRecord) {
    setEditingGuestId(guest.id);
    setGuestForm({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email || "",
      phone: guest.phone || "",
      status: guest.status as GuestFormState["status"],
      guestCount: guest.guestCount || 1,
      mealChoice: guest.mealChoice || "",
      message: guest.message || "",
    });
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" strokeWidth={1.5} />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 md:px-10 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="overflow-hidden bg-[#101011] p-8 text-white md:p-12">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">
              Espace admin
            </p>
            <h1 className="mt-6 font-serif text-4xl leading-tight md:text-6xl">
              Gérer les invités de Mamisa & Marylin avec précision.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-8 text-white/72">
              Créez les invités, générez leurs liens d'invitation individuels,
              suivez les réponses RSVP et pilotez la présence depuis un tableau
              de bord privé.
            </p>
          </section>

          <section className="border border-primary/10 bg-white p-8 editorial-shadow md:p-12">
            <div className="mb-10">
              <div className="mb-4 flex items-center gap-3 text-primary">
                <LockKeyhole className="h-5 w-5" strokeWidth={1.6} />
                <p className="text-[11px] uppercase tracking-[0.45em] text-primary/65">
                  Connexion
                </p>
              </div>
              <h2 className="font-serif text-3xl text-foreground md:text-4xl">
                Accès administrateur
              </h2>
            </div>

            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                loginMutation.mutate();
              }}
            >
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                  Identifiant
                </label>
                <Input
                  value={credentials.username}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
                  placeholder="Nom d'utilisateur"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                  Code d'accès
                </label>
                <Input
                  type="password"
                  value={credentials.password}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
                  placeholder="Entrez le code d'accès"
                />
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full rounded-none bg-primary py-7 text-[10px] uppercase tracking-[0.4em] text-primary-foreground hover:bg-foreground"
              >
                {loginMutation.isPending ? "Connexion..." : "Entrer dans l'admin"}
              </Button>
            </form>

            <div className="mt-10 border-t border-primary/10 pt-6">
              <Button
                asChild
                variant="ghost"
                className="rounded-none px-0 text-[10px] uppercase tracking-[0.35em] text-primary/70 hover:bg-transparent hover:text-primary"
              >
                <Link href="/">Retour au site invitation</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-col gap-6 border border-primary/10 bg-white p-8 editorial-shadow md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
              <p className="text-[11px] uppercase tracking-[0.45em] text-primary/65">
                Session active
              </p>
            </div>
            <div>
              <h1 className="font-serif text-4xl text-foreground md:text-6xl">
                Invités & invitations
              </h1>
              <p className="mt-3 text-sm leading-7 text-foreground/70">
                Connecté en tant que {user.username}. Gérez toute la liste,
                partagez les liens personnalisés et suivez les réponses RSVP.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              type="button"
              variant="outline"
              className="rounded-none border-primary/15 px-5 text-[10px] uppercase tracking-[0.35em] text-primary"
            >
              <a href="/checkin" target="_blank" rel="noreferrer">
                <UserCheck className="mr-2 h-4 w-4" strokeWidth={1.6} />
                Page check-in
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open("/api/admin/guests/export", "_blank")}
              className="rounded-none border-primary/15 px-5 text-[10px] uppercase tracking-[0.35em] text-primary"
            >
              <Download className="mr-2 h-4 w-4" strokeWidth={1.6} />
              Export CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              className="rounded-none border-primary/15 px-5 text-[10px] uppercase tracking-[0.35em] text-primary"
            >
              <LogOut className="mr-2 h-4 w-4" strokeWidth={1.6} />
              Déconnexion
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Invités", value: stats.totalInvites, icon: Users },
              { label: "En attente", value: stats.pendingInvites, icon: RefreshCw },
              { label: "Confirmés", value: stats.confirmedInvites, icon: ShieldCheck },
              { label: "Déclinés", value: stats.declinedInvites, icon: LockKeyhole },
              { label: "Invitations envoyées", value: stats.sentInvitations, icon: UserPlus },
            ].map((item) => (
            <article
              key={item.label}
              className="border border-primary/10 bg-white p-6 editorial-shadow"
            >
              <item.icon className="h-5 w-5 text-primary/50" strokeWidth={1.5} />
              <p className="mt-5 text-[10px] uppercase tracking-[0.35em] text-foreground/45">
                {item.label}
              </p>
              <p className="mt-3 font-serif text-4xl text-foreground">
                {item.value}
              </p>
            </article>
          ))}
        </section>

        {guests.some((g) => g.message) && (
          <section className="border border-primary/10 bg-white p-6 editorial-shadow md:p-8">
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.45em] text-primary/60">
                Mots pour les mariés
              </p>
              <h2 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">
                Messages des invités
              </h2>
              <p className="mt-2 text-sm text-foreground/55">
                {guests.filter((g) => g.message).length} message
                {guests.filter((g) => g.message).length > 1 ? "s" : ""} reçu
                {guests.filter((g) => g.message).length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
              {guests
                .filter((g) => g.message)
                .map((guest) => (
                  <blockquote
                    key={guest.id}
                    className="mb-4 break-inside-avoid border border-primary/8 bg-[#FAFAF8] p-5 space-y-3"
                  >
                    <p className="font-serif text-base leading-7 text-foreground/80 italic">
                      "{guest.message}"
                    </p>
                    <footer className="flex items-center justify-between gap-2 pt-2 border-t border-primary/8">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">
                        {guest.firstName} {guest.lastName}
                      </p>
                      <Badge
                        variant="outline"
                        className={`rounded-none border-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] ${
                          guest.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700"
                            : guest.status === "declined"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {guest.status === "confirmed"
                          ? "Confirmé"
                          : guest.status === "declined"
                            ? "Décliné"
                            : "En attente"}
                      </Badge>
                    </footer>
                  </blockquote>
                ))}
            </div>
          </section>
        )}

        <section className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <article className="border border-primary/10 bg-white p-6 editorial-shadow md:p-8">
            <div className="mb-8">
              <p className="text-[11px] uppercase tracking-[0.45em] text-primary/60">
                {editingGuestId ? "Modifier l'invité" : "Ajouter un invité"}
              </p>
              <h2 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">
                {editingGuestId
                  ? "Mettez à jour les informations et le RSVP"
                  : "Créer une invitation personnalisée"}
              </h2>
            </div>

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                saveGuestMutation.mutate();
              }}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                    Prénom
                  </label>
                  <Input
                    value={guestForm.firstName}
                    onChange={(event) =>
                      setGuestForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                    Nom
                  </label>
                  <Input
                    value={guestForm.lastName}
                    onChange={(event) =>
                      setGuestForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={guestForm.email || ""}
                    onChange={(event) =>
                      setGuestForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                    Téléphone
                  </label>
                  <Input
                    value={guestForm.phone || ""}
                    onChange={(event) =>
                      setGuestForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                    Statut
                  </label>
                  <select
                    value={guestForm.status}
                    onChange={(event) =>
                      setGuestForm((current) => ({
                        ...current,
                        status: event.target.value as GuestFormState["status"],
                      }))
                    }
                    className="h-12 w-full rounded-none border border-primary/15 bg-transparent px-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="declined">Décliné</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                    Nombre de places
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={2}
                    value={guestForm.guestCount}
                    onChange={(event) =>
                      setGuestForm((current) => ({
                        ...current,
                        guestCount: Number.parseInt(event.target.value || "1", 10),
                      }))
                    }
                    className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                  Note
                </label>
                <Textarea
                  value={guestForm.message || ""}
                  onChange={(event) =>
                    setGuestForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  className="min-h-[140px] rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-3">
                <Button
                  type="submit"
                  disabled={saveGuestMutation.isPending}
                  className="rounded-none bg-primary px-7 py-6 text-[10px] uppercase tracking-[0.35em] text-primary-foreground hover:bg-foreground"
                >
                  {saveGuestMutation.isPending
                    ? "Enregistrement..."
                    : editingGuestId
                      ? "Mettre à jour"
                      : "Créer l'invité"}
                </Button>
                {(editingGuestId || guestForm.firstName || guestForm.lastName) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setGuestForm(emptyGuestForm);
                      setEditingGuestId(null);
                    }}
                    className="rounded-none border-primary/15 px-7 py-6 text-[10px] uppercase tracking-[0.35em] text-primary"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
            </form>
          </article>

          <article className="border border-primary/10 bg-white p-6 editorial-shadow md:p-8">
            <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.45em] text-primary/60">
                  Liste invités
                </p>
                <p className="mt-2 text-sm leading-7 text-foreground/70">
                  Recherchez, éditez, copiez le lien d'invitation ou régénérez-le
                  à tout moment.
                </p>
              </div>

              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/35" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nom, email, statut..."
                  className="h-12 rounded-none border-primary/15 bg-transparent pl-11 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | "pending" | "confirmed" | "declined",
                  )
                }
                className="h-12 rounded-none border border-primary/15 bg-transparent px-3 text-sm outline-none focus:border-primary"
              >
                <option value="all">Tous les RSVP</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmés</option>
                <option value="declined">Déclinés</option>
              </select>

              <select
                value={invitationFilter}
                onChange={(event) =>
                  setInvitationFilter(event.target.value as "all" | "draft" | "sent")
                }
                className="h-12 rounded-none border border-primary/15 bg-transparent px-3 text-sm outline-none focus:border-primary"
              >
                <option value="all">Toutes les invitations</option>
                <option value="draft">Brouillons</option>
                <option value="sent">Envoyées</option>
              </select>
            </div>

            {isLoadingGuests ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredGuests.map((guest) => (
                  <article
                    key={guest.id}
                    className="border border-primary/10 bg-white p-4 md:p-5 editorial-shadow"
                  >
                    {/* Top row: name + status badge */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1 min-w-0">
                        <p className="font-serif text-xl text-foreground leading-tight">
                          {guest.firstName} {guest.lastName}
                        </p>
                        <p className="text-sm text-foreground/55 truncate">
                          {guest.email || "—"} · {guest.phone || "—"}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/35">
                          {guest.guestCount} place{guest.guestCount > 1 ? "s" : ""} ·{" "}
                          {guest.createdAt
                            ? format(new Date(guest.createdAt), "d MMM yyyy", { locale: fr })
                            : "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge
                          variant="outline"
                          className={`rounded-none border-0 px-3 py-1 text-[10px] uppercase tracking-[0.25em] ${
                            guest.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700"
                              : guest.status === "declined"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {guest.status === "confirmed"
                            ? "Confirmé"
                            : guest.status === "declined"
                              ? "Décliné"
                              : "En attente"}
                        </Badge>
                        {guest.checkedInAt && (
                          <Badge
                            variant="outline"
                            className="rounded-none border-0 px-3 py-0.5 text-[9px] uppercase tracking-[0.2em] bg-primary/5 text-primary"
                          >
                            Check-in ✓
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Invitation status row */}
                    <div className="mt-3 pt-3 border-t border-primary/5 flex items-center gap-3 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`rounded-none border-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] ${
                          guest.invitationStatus === "sent"
                            ? "bg-stone-100 text-stone-700"
                            : "bg-[#ECEFF1] text-[#5F6870]"
                        }`}
                      >
                        {guest.invitationStatus === "sent" ? "Envoyée" : "Brouillon"}
                      </Badge>
                      {guest.invitationSentAt && (
                        <span className="text-[10px] text-foreground/40">
                          {format(new Date(guest.invitationSentAt), "d MMM, HH:mm", { locale: fr })}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-foreground/35 truncate max-w-[180px] hidden sm:block">
                        {guest.invitationUrl || `${window.location.origin}/invitation/${guest.token}`}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-primary/5 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => shareViaWhatsApp(guest)}
                        className="rounded-none border-green-200 text-[10px] uppercase tracking-[0.25em] text-green-700 hover:bg-green-50"
                      >
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                        WhatsApp
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyInvitationLink(guest)}
                        className="rounded-none border-primary/15 text-[10px] uppercase tracking-[0.25em] text-primary"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                        Copier
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => regenerateLinkMutation.mutate(guest.id)}
                        className="rounded-none border-primary/15 text-[10px] uppercase tracking-[0.25em] text-primary"
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                        Régénérer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startEditingGuest(guest)}
                        className="rounded-none border-primary/15 text-[10px] uppercase tracking-[0.25em] text-primary"
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                        Modifier
                      </Button>
                      {!guest.checkedInAt && guest.status === "confirmed" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => checkInMutation.mutate(guest.id)}
                          className="rounded-none bg-primary text-[10px] uppercase tracking-[0.25em] text-primary-foreground hover:bg-foreground"
                        >
                          <UserCheck className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                          Check-in
                        </Button>
                      )}
                      {guest.status !== "declined" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => declineMutation.mutate(guest.id)}
                          className="rounded-none border-orange-200 text-[10px] uppercase tracking-[0.25em] text-orange-700 hover:bg-orange-50"
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                          Indispo.
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => deleteGuestMutation.mutate(guest.id)}
                        className="rounded-none border-rose-200 text-[10px] uppercase tracking-[0.25em] text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                        Supprimer
                      </Button>
                    </div>
                  </article>
                ))}

                {filteredGuests.length === 0 && (
                  <p className="py-16 text-center font-serif text-2xl text-foreground/55">
                    Aucun invité ne correspond à cette recherche.
                  </p>
                )}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
