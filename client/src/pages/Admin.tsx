import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Pencil,
  RotateCcw,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Settings,
  DatabaseBackup,
  LayoutGrid,
  Mail,
} from "lucide-react";
import { Link } from "wouter";
import {
  type AdminGuestInput,
  type RsvpResponse,
  type SafeUser,
} from "@shared/schema";
import { beverageCategories, getEventKeys, getGuestEvent, weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { pageThemes } from "@/lib/eventThemes";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import PrettySelect from "@/components/PrettySelect";
import AdminSettingsPanel from "@/components/AdminSettingsPanel";
import AdminAccountPanel from "@/components/AdminAccountPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  invitedCount: 1,
  ceremonyChoice: "civil",
  invitedCeremonyChoice: "civil",
  mealChoice: "",
  beverageChoice: "",
  message: "",
  allergies: "",
  notes: "",
  party: "commun",
  country: "CD",
  city: "Kinshasa",
  tableNumber: null,
};

const OTHER_BEVERAGE_VALUE = "__other_beverage__";
const statusOptions = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmé" },
  { value: "declined", label: "Absent(e)" },
];
const eventKeys = Object.keys(weddingEvents) as WeddingEventKey[];
const eventOptions = eventKeys.map((key) => ({
  value: key,
  label: weddingEvents[key].label,
  detail: `${weddingEvents[key].date} · ${weddingEvents[key].time}`,
}));
const guestCountOptions = Array.from({ length: 10 }, (_, index) => ({
  value: String(index + 1),
  label: `${index + 1} personne${index ? "s" : ""}`,
}));
// Deux listes séparées : chaque invité est invité par Jessica ou par Geldi.
const partyOptions = [
  { value: "jessica", label: "Liste Jessica" },
  { value: "geldi", label: "Liste Geldi" },
];
type Party = "jessica" | "geldi";
const isParty = (value: unknown): value is Party => value === "jessica" || value === "geldi";
const partyLabel = (value?: string | null) => partyOptions.find((o) => o.value === value)?.label || "Sans liste";

const partyVisuals: Record<Party, { accent: string; deep: string; soft: string; border: string }> = {
  jessica: { accent: "#9c4668", deep: "#672a42", soft: "#fff4f8", border: "#e7b8c9" },
  geldi: { accent: "#2f6a64", deep: "#1e4b47", soft: "#f0f8f6", border: "#b9dad4" },
};

function parseImportRows(text: string, defaults: { guestCount: number; ceremonyChoice: string; party: string }) {
  const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return rows.flatMap((line, index) => {
    if (index === 0 && /pr[ée]nom/i.test(line) && /nom/i.test(line)) return [];
    const separator = line.includes(";") ? ";" : line.includes("\t") ? "\t" : line.includes(",") ? "," : null;
    const columns = separator ? line.split(separator).map((value) => value.trim().replace(/^"|"$/g, "")) : [];
    const fullName = separator ? "" : line;
    const firstSpace = fullName.indexOf(" ");
    const firstName = separator ? columns[0] : fullName.slice(0, firstSpace);
    const lastName = separator ? columns[1] : fullName.slice(firstSpace + 1);
    const contact = columns[2] || "";
    const count = Math.min(10, Math.max(1, Number(columns[3]) || defaults.guestCount));
    if (!firstName?.trim() || !lastName?.trim()) return [];
    return [{
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: contact.includes("@") ? contact : "",
      phone: contact && !contact.includes("@") ? contact : "",
      status: "pending",
      guestCount: count,
      invitedCount: count,
      ceremonyChoice: defaults.ceremonyChoice,
      invitedCeremonyChoice: defaults.ceremonyChoice,
      party: defaults.party,
      country: "CD",
      city: "Kinshasa",
      mealChoice: "",
      beverageChoice: "",
      allergies: "",
      message: "",
      notes: "",
      tableNumber: null,
    }];
  });
}
const pageSizeOptions = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];
const TABLES_STORAGE_KEY = "gs-admin-table-count";
const DEFAULT_TABLE_COUNT = 16;
type CapacityResponse = Record<string, number>;
const beverageSelectOptions = [
  { value: "", label: "Aucune préférence" },
  ...beverageCategories.map((drink) => ({ value: drink, label: drink })),
  { value: OTHER_BEVERAGE_VALUE, label: "Autre boisson", detail: "Ancienne réponse ou précision" },
];

function getBeverageSelectValue(value?: string | null) {
  if (!value) return "";
  return beverageSelectOptions.some((option) => option.value === value) ? value : OTHER_BEVERAGE_VALUE;
}

function getOtherBeverageValue(value?: string | null) {
  if (!value || getBeverageSelectValue(value) !== OTHER_BEVERAGE_VALUE) return "";
  return value.startsWith("Autre: ") ? value.slice(7) : value;
}

function getTransitInvitationUrl(guest: GuestRecord) {
  const url = guest.invitationUrl || `${window.location.origin}/invitation/${guest.token}`;
  return url.replace(/\/(samedi|dimanche)\/?$/, "");
}

type AdminView = "overview" | "guests" | "tables" | "checkin" | "messages" | "settings" | "account";
type Stage = "all" | "todo" | "waiting" | "confirmed" | "declined";

const VIEW_KEY = "jg-admin-view";
const EVENT_KEY = "jg-admin-event";
const LIST_KEY = "jg-admin-list";

const navigation: { id: AdminView; label: string; caption: string }[] = [
  { id: "overview", label: "Vue d'ensemble", caption: "L'essentiel de vos préparatifs, en un coup d'œil." },
  { id: "guests", label: "Invités", caption: "Vos listes, vos invitations et les réponses, célébration par célébration." },
  { id: "tables", label: "Plan de table", caption: "Imaginez les tablées et placez chaque invité." },
  { id: "checkin", label: "Accueil", caption: "Le jour J, validez les arrivées à l'entrée." },
  { id: "messages", label: "Messages", caption: "Les petits mots laissés par vos invités." },
  { id: "settings", label: "Contenu du site", caption: "Textes, lieux, programme : votre invitation, à votre image." },
  { id: "account", label: "Compte & sauvegarde", caption: "Votre accès privé et une copie de vos préparatifs." },
];

const guestLists = [
  { id: "jessica", title: "Jessica", caption: "Les invités de Jessica", mark: "J", ...partyVisuals.jessica },
  { id: "geldi", title: "Geldi", caption: "Les invités de Geldi", mark: "G", ...partyVisuals.geldi },
];

const stages: { id: Stage; step: string; label: string; hint: string }[] = [
  { id: "all", step: "Tout", label: "Toutes les invitations", hint: "L'ensemble des invités de cette célébration." },
  { id: "todo", step: "01", label: "À envoyer", hint: "Invitations prêtes, pas encore partagées : envoyez-les par WhatsApp, e-mail ou lien." },
  { id: "waiting", step: "02", label: "En attente", hint: "Invitations envoyées, sans réponse pour l'instant. Une relance peut aider." },
  { id: "confirmed", step: "03", label: "Confirmés", hint: "Ils seront là. Pensez à leur attribuer une table." },
  { id: "declined", step: "04", label: "Absents", hint: "Ils ne pourront pas venir." },
];

function stageMatches(stage: Stage, guest: GuestRecord) {
  switch (stage) {
    case "todo":
      return guest.status === "pending" && guest.invitationStatus !== "sent";
    case "waiting":
      return guest.status === "pending" && guest.invitationStatus === "sent";
    case "confirmed":
      return guest.status === "confirmed";
    case "declined":
      return guest.status === "declined";
    default:
      return true;
  }
}

function NavIcon({ id }: { id: AdminView }) {
  const Icon = {
    overview: CalendarDays,
    guests: Users,
    tables: LayoutGrid,
    checkin: UserCheck,
    messages: MessageCircle,
    settings: Settings,
    account: DatabaseBackup,
  }[id];
  return <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "confirmed" ? "bg-emerald-50 text-emerald-700" : status === "declined" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  const label = status === "confirmed" ? "Confirmé" : status === "declined" ? "Absent(e)" : "En attente";
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[12px] font-medium ${tone}`}>{label}</span>;
}

function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-serif text-2xl text-foreground/75">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-foreground/50">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

const panel = "rounded-3xl border border-black/[0.05] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_40px_-24px_rgba(0,0,0,0.18)]";
const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-event-deep)]";
const PAGE_SIZE = 15;

/* Pagination compacte (pilules) pour les longues listes */
function Pager({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/55">
      <span>
        {page * PAGE_SIZE + 1}–{Math.min(total, (page + 1) * PAGE_SIZE)} sur {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)} className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white hover:bg-[#f5f5f6] disabled:opacity-30" aria-label="Page précédente">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
        </button>
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-current={i === page ? "page" : undefined}
            onClick={() => onChange(i)}
            className={`h-9 min-w-9 rounded-full px-3 text-[13px] font-medium ${i === page ? "bg-[#6e1420] text-white" : "border border-black/10 bg-white hover:bg-[#f5f5f6]"}`}
          >
            {i + 1}
          </button>
        ))}
        <button type="button" disabled={page >= pages - 1} onClick={() => onChange(page + 1)} className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white hover:bg-[#f5f5f6] disabled:opacity-30" aria-label="Page suivante">
          <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

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
  // L'événement géré : chaque événement a ses propres invités, tout l'espace se limite à lui.
  const [currentEvent, setCurrentEvent] = useState<WeddingEventKey | null>(() => {
    const stored = sessionStorage.getItem(EVENT_KEY);
    return stored && stored in weddingEvents ? (stored as WeddingEventKey) : null;
  });
  const ceremonyFilter: "" | WeddingEventKey = currentEvent ?? "";
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [guestForm, setGuestForm] = useState<GuestFormState>(emptyGuestForm);
  const [editingGuestId, setEditingGuestId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importGuestCount, setImportGuestCount] = useState(1);
  const [importParty, setImportParty] = useState<Party>("jessica");
  const [partyFilter, setPartyFilter] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<AdminView>(() => {
    const stored = sessionStorage.getItem(VIEW_KEY) as AdminView | null;
    return stored && navigation.some((item) => item.id === stored) ? stored : "overview";
  });
  const [listChosen, setListChosen] = useState(() => isParty(sessionStorage.getItem(LIST_KEY)));
  const [toAssign, setToAssign] = useState<number[]>([]);
  const [legacyPage, setLegacyPage] = useState(0);
  const [assignPage, setAssignPage] = useState(0);

  // Habillage de l'admin (police, fond) appliqué au <body> pour couvrir aussi les fenêtres modales.
  useEffect(() => {
    document.body.classList.add("admin-ui");
    return () => document.body.classList.remove("admin-ui");
  }, []);
  const [stage, setStage] = useState<Stage>("all");
  const [tableSearch, setTableSearch] = useState("");
  const [checkinSearch, setCheckinSearch] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem(LIST_KEY);
    if (isParty(stored)) {
      setPartyFilter(stored);
      setImportParty(stored);
    } else {
      sessionStorage.removeItem(LIST_KEY);
    }
  }, []);

  function navigate(next: AdminView) {
    setView(next);
    sessionStorage.setItem(VIEW_KEY, next);
    window.scrollTo({ top: 0 });
  }

  function chooseEvent(value: WeddingEventKey | null) {
    setCurrentEvent(value);
    if (value) sessionStorage.setItem(EVENT_KEY, value);
    else sessionStorage.removeItem(EVENT_KEY);
    setStage("all");
    setSearchTerm("");
    setTableSearch("");
    setCheckinSearch("");
    window.scrollTo({ top: 0 });
  }

  function chooseList(value: Party) {
    setPartyFilter(value);
    setImportParty(value);
    setListChosen(true);
    sessionStorage.setItem(LIST_KEY, value);
  }

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, stage, ceremonyFilter, partyFilter, pageSize]);

  const { data: user, isLoading: isCheckingSession } = useQuery<SafeUser | null>({
    queryKey: ["/api/user"],
    queryFn: getCurrentUser,
  });

  const { data: allGuests = [], isLoading: isLoadingGuests } = useQuery<GuestRecord[]>({
    queryKey: ["/api/admin/guests"],
    enabled: Boolean(user),
    refetchInterval: user && document.visibilityState === "visible" ? 15_000 : false,
  });

  const guests = useMemo(
    () => (currentEvent ? allGuests.filter((g) => getGuestEvent(g) === currentEvent) : []),
    [allGuests, currentEvent],
  );
  // Invitations héritées rattachées à plusieurs célébrations (ou à aucune) : à répartir.
  const legacyGuests = useMemo(() => allGuests.filter((g) => !getGuestEvent(g)), [allGuests]);

  // Tables dynamiques : le nombre de tables disponibles est le maximum entre
  // les tables déjà utilisées par des invités et le nombre ajouté manuellement
  // (mémorisé localement). « Ajouter une table » crée la table suivante.
  const tablesStorageKey = `${TABLES_STORAGE_KEY}-${currentEvent ?? "none"}`;
  const [manualTableCounts, setManualTableCounts] = useState<Record<string, number>>({});
  const storedTableCount = Number(localStorage.getItem(tablesStorageKey));
  const manualTableCount = manualTableCounts[tablesStorageKey] ?? (Number.isFinite(storedTableCount) && storedTableCount > 0 ? storedTableCount : DEFAULT_TABLE_COUNT);

  const usedTableMax = useMemo(
    () => guests.reduce((max, g) => Math.max(max, g.tableNumber ?? 0), 0),
    [guests],
  );
  const tableCount = Math.min(200, Math.max(manualTableCount, usedTableMax));

  const tableOptions = useMemo(
    () => [
      { value: "", label: "Aucune table" },
      ...Array.from({ length: tableCount }, (_, i) => ({
        value: String(i + 1),
        label: `Table ${i + 1}`,
      })),
    ],
    [tableCount],
  );

  function addTable() {
    const next = Math.min(200, tableCount + 1);
    if (next === tableCount) {
      toast({ title: "Limite atteinte", description: "Maximum 200 tables.", variant: "destructive" });
      return;
    }
    setManualTableCounts((counts) => ({ ...counts, [tablesStorageKey]: next }));
    localStorage.setItem(tablesStorageKey, String(next));
    toast({ title: `Table ${next} ajoutée`, description: "Elle est désormais disponible pour l'attribution des invités." });
  }

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/login", {
        username: credentials.username.trim(),
        password: credentials.password.trim(),
      });
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
      setIsFormOpen(false);
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
      await navigator.clipboard.writeText(getTransitInvitationUrl(guest));
      toast({
        title: "Lien régénéré",
        description: "Le nouveau lien de transit a été copié.",
      });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ id, arrived }: { id: number; arrived: boolean }) => {
      await apiRequest("PATCH", `/api/rsvp/${id}/${arrived ? "check-in" : "uncheck"}`);
    },
    onSuccess: (_, { arrived }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({ title: arrived ? "Arrivée enregistrée" : "Arrivée annulée" });
    },
  });

  const resetCheckInsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/reset-checkins");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({
        title: "Check-ins réinitialisés",
        description: "Tous les check-ins ont été effacés.",
      });
    },
  });

  const importGuestsMutation = useMutation({
    mutationFn: async () => {
      const guests = parseImportRows(importText, {
        guestCount: importGuestCount,
        ceremonyChoice: currentEvent ?? "",
        party: importParty,
      });

      const response = await apiRequest("POST", "/api/admin/guests/import", {
        guests,
        guestCount: importGuestCount,
        ceremonyChoice: currentEvent ?? "",
        party: importParty,
      });
      return response.json();
    },
    onSuccess: (result: { added: number; skipped: number; guests: GuestRecord[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({
        title: `${result.added} invité${result.added > 1 ? "s" : ""} importé${result.added > 1 ? "s" : ""}`,
        description: result.skipped ? `${result.skipped} doublon(s) ignoré(s).` : "Les liens d'invitation sont prêts.",
      });
      setImportText("");
      setIsImportOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur d'import", description: error.message, variant: "destructive" });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({ id, tableNumber }: { id: number; tableNumber: number | null }) => {
      const response = await apiRequest("PATCH", `/api/admin/guests/${id}`, { tableNumber });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour la table.", variant: "destructive" });
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

  const [legacyChoices, setLegacyChoices] = useState<Record<number, WeddingEventKey[]>>({});
  const legacyEventsOf = (g: GuestRecord) => legacyChoices[g.id] ?? getEventKeys(g.invitedCeremonyChoice || g.ceremonyChoice);
  const splitMutation = useMutation({
    mutationFn: async (items: { id: number; events: WeddingEventKey[] }[]) => {
      let copies = 0;
      for (const item of items) {
        const response = await apiRequest("POST", `/api/admin/guests/${item.id}/split`, { events: item.events });
        copies += ((await response.json()) as { copies: number }).copies;
      }
      return { count: items.length, copies };
    },
    onSuccess: ({ count, copies }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({
        title: `${count} invitation${count > 1 ? "s" : ""} répartie${count > 1 ? "s" : ""}`,
        description: copies ? `${copies} invitation(s) créée(s) pour les autres événements, chacune avec son propre lien.` : "Chaque invité est désormais rattaché à un seul événement.",
      });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({ title: "Répartition interrompue", description: error.message, variant: "destructive" });
    },
  });

  const unassigned = guests.filter((g) => !isParty(g.party));
  const assignPartyMutation = useMutation({
    mutationFn: async ({ ids, party }: { ids: number[]; party: Party }) => {
      for (const id of ids) await apiRequest("PATCH", `/api/admin/guests/${id}`, { party });
      return { count: ids.length, party };
    },
    onSuccess: ({ count, party }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      setToAssign([]);
      toast({ title: `${count} invité${count > 1 ? "s" : ""} rangé${count > 1 ? "s" : ""} dans la ${partyLabel(party).toLowerCase()}` });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({ title: "Attribution interrompue", description: error.message, variant: "destructive" });
    },
  });

  const confirmed = guests.filter((g) => g.status === "confirmed");
  const sumPeople = (list: typeof guests) => list.reduce((sum, g) => sum + (g.guestCount || 1), 0);
  const stats = {
    totalInvites: sumPeople(guests),
    pendingInvites: sumPeople(guests.filter((g) => g.status === "pending")),
    confirmedInvites: sumPeople(confirmed),
    declinedInvites: sumPeople(guests.filter((g) => g.status === "declined")),
    sentInvitations: guests.filter((guest) => guest.invitationStatus === "sent").length,
    attendingGuests: sumPeople(confirmed),
    byEvent: eventKeys.reduce(
      (acc, key) => {
        acc[key] = sumPeople(confirmed.filter((g) => getEventKeys(g.ceremonyChoice).includes(key)));
        return acc;
      },
      {} as Record<WeddingEventKey, number>,
    ),
  };

  const filteredGuests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // Notion d'événement : tant qu'aucune célébration n'est choisie, on n'affiche rien.
    if (!ceremonyFilter) return [];

    return guests.filter((guest) => {
      const matchesStatus = stageMatches(stage, guest);
      const matchesInvitation = true;
      const matchesParty = partyFilter === "all" || guest.party === partyFilter;
      const guestEvents = getEventKeys(guest.invitedCeremonyChoice || guest.ceremonyChoice);
      const matchesCeremony = guestEvents.includes(ceremonyFilter);

      if (!matchesStatus || !matchesInvitation || !matchesCeremony || !matchesParty) {
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
        guest.beverageChoice || "",
        guest.city || "",
        guest.allergies || "",
        guest.notes || "",
        guest.invitationStatus || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [guests, stage, searchTerm, ceremonyFilter, partyFilter]);

  const totalPages = Math.ceil(filteredGuests.length / pageSize);
  const paginatedGuests = filteredGuests.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  async function copyInvitationLink(guest: GuestRecord) {
    const invitationUrl = getTransitInvitationUrl(guest);
    await navigator.clipboard.writeText(invitationUrl);
    await apiRequest("POST", `/api/admin/guests/${guest.id}/mark-sent`);
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
    toast({
      title: "Lien copié",
      description: "Le lien de transit est prêt à être partagé et l'envoi a été enregistré.",
    });
  }

  function shareViaWhatsApp(guest: GuestRecord) {
    const url = getTransitInvitationUrl(guest);
    const dateLines = getEventKeys(guest.invitedCeremonyChoice || guest.ceremonyChoice)
      .map((key) => {
        const event = weddingEvents[key];
        return `${event.date} à ${event.time} : ${event.label} (${event.theme}).`;
      })
      .join("\n");
    const linkIntro = "Ouvrez votre invitation personnalisée ici :";
    const message =
      `Bonjour ${guest.firstName},\n\n` +
      `Nous avons la joie de vous inviter au mariage de *Jessica & Geldi*.\n\n` +
      `${dateLines}\n\n` +
      `${linkIntro}\n${url}\n\n` +
      `Avec joie de vous avoir parmi nous.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    apiRequest("POST", `/api/admin/guests/${guest.id}/mark-sent`).then(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
    });
  }

  function shareViaEmail(guest: GuestRecord) {
    const url = getTransitInvitationUrl(guest);
    const dateLines = getEventKeys(guest.invitedCeremonyChoice || guest.ceremonyChoice)
      .map((key) => `· ${weddingEvents[key].label} : ${weddingEvents[key].date} à ${weddingEvents[key].time}`)
      .join("\n");
    const body =
      `Bonjour ${guest.firstName},\n\n` +
      `Nous avons la joie de vous inviter au mariage de Jessica & Geldi.\n\n${dateLines}\n\n` +
      `Votre invitation personnalisée vous attend ici :\n${url}\n\nAvec toute notre affection,\nJessica & Geldi`;
    window.location.href = `mailto:${encodeURIComponent(guest.email || "")}?subject=${encodeURIComponent("Invitation au mariage de Jessica & Geldi")}&body=${encodeURIComponent(body)}`;
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
      invitedCount: guest.invitedCount || guest.guestCount || 1,
      ceremonyChoice: (guest.ceremonyChoice as GuestFormState["ceremonyChoice"]) || "civil",
      invitedCeremonyChoice: (guest.invitedCeremonyChoice as GuestFormState["invitedCeremonyChoice"]) || guest.ceremonyChoice || "civil",
      mealChoice: guest.mealChoice || "",
      beverageChoice: guest.beverageChoice || "",
      message: guest.message || "",
      allergies: guest.allergies || "",
      notes: guest.notes || "",
      party: (guest.party as GuestFormState["party"]) || "commun",
      country: guest.country || "CD",
      city: guest.city || "Kinshasa",
      revision: guest.revision,
      tableNumber: guest.tableNumber ?? null,
    });
    setIsFormOpen(true);
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
      <main className="min-h-screen bg-[#f5f5f6] px-6 py-10 md:px-10 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="admin-hero overflow-hidden rounded-3xl p-8 md:p-12">
            <p className="text-[11px] uppercase tracking-[0.06em] text-white/55">
              Espace admin
            </p>
            <h1 className="mt-6 font-serif text-4xl leading-tight md:text-6xl">
              Gérez les invités de Jessica & Geldi avec précision.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-8 text-white/72">
              Créez les invités, générez leurs liens d'invitation individuels,
              suivez les réponses RSVP et pilotez la présence depuis un tableau
              de bord privé.
            </p>
          </section>

          <section className="border border-primary/10 bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-18px_rgba(0,0,0,0.14)] md:p-12">
            <div className="mb-10">
              <div className="mb-4 flex items-center gap-3 text-primary">
                <LockKeyhole className="h-5 w-5" strokeWidth={1.6} />
                <p className="text-[11px] uppercase tracking-[0.06em] text-primary/65">
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
                <label htmlFor="admin-username" className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">
                  Identifiant
                </label>
                <Input
                  id="admin-username"
                  autoComplete="username"
                  value={credentials.username}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20"
                  placeholder="Nom d'utilisateur"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="admin-password" className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">
                  Code d'accès
                </label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(event) =>
                      setCredentials((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="h-12 rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20 pr-12"
                    placeholder="Entrez le code d'accès"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Masquer le code d'accès" : "Afficher le code d'accès"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.6} /> : <Eye className="h-4 w-4" strokeWidth={1.6} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full rounded-full bg-primary py-7 text-[13px] font-medium normal-case tracking-normal text-primary-foreground hover:bg-foreground"
              >
                {loginMutation.isPending ? "Connexion..." : "Entrer dans l'admin"}
              </Button>
            </form>

            <div className="mt-10 border-t border-primary/10 pt-6">
              <Button
                asChild
                variant="ghost"
                className="rounded-full px-0 text-[13px] font-medium normal-case tracking-normal text-primary/70 hover:bg-transparent hover:text-primary"
              >
                <Link href="/">Retour au site invitation</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  /* ══════ Choix de l'événement à gérer ══════ */
  if (!currentEvent) {
    const readyLegacy = legacyGuests.filter((g) => legacyEventsOf(g).length > 0);
    return (
      <main className="min-h-screen bg-[#f5f5f6] text-foreground">
        <header className="mx-3 mt-3 rounded-3xl border border-black/[0.05] bg-white px-6 py-10 text-center md:mx-5 md:py-12">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#6e1420] text-[15px] font-semibold text-white">JG</span>
          <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6e1420]">L'espace des mariés</p>
          <h1 className="mt-4 text-3xl md:text-4xl">Quel événement souhaitez-vous gérer&nbsp;?</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-foreground/60">Chaque célébration a ses propres invités, son plan de table et son accueil. Vous pourrez changer d'événement à tout moment.</p>
        </header>

        <div className="mx-auto max-w-6xl space-y-10 px-5 py-10 md:px-10">
          <div className="grid gap-5 md:grid-cols-3">
            {eventKeys.map((key) => {
              const event = weddingEvents[key];
              const list = allGuests.filter((g) => getGuestEvent(g) === key);
              const people = sumPeople(list.filter((g) => g.status === "confirmed"));
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => chooseEvent(key)}
                  className="group flex flex-col rounded-3xl border p-7 text-left transition-transform duration-300 hover:-translate-y-1"
                  style={{ background: event.background, borderColor: `${event.accent}55`, color: event.ink }}
                >
                  <span className="text-[11px] uppercase tracking-[0.06em]" style={{ color: event.accent }}>{event.date.replace(" 2027", "")} · {event.time}</span>
                  <span className="mt-4 text-3xl font-semibold" style={{ color: event.accent }}>{event.shortLabel}</span>
                  <span className="mt-2 font-serif text-2xl">{event.label}</span>
                  <span className="mt-1 text-sm opacity-70">{event.theme}</span>
                  <span className="mt-4 flex gap-1.5" aria-hidden>
                    {event.palette.map((color) => <span key={color} className="h-4 w-4 rounded-full border border-black/10" style={{ background: color }} />)}
                  </span>
                  <span className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 text-sm" style={{ borderColor: `${event.accent}30` }}>
                    <span><strong className="block font-serif text-2xl tabular-nums">{list.length}</strong>invitation{list.length > 1 ? "s" : ""}</span>
                    <span><strong className="block font-serif text-2xl tabular-nums">{people}<span className="text-sm opacity-50">/{event.capacity}</span></strong>présents</span>
                  </span>
                  <span className="mt-6 text-[11px] uppercase tracking-[0.06em]" style={{ color: event.accent }}>Gérer cet événement →</span>
                </button>
              );
            })}
          </div>

          {legacyGuests.length > 0 && (
            <section className={`${panel} p-6 md:p-8`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className={eyebrow}>À répartir</p>
                  <h2 className="mt-2 font-serif text-2xl md:text-3xl">{legacyGuests.length} invitation{legacyGuests.length > 1 ? "s" : ""} sans événement unique</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/60">
                    Ces invitations datent d'avant la séparation par événement : rattachées à plusieurs célébrations, ou à aucune.
                    Cochez le ou les événements de chaque invité. Le premier garde le lien actuel ; une nouvelle invitation, avec son propre lien, est créée pour chacun des autres.
                    Elles n'apparaissent dans aucune liste tant qu'elles ne sont pas réparties.
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={!readyLegacy.length || splitMutation.isPending}
                  onClick={() => {
                    if (confirm(`Répartir ${readyLegacy.length} invitation(s) selon les cases cochées ?`)) {
                      splitMutation.mutate(readyLegacy.map((g) => ({ id: g.id, events: legacyEventsOf(g) })));
                    }
                  }}
                  className="shrink-0 rounded-full bg-[#6e1420] px-6 py-6 text-[13px] font-medium normal-case tracking-normal text-white hover:bg-[#4a0d15]"
                >
                  {splitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Répartir {readyLegacy.length} invitation{readyLegacy.length > 1 ? "s" : ""}
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-foreground/60">
                <span>Cocher pour toutes :</span>
                {eventKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLegacyChoices(Object.fromEntries(legacyGuests.map((g) => {
                      const current = legacyEventsOf(g);
                      return [g.id, current.includes(key) ? current : [...current, key]];
                    })))}
                    className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-[#f5f5f6]"
                  >
                    + {weddingEvents[key].shortLabel}
                  </button>
                ))}
                <button type="button" onClick={() => setLegacyChoices(Object.fromEntries(legacyGuests.map((g) => [g.id, []])))} className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-[#f5f5f6]">
                  Tout décocher
                </button>
              </div>

              <div className="mt-5 overflow-x-auto border-t border-black/[0.06]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white text-left text-[11px] uppercase tracking-[0.06em] text-foreground/45">
                    <tr>
                      <th className="py-3 pr-4 font-normal">Invité</th>
                      <th className="py-3 pr-4 font-normal">Réponse</th>
                      {eventKeys.map((key) => <th key={key} className="py-3 pr-2 text-center font-normal">{weddingEvents[key].shortLabel}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#6e1420]/8">
                    {legacyGuests.slice(legacyPage * PAGE_SIZE, (legacyPage + 1) * PAGE_SIZE).map((g) => {
                      const selected = legacyEventsOf(g);
                      return (
                        <tr key={g.id}>
                          <td className="py-2.5 pr-4">
                            <span className="block font-serif text-base">{g.firstName} {g.lastName}</span>
                            <span className="text-[11px] text-foreground/45">{g.invitedCount || g.guestCount || 1} place(s) · {partyLabel(g.party)}</span>
                          </td>
                          <td className="py-2.5 pr-4"><StatusBadge status={g.status} /></td>
                          {eventKeys.map((key) => (
                            <td key={key} className="py-2.5 pr-2 text-center">
                              <input
                                type="checkbox"
                                aria-label={`${g.firstName} ${g.lastName} : ${weddingEvents[key].label}`}
                                checked={selected.includes(key)}
                                onChange={() => setLegacyChoices((c) => ({ ...c, [g.id]: selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key] }))}
                                className="h-4 w-4 accent-[#6e1420]"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pager page={Math.min(legacyPage, Math.max(0, Math.ceil(legacyGuests.length / PAGE_SIZE) - 1))} total={legacyGuests.length} onChange={setLegacyPage} />
            </section>
          )}

          <div className="flex flex-wrap justify-center gap-6 text-sm text-foreground/60">
            <a href="/" target="_blank" rel="noreferrer" className="hover:text-[#6e1420]">Voir le site du mariage ↗</a>
            <button type="button" onClick={() => logoutMutation.mutate()} className="hover:text-[#6e1420]">Se déconnecter</button>
          </div>
        </div>
      </main>
    );
  }

  const activeEvent = weddingEvents[currentEvent];
  const activeEventTheme = pageThemes[currentEvent];
  const activeParty = isParty(partyFilter) ? partyVisuals[partyFilter] : null;
  const activeList = isParty(partyFilter) ? guestLists.find((list) => list.id === partyFilter) : null;
  const adminThemeStyle = {
    "--admin-event-accent": activeEventTheme.accent,
    "--admin-event-deep": activeEventTheme.bandDeep,
    "--admin-event-band": activeEventTheme.band,
    "--admin-event-paper": activeEventTheme.paper,
    "--admin-event-ink": activeEventTheme.ink,
    "--admin-event-lace": activeEventTheme.lace,
    "--admin-event-wash": `${activeEventTheme.accent}12`,
    "--party-accent": activeParty?.accent ?? activeEventTheme.accent,
    "--party-deep": activeParty?.deep ?? activeEventTheme.ink,
    "--party-soft": activeParty?.soft ?? activeEventTheme.paper,
    "--party-border": activeParty?.border ?? activeEventTheme.lace,
  } as CSSProperties;
  const current = navigation.find((item) => item.id === view)!;
  const pending = guests.filter((g) => g.status === "pending");
  const arrived = confirmed.filter((g) => g.checkedInAt);
  const inList = guests.filter((g) => partyFilter === "all" || g.party === partyFilter);
  const inListForEvent = inList;
  const drinkStats = Object.entries(
    confirmed.reduce<Record<string, number>>((acc, g) => {
      const drink = g.beverageChoice?.replace(/^Autre: /, "").trim();
      if (drink) acc[drink] = (acc[drink] || 0) + (g.guestCount || 1);
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const overviewStats = [
    { label: "Personnes invitées", value: guests.reduce((n, g) => n + (g.invitedCount || g.guestCount || 1), 0), detail: `${guests.length} invitations`, tone: "text-foreground" },
    { label: "Présences confirmées", value: stats.confirmedInvites, detail: `${confirmed.length} réponses positives`, tone: "text-emerald-700" },
    { label: "Réponses en attente", value: pending.length, detail: `${stats.pendingInvites} personnes concernées`, tone: "text-amber-600" },
    { label: "Absents", value: stats.declinedInvites, detail: "ne pourront pas venir", tone: "text-rose-700" },
    { label: "Invitations envoyées", value: stats.sentInvitations, detail: `sur ${guests.length}`, tone: "text-[#6e1420]" },
    { label: "Personnes arrivées", value: sumPeople(arrived), detail: `sur ${stats.confirmedInvites} confirmées`, tone: "text-foreground" },
  ];
  const tableNumbers = Array.from({ length: tableCount }, (_, i) => i + 1);
  const tableQuery = tableSearch.trim().toLowerCase();
  const seatable = guests.filter(
    (g) => g.status !== "declined" && (partyFilter === "all" || g.party === partyFilter) && (!tableQuery || `${g.firstName} ${g.lastName}`.toLowerCase().includes(tableQuery)),
  );
  const checkinList = confirmed
    .filter((g) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(checkinSearch.trim().toLowerCase()))
    .sort((a, b) => Number(!!a.checkedInAt) - Number(!!b.checkedInAt) || a.lastName.localeCompare(b.lastName));
  const buttonBase = "h-10 rounded-full px-5 text-[13px] font-medium normal-case tracking-normal";

  return (
    <div style={adminThemeStyle} className="admin-shell min-h-screen text-foreground lg:grid lg:grid-cols-[280px_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2">
        Aller au contenu
      </a>

      {/* ── Barre latérale ── */}
      <aside className="admin-sidebar flex flex-col bg-white lg:sticky lg:top-3 lg:m-3 lg:h-[calc(100vh-1.5rem)] lg:rounded-3xl lg:border">
        <div className="flex items-center justify-between gap-4 px-6 py-5 lg:block lg:pt-7">
          <a href="/" className="flex items-center gap-2">
            <span className="admin-brand-mark grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold text-white">JG</span>
            <span className="text-[15px] font-semibold tracking-tight">Jessica &amp; Geldi</span>
          </a>
        </div>
        <div className="admin-event-context mx-3 mb-4 rounded-2xl border px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/45">Événement</p>
          <p className="mt-1 flex items-center gap-2 text-[14px] font-semibold text-[var(--admin-event-ink)]">
            <span className="admin-event-dot h-2.5 w-2.5 shrink-0 rounded-full" />
            {activeEvent.shortLabel}
          </p>
          <p className="mt-0.5 text-[12px] font-medium text-[var(--admin-event-ink)]/70">{activeEvent.label}</p>
          <p className="text-[12px] text-[var(--admin-event-ink)]/60">{activeEvent.date.replace(" 2027", "")} · {activeEvent.time}</p>
          <button type="button" onClick={() => chooseEvent(null)} className="admin-event-switch mt-3 h-8 rounded-full border px-3 text-[12px] font-medium">
            Changer d'événement
          </button>
        </div>
        <p className="hidden px-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/40 lg:block">Menu</p>
        <nav aria-label="Administration" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors ${
                view === item.id ? "admin-nav-active font-semibold" : "text-foreground/60 hover:bg-white/70 hover:text-foreground"
              }`}
            >
              <NavIcon id={item.id} />
              <span className="whitespace-nowrap">{item.label}</span>
              {item.id === "guests" && <span className="admin-nav-count ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold">{guests.length}</span>}
            </button>
          ))}
        </nav>
        <div className="hidden px-3 pb-3 lg:block">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/40">Général</p>
          <a href={`/${activeEvent.slug}`} target="_blank" rel="noreferrer" className="block rounded-xl px-3 py-2 text-[14px] text-foreground/60 hover:bg-white/70 hover:text-foreground">Voir la page {activeEvent.shortLabel.toLowerCase()} ↗</a>
          <a href="/checkin" target="_blank" rel="noreferrer" className="block rounded-xl px-3 py-2 text-[14px] text-foreground/60 hover:bg-white/70 hover:text-foreground">Page check-in ↗</a>
          <button type="button" onClick={() => logoutMutation.mutate()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[14px] text-foreground/60 hover:bg-white/70 hover:text-foreground">
            <LogOut className="h-4 w-4" strokeWidth={1.6} /> Se déconnecter
          </button>
          <div className="admin-hero mt-4 rounded-2xl p-4">
            <p className="text-[13px] font-semibold">Accueil des invités</p>
            <p className="mt-1 text-[11px] text-white/70">Le jour J, validez les arrivées depuis un téléphone.</p>
            <button type="button" onClick={() => navigate("checkin")} className="mt-3 h-9 w-full rounded-full bg-white text-[13px] font-medium text-[var(--admin-event-deep)]">
              Ouvrir l'accueil
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="admin-topbar mx-3 mt-3 flex items-center justify-between gap-3 rounded-3xl border bg-white px-5 py-3 text-[13px] text-foreground/55 md:mx-5">
          <span className="min-w-0 truncate"><strong className="text-[var(--admin-event-deep)]">{activeEvent.shortLabel}</strong> <span className="mx-1 text-foreground/25">/</span> <span className="font-medium text-foreground">{current.label}</span></span>
          <span className="flex items-center gap-3">
            {(view === "guests" || view === "tables") && activeList && (
              <span className="admin-party-chip hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:flex">
                <span className="admin-party-chip-mark grid h-5 w-5 place-items-center rounded-full text-[10px] text-white">{activeList.mark}</span>
                Liste {activeList.title}
              </span>
            )}
            <span className="hidden items-center gap-2 sm:flex">
              <span className="admin-user-mark grid h-8 w-8 place-items-center rounded-full text-[12px] font-semibold">{user.username.slice(0, 2).toUpperCase()}</span>
              <span className="font-medium text-foreground">{user.username}</span>
            </span>
            <button type="button" onClick={() => logoutMutation.mutate()} className="lg:hidden" aria-label="Se déconnecter">
              <LogOut className="h-4 w-4" strokeWidth={1.6} />
            </button>
          </span>
        </header>

        <main id="admin-main" className="admin-workspace mx-3 my-3 space-y-6 rounded-3xl border bg-white px-5 py-7 md:mx-5 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className={eyebrow}>Espace privé</p>
              <h1 className="mt-2 text-3xl md:text-4xl">{current.label}</h1>
              <p className="mt-2 text-sm text-foreground/60">{current.caption}</p>
            </div>
            {(view === "overview" || view === "guests") && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setIsImportOpen(true)} className={`${buttonBase} border-[var(--admin-event-accent)]/30 text-[var(--admin-event-deep)]`}>
                  <UserPlus className="mr-2 h-4 w-4" strokeWidth={1.6} /> Importer
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setGuestForm(ceremonyFilter ? { ...emptyGuestForm, ceremonyChoice: ceremonyFilter, invitedCeremonyChoice: ceremonyFilter, party: isParty(partyFilter) ? partyFilter : "jessica" } : emptyGuestForm);
                    setEditingGuestId(null);
                    setIsFormOpen(true);
                  }}
                  className={`${buttonBase} bg-[var(--admin-event-deep)] text-white hover:bg-[var(--admin-event-band)]`}
                >
                  <Plus className="mr-2 h-4 w-4" strokeWidth={1.6} /> Ajouter un invité
                </Button>
              </div>
            )}
          </div>

        {/* ── Modale import en masse ─────────────────────────────────────── */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="max-w-lg p-0 flex flex-col max-h-[88vh]">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-primary/8 shrink-0">
              <p className="text-[11px] uppercase tracking-[0.06em] text-primary/55">Import rapide</p>
              <DialogTitle>Importer une liste d'invités</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Collez une liste ou un CSV : <span className="font-mono">Prénom;Nom;Contact;Personnes</span>
              </p>
            </DialogHeader>

            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"Prénom;Nom;Contact;Personnes\nJean;Dupont;jean@email.com;2\nMarie;Martin;+243000000000;1"}
                className="min-h-[180px] rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20 font-mono text-sm"
              />

              {importText.trim() && (() => {
                const count = parseImportRows(importText, { guestCount: importGuestCount, ceremonyChoice: currentEvent ?? "", party: importParty }).length;
                return (
                  <p className="text-[11px] uppercase tracking-[0.06em] text-primary/60">
                    {count} invité{count > 1 ? "s" : ""} détecté{count > 1 ? "s" : ""}
                  </p>
                );
              })()}

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Fichier CSV</span>
                <Input type="file" accept=".csv,text/csv,text/plain" className="h-12 rounded-xl border-primary/15" onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 512000) {
                    toast({ title: "Fichier trop volumineux", description: "Maximum 500 Ko.", variant: "destructive" });
                    return;
                  }
                  setImportText(await file.text());
                }} />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Places par défaut</label>
                  <PrettySelect
                    value={importGuestCount}
                    onChange={(value) => setImportGuestCount(Number(value))}
                    options={guestCountOptions}
                    placeholder="Personnes"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Liste</label>
                  <PrettySelect value={importParty} onChange={(value) => isParty(value) && setImportParty(value)} options={partyOptions} placeholder="Liste" />
                </div>
              </div>
              {currentEvent && (
                <p className="border-l-2 pl-3 text-sm text-foreground/70" style={{ borderColor: weddingEvents[currentEvent].accent }}>
                  Ces invités seront ajoutés à la liste du <strong>{weddingEvents[currentEvent].label.toLowerCase()}</strong> uniquement.
                </p>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t border-primary/8 shrink-0">
              <Button
                type="button"
                onClick={() => importGuestsMutation.mutate()}
                disabled={importGuestsMutation.isPending || parseImportRows(importText, { guestCount: importGuestCount, ceremonyChoice: currentEvent ?? "", party: importParty }).length === 0 || !currentEvent}
                className="rounded-full bg-primary px-7 py-6 text-[13px] font-medium normal-case tracking-normal text-primary-foreground hover:bg-foreground"
              >
                {importGuestsMutation.isPending ? "Import en cours..." : "Importer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsImportOpen(false); setImportText(""); }}
                className="rounded-full border-primary/15 px-7 py-6 text-[13px] font-medium normal-case tracking-normal text-primary"
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Modale ajout / modification ────────────────────────────────── */}
        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            if (!open) {
              setGuestForm(emptyGuestForm);
              setEditingGuestId(null);
            }
            setIsFormOpen(open);
          }}
        >
          <DialogContent className="max-w-xl p-0 flex flex-col max-h-[92vh]">
            <DialogHeader className="shrink-0">
              <p className="text-[11px] uppercase tracking-[0.06em] text-primary/55">
                {editingGuestId ? "Modifier l'invité" : "Ajouter un invité"}
              </p>
              <DialogTitle>
                {editingGuestId ? "Mettre à jour" : "Créer une invitation"}
              </DialogTitle>
            </DialogHeader>

            <form
              className="flex flex-col flex-1 overflow-y-auto"
              onSubmit={(event) => {
                event.preventDefault();
                saveGuestMutation.mutate();
              }}
            >
              <div className="px-6 py-5 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Prénom</label>
                    <Input
                      value={guestForm.firstName}
                      onChange={(e) => setGuestForm((c) => ({ ...c, firstName: e.target.value }))}
                      className="h-12 rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Nom</label>
                    <Input
                      value={guestForm.lastName}
                      onChange={(e) => setGuestForm((c) => ({ ...c, lastName: e.target.value }))}
                      className="h-12 rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Email</label>
                    <Input
                      type="email"
                      value={guestForm.email || ""}
                      onChange={(e) => setGuestForm((c) => ({ ...c, email: e.target.value }))}
                      className="h-12 rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Téléphone</label>
                    <Input
                      value={guestForm.phone || ""}
                      onChange={(e) => setGuestForm((c) => ({ ...c, phone: e.target.value }))}
                      className="h-12 rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Statut</label>
                    <PrettySelect
                      value={guestForm.status}
                      onChange={(value) => setGuestForm((c) => ({ ...c, status: value as GuestFormState["status"] }))}
                      options={statusOptions}
                      placeholder="Statut"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Nombre de personnes</label>
                    <PrettySelect
                      value={guestForm.guestCount}
                      onChange={(value) => setGuestForm((c) => {
                        const guestCount = Number.parseInt(value, 10);
                        return { ...c, guestCount, invitedCount: Math.max(c.invitedCount, guestCount) };
                      })}
                      options={guestCountOptions}
                      placeholder="Nombre de personnes"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Places réservées</label>
                    <PrettySelect value={guestForm.invitedCount} onChange={(value) => setGuestForm((c) => ({ ...c, invitedCount: Number(value) }))} options={guestCountOptions} placeholder="Places" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Liste d’origine</label>
                    <PrettySelect value={guestForm.party} onChange={(value) => setGuestForm((c) => ({ ...c, party: value as GuestFormState["party"] }))} options={partyOptions} placeholder="Liste" />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2"><span className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Pays</span><Input value={guestForm.country || ""} maxLength={2} onChange={(e) => setGuestForm((c) => ({ ...c, country: e.target.value.toUpperCase() }))} className="h-12 rounded-xl border-primary/15" placeholder="CD" /></label>
                  <label className="space-y-2"><span className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Ville</span><Input value={guestForm.city || ""} onChange={(e) => setGuestForm((c) => ({ ...c, city: e.target.value }))} className="h-12 rounded-xl border-primary/15" placeholder="Kinshasa" /></label>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Événement</label>
                  <PrettySelect
                    value={getGuestEvent(guestForm) ?? ""}
                    onChange={(value) => setGuestForm((c) => ({ ...c, invitedCeremonyChoice: value, ceremonyChoice: value }))}
                    options={eventOptions}
                    placeholder="Événement"
                  />
                  {editingGuestId && currentEvent && getGuestEvent(guestForm) !== currentEvent && (
                    <p className="text-xs text-amber-700">L'invité quittera cette liste et rejoindra celle du {weddingEvents[getGuestEvent(guestForm) ?? currentEvent].label.toLowerCase()}.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Boisson souhaitée</label>
                  <PrettySelect
                    value={getBeverageSelectValue(guestForm.beverageChoice)}
                    onChange={(value) => setGuestForm((c) => ({ ...c, beverageChoice: value === OTHER_BEVERAGE_VALUE ? "Autre: " : value }))}
                    options={beverageSelectOptions}
                    placeholder="Boisson"
                  />
                  {getBeverageSelectValue(guestForm.beverageChoice) === OTHER_BEVERAGE_VALUE && (
                    <Input
                      value={getOtherBeverageValue(guestForm.beverageChoice)}
                      onChange={(e) => setGuestForm((c) => ({ ...c, beverageChoice: e.target.value ? `Autre: ${e.target.value}` : "Autre: " }))}
                      className="h-12 rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20"
                      placeholder="Préciser la boisson"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Numéro de table</label>
                  <PrettySelect
                    value={guestForm.tableNumber ?? ""}
                    onChange={(value) => setGuestForm((c) => ({ ...c, tableNumber: value ? Number(value) : null }))}
                    options={tableOptions}
                    placeholder="Table"
                  />
                </div>



                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Note</label>
                  <Textarea
                    value={guestForm.message || ""}
                    onChange={(e) => setGuestForm((c) => ({ ...c, message: e.target.value }))}
                    className="min-h-[110px] rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Notes privées</label>
                  <Textarea value={guestForm.notes || ""} onChange={(e) => setGuestForm((c) => ({ ...c, notes: e.target.value }))} className="min-h-[90px] rounded-xl border-primary/15" placeholder="Visible uniquement dans l’administration" />
                </div>
              </div>

              <DialogFooter className="shrink-0">
                <Button
                  type="submit"
                  disabled={saveGuestMutation.isPending}
                  className="rounded-full bg-primary px-7 py-6 text-[13px] font-medium normal-case tracking-normal text-primary-foreground hover:bg-foreground"
                >
                  {saveGuestMutation.isPending
                    ? "Enregistrement..."
                    : editingGuestId
                      ? "Mettre à jour"
                      : "Créer l'invité"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-full border-primary/15 px-7 py-6 text-[13px] font-medium normal-case tracking-normal text-primary"
                >
                  Annuler
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

          {/* ══════ VUE D'ENSEMBLE ══════ */}
          {view === "overview" && (
            <>
              <section className="admin-hero relative overflow-hidden rounded-3xl px-7 py-8 md:px-10">
                <p className="text-[12px] font-medium text-white/70">Le plus beau reste à venir</p>
                <h2 className="mt-3 text-3xl md:text-4xl">{activeEvent.label}</h2>
                <p className="mt-3 text-[13px] text-white/75">{activeEvent.date} · {activeEvent.time} · {activeEvent.theme}</p>
              </section>

              <section aria-label="Statistiques" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {overviewStats.map((item, index) => (
                  <article key={item.label} className={index === 0 ? "admin-hero rounded-3xl p-6" : `${panel} p-6`}>
                    <p className={`text-[14px] font-medium ${index === 0 ? "text-white/90" : "text-foreground/70"}`}>{item.label}</p>
                    <p className={`mt-3 text-4xl font-semibold tabular-nums ${index === 0 ? "text-white" : item.tone}`}>{item.value.toLocaleString("fr-FR")}</p>
                    <p className={`mt-1 text-xs ${index === 0 ? "text-white/65" : "text-foreground/45"}`}>{item.detail}</p>
                  </article>
                ))}
              </section>

              {currentEvent && (() => {
                const event = weddingEvents[currentEvent];
                const count = stats.confirmedInvites;
                const ratio = Math.min(1, count / event.capacity);
                return (
                  <section className="rounded-3xl border p-6" style={{ background: event.background, borderColor: `${event.accent}40`, color: event.ink }}>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.06em]" style={{ color: event.accent }}>Capacité · {event.theme}</p>
                        <p className="mt-2 font-serif text-3xl tabular-nums">{count}<span className="text-base opacity-50"> / {event.capacity} personnes</span></p>
                      </div>
                      <p className="text-sm opacity-70">{count >= event.capacity ? "Complet" : `${event.capacity - count} places restantes`}</p>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-black/10"><div className="h-full" style={{ width: `${ratio * 100}%`, background: event.accent }} /></div>
                  </section>
                );
              })()}

              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <section className={`${panel} p-6`}>
                  <div className="flex items-end justify-between gap-4">
                    <div><p className={eyebrow}>On garde le lien</p><h2 className="mt-2 font-serif text-2xl">Les dernières réponses</h2></div>
                    <button type="button" onClick={() => navigate("guests")} className="text-xs text-[#6e1420] underline-offset-4 hover:underline">Tout voir ↗</button>
                  </div>
                  <div className="mt-4 divide-y divide-[#6e1420]/8">
                    {guests
                      .filter((g) => g.status !== "pending")
                      .sort((a, b) => String(b.respondedAt || b.createdAt || "").localeCompare(String(a.respondedAt || a.createdAt || "")))
                      .slice(0, 6)
                      .map((g) => (
                        <button key={g.id} type="button" onClick={() => startEditingGuest(g)} className="flex w-full items-center gap-4 py-3 text-left hover:bg-[#f5f5f6]">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#6e1420]/8 text-[11px] text-[#6e1420]">{g.firstName[0]}{g.lastName[0]}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-serif text-lg">{g.firstName} {g.lastName}</span>
                            <span className="block text-xs text-foreground/50">
                              {g.guestCount} pers. · {getEventKeys(g.ceremonyChoice).map((k) => weddingEvents[k].shortLabel).join(", ")}
                            </span>
                          </span>
                          <StatusBadge status={g.status} />
                        </button>
                      ))}
                    {!guests.some((g) => g.status !== "pending") && (
                      <Empty title="Les premières réponses se font attendre." text="Partagez les invitations : les réponses apparaîtront ici." />
                    )}
                  </div>
                </section>

                <div className="space-y-6">
                  <section className={`${panel} p-6`}>
                    <p className={eyebrow}>Un pas après l'autre</p>
                    <h2 className="mt-2 font-serif text-2xl">À préparer</h2>
                    <div className="mt-4 divide-y divide-[#6e1420]/8">
                      {[
                        { n: "01", title: "Envoyer les invitations", detail: `${guests.filter((g) => stageMatches("todo", g)).length} invitation(s) à partager`, go: () => { setStage("todo"); navigate("guests"); } },
                        { n: "02", title: "Recueillir les réponses", detail: `${guests.filter((g) => stageMatches("waiting", g)).length} en attente de réponse`, go: () => { setStage("waiting"); navigate("guests"); } },
                        { n: "03", title: "Imaginer les tablées", detail: `${confirmed.filter((g) => !g.tableNumber).length} groupe(s) confirmé(s) sans table`, go: () => navigate("tables") },
                        { n: "04", title: "Partager les détails", detail: "Lieux, programme, textes du site", go: () => navigate("settings") },
                      ].map((item) => (
                        <button key={item.n} type="button" onClick={item.go} className="flex w-full items-center gap-4 py-3 text-left hover:bg-[#f5f5f6]">
                          <span className="font-serif text-xl text-[#6e1420]/50">{item.n}</span>
                          <span className="flex-1"><span className="block text-sm">{item.title}</span><span className="block text-xs text-foreground/50">{item.detail}</span></span>
                          <span className="text-[#6e1420]">↗</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className={`${panel} p-6`}>
                    <div className="flex items-end justify-between">
                      <div><p className={eyebrow}>Préférences RSVP</p><h2 className="mt-2 font-serif text-2xl">Boissons</h2></div>
                      <span className="text-xs text-foreground/45">en personnes confirmées</span>
                    </div>
                    {drinkStats.length ? (
                      <ul className="mt-4 space-y-2">
                        {drinkStats.map(([drink, count]) => (
                          <li key={drink} className="flex items-center gap-3 text-sm">
                            <span className="w-32 truncate">{drink}</span>
                            <span className="h-1.5 flex-1 bg-[#6e1420]/8"><span className="block h-full bg-[#6e1420]/70" style={{ width: `${(count / drinkStats[0][1]) * 100}%` }} /></span>
                            <span className="w-8 text-right tabular-nums">{count}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-foreground/50">Aucune préférence renseignée pour l'instant.</p>
                    )}
                  </section>
                </div>
              </div>
            </>
          )}

          {/* ══════ INVITÉS ══════ */}
          {view === "guests" && !listChosen && (
            <section className={`${panel} p-8 text-center md:p-12`}>
              <p className={eyebrow}>Bienvenue</p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">Quelle liste souhaitez-vous gérer&nbsp;?</h2>
              <p className="mt-3 text-sm text-foreground/55">Chacun s'occupe de ses invités. Vous pourrez changer de liste à tout moment.</p>
              <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
                {guestLists.map((item) => {
                  const list = guests.filter((g) => g.party === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => chooseList(item.id as Party)}
                      style={{ "--party-card-accent": item.accent, "--party-card-deep": item.deep, "--party-card-soft": item.soft, "--party-card-border": item.border } as CSSProperties}
                      className="admin-list-choice group rounded-2xl border p-6 text-left transition hover:-translate-y-0.5"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="admin-list-mark grid h-12 w-12 place-items-center rounded-full text-xl font-semibold text-white">{item.mark}</span>
                        <span className="admin-list-label rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">Liste {item.title}</span>
                      </span>
                      <span className="mt-5 block font-serif text-2xl text-[var(--party-card-deep)]">Invités de {item.title}</span>
                      <span className="mt-1 block text-xs text-[var(--party-card-deep)]/65">Ouvrir et gérer cette liste</span>
                      <span className="mt-5 block border-t border-[var(--party-card-border)] pt-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--party-card-deep)]/70">
                        {list.length} invitation{list.length > 1 ? "s" : ""} · {list.filter((g) => g.status === "confirmed").length} présent(s)
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {view === "guests" && !listChosen && unassigned.length > 0 && (
            <section className={`${panel} p-6 md:p-8`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className={eyebrow}>À attribuer</p>
                  <h2 className="mt-2 font-serif text-2xl">{unassigned.length} invité{unassigned.length > 1 ? "s" : ""} sans liste</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/60">Ils n'apparaissent ni chez Jessica ni chez Geldi. Cochez-les puis rangez-les dans la bonne liste.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guestLists.map((l) => (
                    <Button
                      key={l.id}
                      type="button"
                      disabled={!toAssign.length || assignPartyMutation.isPending}
                      onClick={() => assignPartyMutation.mutate({ ids: toAssign, party: l.id as Party })}
                      style={{ background: l.accent }}
                      className="rounded-full px-5 text-[13px] font-medium normal-case tracking-normal text-white hover:brightness-90"
                    >
                      {l.mark} · {toAssign.length || ""} vers {l.title}
                    </Button>
                  ))}
                </div>
              </div>
              <label className="mt-5 flex items-center gap-2 text-xs text-foreground/60">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#6e1420]"
                  checked={toAssign.length === unassigned.length}
                  onChange={(e) => setToAssign(e.target.checked ? unassigned.map((g) => g.id) : [])}
                />
                Tout sélectionner ({unassigned.length}, toutes pages)
              </label>
              <div className="mt-3 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                {unassigned.slice(assignPage * PAGE_SIZE, (assignPage + 1) * PAGE_SIZE).map((g) => (
                  <div key={g.id} className="flex items-center gap-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${g.firstName} ${g.lastName}`}
                      className="h-4 w-4 accent-[#6e1420]"
                      checked={toAssign.includes(g.id)}
                      onChange={() => setToAssign((ids) => (ids.includes(g.id) ? ids.filter((id) => id !== g.id) : [...ids, g.id]))}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-base">{g.firstName} {g.lastName}</span>
                      <span className="text-[11px] text-foreground/45">{g.invitedCount || g.guestCount || 1} place(s)</span>
                    </span>
                    <StatusBadge status={g.status} />
                    {guestLists.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        disabled={assignPartyMutation.isPending}
                        onClick={() => assignPartyMutation.mutate({ ids: [g.id], party: l.id as Party })}
                        style={{ borderColor: l.border, color: l.deep, background: l.soft }}
                        className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:brightness-95"
                      >
                        {l.mark} · {l.title}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <Pager page={Math.min(assignPage, Math.max(0, Math.ceil(unassigned.length / PAGE_SIZE) - 1))} total={unassigned.length} onChange={setAssignPage} />
            </section>
          )}

          {view === "guests" && listChosen && (
            <>
              <div className={`${panel} admin-party-context flex flex-wrap items-center justify-between gap-4 px-6 py-5`}>
                <div className="flex items-center gap-4">
                  <span className="admin-party-context-mark grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-semibold text-white">{activeList?.mark}</span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--party-deep)]/65">Vous gérez actuellement</p>
                    <p className="mt-1 font-serif text-xl text-[var(--party-deep)]">La liste de {activeList?.title}</p>
                    <p className="mt-1 text-xs font-medium text-[var(--party-deep)]/65">{inList.length} invitation{inList.length === 1 ? "" : "s"} pour {activeEvent.shortLabel.toLowerCase()}</p>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={() => { setListChosen(false); sessionStorage.removeItem(LIST_KEY); }} className={`${buttonBase} border-[var(--party-border)] bg-white/70 text-[var(--party-deep)] hover:bg-white hover:text-[var(--party-deep)]`}>
                  Changer de liste
                </Button>
              </div>

              {ceremonyFilter && (
                <nav aria-label="Étapes des invitations" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {stages.map((item) => {
                    const list = inListForEvent.filter((g) => stageMatches(item.id, g));
                    const active = stage === item.id;
                    return (
                      <button key={item.id} type="button" aria-pressed={active} onClick={() => setStage(item.id)} className={`rounded-2xl p-4 text-left transition ${active ? "admin-hero" : "border border-black/[0.06] bg-white hover:bg-[#f5f5f6]"}`}>
                        <span className={`block text-[11px] uppercase tracking-[0.06em] ${active ? "text-white/60" : "text-foreground/40"}`}>{item.step}</span>
                        <span className="mt-1 block font-serif text-3xl tabular-nums">{list.length}</span>
                        <span className="block text-xs">{item.label}</span>
                        {item.id === "confirmed" && <span className={`block text-[11px] ${active ? "text-white/60" : "text-foreground/45"}`}>{sumPeople(list)} personne(s)</span>}
                      </button>
                    );
                  })}
                </nav>
              )}

              <section className={`${panel} p-5 md:p-7`}>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-foreground/60">{ceremonyFilter ? stages.find((s) => s.id === stage)!.hint : "Choisissez une célébration pour afficher ses invités."}</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e1420]/40" />
                      <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Un nom, un e-mail, un téléphone…" aria-label="Rechercher un invité" className="h-11 w-full min-w-[240px] rounded-xl border-[#6e1420]/15 pl-10" />
                    </div>
                    <Button type="button" variant="outline" disabled={!ceremonyFilter} onClick={() => ceremonyFilter && window.open(`/api/admin/guests/export?event=${ceremonyFilter}&sort=name`, "_blank")} className={`${buttonBase} h-11 border-[#6e1420]/20 text-[#6e1420] disabled:opacity-40`}>
                      <Download className="mr-2 h-4 w-4" strokeWidth={1.6} /> Export CSV
                    </Button>
                  </div>
                </div>
          {/* Liste des invités */}
          {isLoadingGuests ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {paginatedGuests.map((guest) => (
                <article
                  key={guest.id}
                  style={isParty(guest.party) ? {
                    "--guest-party-accent": partyVisuals[guest.party].accent,
                    "--guest-party-soft": partyVisuals[guest.party].soft,
                    "--guest-party-deep": partyVisuals[guest.party].deep,
                    "--guest-party-border": partyVisuals[guest.party].border,
                  } as CSSProperties : undefined}
                  className="admin-guest-card rounded-2xl border p-4 md:p-5"
                >
                  {/* Nom + statut */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <p className="font-serif text-xl text-foreground leading-tight">
                        {guest.firstName} {guest.lastName}
                      </p>
                      <p className="text-sm text-foreground/55 truncate">
                        {guest.email || "—"} · {guest.phone || "—"}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-foreground/35">
                        {guest.guestCount || 1} présent(s) sur {guest.invitedCount || guest.guestCount || 1} place(s) · {partyLabel(guest.party)} ·{" "}
                        {guest.tableNumber ? `Table ${guest.tableNumber} · ` : ""}
                        {guest.createdAt
                          ? format(new Date(guest.createdAt), "d MMM yyyy", { locale: fr })
                          : "—"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {isParty(guest.party) && (
                        <span className="admin-guest-party-badge rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]">
                          {guest.party === "jessica" ? "J · Jessica" : "G · Geldi"}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={`rounded-full border-0 px-3 py-1 text-[11px] uppercase tracking-[0.06em] ${
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
                            ? "Absent(e)"
                            : "En attente"}
                      </Badge>
                      {guest.checkedInAt && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-0 px-3 py-0.5 text-[11px] uppercase tracking-[0.06em] bg-primary/5 text-primary"
                        >
                          Check-in ✓
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Statut invitation */}
                  <div className="mt-3 pt-3 border-t border-primary/8 flex items-center gap-3 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`rounded-full border-0 px-2 py-0.5 text-[11px] uppercase tracking-[0.06em] ${
                        guest.invitationStatus === "sent"
                          ? "bg-stone-100 text-stone-700"
                          : "bg-[#ECEFF1] text-[#5F6870]"
                      }`}
                    >
                      {guest.invitationStatus === "sent" ? "Envoyée" : "Brouillon"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`rounded-full border-0 px-2 py-0.5 text-[11px] uppercase tracking-[0.06em] ${
                        getEventKeys(guest.invitedCeremonyChoice || guest.ceremonyChoice).length > 1
                          ? "bg-purple-50 text-purple-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {getEventKeys(guest.invitedCeremonyChoice || guest.ceremonyChoice)
                        .map((key) => weddingEvents[key].shortLabel)
                        .join(", ")}
                    </Badge>
                    {guest.beverageChoice && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-0 px-2 py-0.5 text-[11px] uppercase tracking-[0.06em] bg-sky-50 text-sky-700"
                      >
                        {guest.beverageChoice}
                      </Badge>
                    )}

                    {(guest.city || guest.country) && <span className="text-[11px] text-foreground/45">{[guest.city, guest.country].filter(Boolean).join(", ")}</span>}
                    {guest.invitationSentAt && (
                      <span className="text-[11px] text-foreground/40">
                        {format(new Date(guest.invitationSentAt), "d MMM, HH:mm", { locale: fr })}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-foreground/30 truncate max-w-[200px] hidden md:block">
                      {getTransitInvitationUrl(guest)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-primary/8 flex flex-wrap items-center gap-2">
                    <PrettySelect
                      value={(guest as any).tableNumber ?? ""}
                      onChange={(value) =>
                        updateTableMutation.mutate({
                          id: guest.id,
                          tableNumber: value ? Number(value) : null,
                        })
                      }
                      options={tableOptions}
                      placeholder="Table"
                      compact
                      className="min-w-[138px]"
                      buttonClassName="bg-transparent text-primary"
                    />

                    <div className="w-px h-6 bg-primary/10 mx-1" />

                    {guest.status !== "declined" && (
                      <Button
                        type="button" size="sm" variant="outline"
                        onClick={() => shareViaWhatsApp(guest)}
                        className="rounded-full border-primary/15 text-[13px] font-medium normal-case tracking-normal text-primary hover:bg-[#f5f5f6] hover:text-primary"
                      >
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                        WhatsApp
                      </Button>
                    )}
                    {guest.status !== "declined" && (
                      <Button
                        type="button" size="sm" variant="outline"
                        onClick={() => shareViaEmail(guest)}
                        className="rounded-full border-primary/15 text-[13px] font-medium normal-case tracking-normal text-primary"
                      >
                        <Mail className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                        E-mail
                      </Button>
                    )}
                    {guest.status !== "declined" && (
                      <Button
                        type="button" size="sm" variant="outline"
                        onClick={() => copyInvitationLink(guest)}
                        className="rounded-full border-primary/15 text-[13px] font-medium normal-case tracking-normal text-primary"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                        Copier
                      </Button>
                    )}
                    <Button
                      type="button" size="sm" variant="outline"
                      onClick={() => startEditingGuest(guest)}
                      className="rounded-full border-primary/15 text-[13px] font-medium normal-case tracking-normal text-primary"
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                      Modifier
                    </Button>
                    <Button
                      type="button" size="sm" variant="outline"
                      onClick={() => {
                        if (confirm(`Supprimer définitivement ${guest.firstName} ${guest.lastName} ? Son lien d'invitation ne fonctionnera plus.`)) {
                          deleteGuestMutation.mutate(guest.id);
                        }
                      }}
                      className="rounded-full border-rose-200 text-[13px] font-medium normal-case tracking-normal text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} />
                      Supprimer
                    </Button>
                  </div>
                </article>
              ))}

              {filteredGuests.length === 0 && (
                <div className="py-20 text-center">
                  {!ceremonyFilter ? (
                    <>
                      <p className="font-serif text-2xl text-foreground/70">Choisissez une célébration</p>
                      <p className="mx-auto mt-3 max-w-md text-sm text-foreground/45">
                        Sélectionnez un événement ci-dessus pour afficher ses invités. La liste et l'export sont propres à chaque célébration.
                      </p>
                    </>
                  ) : (
                    <p className="font-serif text-2xl text-foreground/55">Aucun invité ne correspond à cette recherche.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {(totalPages > 1 || filteredGuests.length > 10) && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-primary/8 pt-5">
              <div className="flex items-center gap-3">
                <p className="text-[11px] uppercase tracking-[0.06em] text-foreground/40">
                  Page {currentPage + 1} / {totalPages} · {filteredGuests.length} invité{filteredGuests.length > 1 ? "s" : ""}
                </p>
                <PrettySelect
                  value={pageSize}
                  onChange={(value) => setPageSize(Number(value))}
                  options={pageSizeOptions}
                  placeholder="Par page"
                  compact
                  className="min-w-[130px]"
                  buttonClassName="bg-transparent text-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 0}
                  className="rounded-full border-primary/15 px-3 py-5 text-primary hover:bg-primary/5 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.6} />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant={i === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i)}
                    className={`rounded-full px-4 py-5 text-[13px] font-medium normal-case tracking-normal ${
                      i === currentPage
                        ? "bg-primary text-primary-foreground hover:bg-foreground"
                        : "border-primary/15 text-primary hover:bg-primary/5"
                    }`}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="rounded-full border-primary/15 px-3 py-5 text-primary hover:bg-primary/5 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.6} />
                </Button>
              </div>
            </div>
          )}
              </section>
            </>
          )}

          {/* ══════ PLAN DE TABLE ══════ */}
          {view === "tables" && (
            <>
              <div className="flex flex-wrap gap-2">
                {[{ id: "all", title: "Tous", mark: "" }, ...guestLists].map((l) => {
                  const listTheme = isParty(l.id) ? partyVisuals[l.id] : null;
                  const isActive = partyFilter === l.id;
                  return (
                    <Button
                      key={l.id}
                      type="button"
                      variant="outline"
                      aria-pressed={isActive}
                      onClick={() => setPartyFilter(l.id)}
                      style={listTheme ? {
                        borderColor: listTheme.border,
                        background: isActive ? listTheme.accent : listTheme.soft,
                        color: isActive ? "#ffffff" : listTheme.deep,
                      } : undefined}
                      className={`${buttonBase} ${listTheme ? "hover:brightness-95" : isActive ? "border-[var(--admin-event-accent)] bg-[var(--admin-event-accent)] text-white hover:text-white" : "border-[var(--admin-event-accent)]/30 text-[var(--admin-event-deep)]"}`}
                    >
                      {l.mark && `${l.mark} · `}{l.title} · {guests.filter((g) => l.id === "all" || g.party === l.id).length}
                    </Button>
                  );
                })}
                <Button type="button" variant="outline" onClick={addTable} className={`${buttonBase} ml-auto border-[#6e1420]/20 text-[#6e1420]`}>
                  <Plus className="mr-2 h-4 w-4" strokeWidth={1.6} /> Ajouter une table ({tableCount})
                </Button>
              </div>
              <div className={`${panel} flex flex-wrap items-center gap-x-8 gap-y-2 px-6 py-4 text-sm`}>
                <strong className="font-serif text-lg">{tableCount} tables</strong>
                <span>{sumPeople(confirmed.filter((g) => g.tableNumber))} personnes confirmées placées</span>
                <span className="text-[#6e1420]">{sumPeople(confirmed.filter((g) => !g.tableNumber))} à placer</span>
                <Button type="button" variant="outline" disabled={!ceremonyFilter} onClick={() => ceremonyFilter && window.open(`/api/admin/guests/export?event=${ceremonyFilter}&sort=table`, "_blank")} className={`${buttonBase} ml-auto h-10 border-[#6e1420]/20 text-[#6e1420] disabled:opacity-40`}>
                  <Download className="mr-2 h-4 w-4" strokeWidth={1.6} /> Export par table
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e1420]/40" />
                <Input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Rechercher un invité à placer…" aria-label="Rechercher un invité à placer" className="h-11 rounded-xl border-[#6e1420]/15 bg-white pl-10" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[null, ...tableNumbers].map((number) => {
                  const list = seatable.filter((g) => (g.tableNumber ?? null) === number);
                  if (number !== null && !list.length && tableQuery) return null;
                  return (
                    <section key={number ?? "none"} className={`${panel} p-5 ${number === null ? "md:col-span-2 xl:col-span-3" : ""}`}>
                      <div className="flex items-end justify-between gap-4 border-b border-[#6e1420]/8 pb-3">
                        <div>
                          <p className={eyebrow}>{number ? "Une belle tablée" : "À organiser"}</p>
                          <h2 className="mt-1 font-serif text-2xl">{number ? `Table ${number}` : "Sans table"}</h2>
                        </div>
                        <p className="text-right font-serif text-2xl tabular-nums">{sumPeople(list.filter((g) => g.status === "confirmed"))}<span className="block text-[11px] uppercase tracking-[0.06em] text-foreground/45">confirmés</span></p>
                      </div>
                      <div className={`mt-2 ${number === null ? "grid gap-x-6 md:grid-cols-2 xl:grid-cols-3" : ""}`}>
                        {list.map((g) => (
                          <div key={g.id} className="flex items-center justify-between gap-3 border-b border-[#6e1420]/5 py-2 text-sm">
                            <span className="min-w-0">
                              <span className="block truncate">{g.firstName} {g.lastName}</span>
                              <span className="block text-[11px] text-foreground/45">{g.guestCount} pers. · {g.status === "confirmed" ? "Confirmé" : "En attente"}</span>
                            </span>
                            <select
                              aria-label={`Table de ${g.firstName} ${g.lastName}`}
                              value={g.tableNumber ?? ""}
                              disabled={updateTableMutation.isPending}
                              onChange={(e) => updateTableMutation.mutate({ id: g.id, tableNumber: e.target.value ? Number(e.target.value) : null })}
                              className="h-9 shrink-0 border border-[#6e1420]/15 bg-white px-2 text-xs"
                            >
                              <option value="">Sans table</option>
                              {tableNumbers.map((n) => <option key={n} value={n}>Table {n}</option>)}
                            </select>
                          </div>
                        ))}
                        {!list.length && <p className="py-3 text-sm text-foreground/45">{number ? "Aucun invité à cette table." : "Tous les invités actifs sont placés."}</p>}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}

          {/* ══════ ACCUEIL ══════ */}
          {view === "checkin" && (
            <>
              <section className="admin-hero flex flex-wrap items-center gap-6 rounded-3xl px-7 py-8">
                <p className="font-serif text-6xl tabular-nums">{sumPeople(arrived)}<span className="text-2xl text-white/50"> / {stats.confirmedInvites}</span></p>
                <div>
                  <h2 className="font-serif text-2xl">Ils nous ont rejoints.</h2>
                  <p className="text-sm text-white/65">{confirmed.length - arrived.length} groupe(s) encore attendu(s)</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => confirm("Réinitialiser tous les check-ins ? Cette action efface toutes les arrivées enregistrées.") && resetCheckInsMutation.mutate()}
                  disabled={resetCheckInsMutation.isPending}
                  className={`${buttonBase} ml-auto border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white`}
                >
                  <RotateCcw className="mr-2 h-4 w-4" strokeWidth={1.6} /> Tout réinitialiser
                </Button>
              </section>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e1420]/40" />
                <Input value={checkinSearch} onChange={(e) => setCheckinSearch(e.target.value)} placeholder="Rechercher le nom d'un invité…" aria-label="Rechercher à l'accueil" className="h-12 rounded-xl border-[#6e1420]/15 bg-white pl-10" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {checkinList.map((g) => (
                  <article key={g.id} className={`${panel} flex items-center gap-4 p-4 ${g.checkedInAt ? "opacity-70" : ""}`}>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[11px] ${g.checkedInAt ? "bg-emerald-600 text-white" : "bg-[#6e1420]/8 text-[#6e1420]"}`}>{g.firstName[0]}{g.lastName[0]}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-serif text-lg">{g.firstName} {g.lastName}</h3>
                      <p className="text-xs text-foreground/55">{g.guestCount} personne(s) · {g.tableNumber ? `Table ${g.tableNumber}` : "Table à attribuer"}</p>
                      {g.checkedInAt && <p className="text-[11px] text-emerald-700">Arrivée à {format(new Date(g.checkedInAt), "HH:mm")}</p>}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={checkInMutation.isPending}
                      onClick={() => checkInMutation.mutate({ id: g.id, arrived: !g.checkedInAt })}
                      className={`${buttonBase} px-4 ${g.checkedInAt ? "border-[#6e1420]/20 text-[#6e1420]" : "border-[#6e1420] bg-[#6e1420] text-white hover:bg-[#4a0d15] hover:text-white"}`}
                    >
                      {g.checkedInAt ? "Annuler ↶" : "Valider ✓"}
                    </Button>
                  </article>
                ))}
              </div>
              {!checkinList.length && <Empty title="Aucun invité à accueillir pour le moment." text="Seuls les invités ayant confirmé leur présence figurent ici." />}
              <p className="text-xs text-foreground/50">Une validation enregistre l'arrivée de toutes les personnes de l'invitation. La liste se met à jour toutes les 15 secondes.</p>
            </>
          )}

          {/* ══════ MESSAGES & ATTENTIONS ══════ */}
          {view === "messages" && (
            <div className="mx-auto max-w-3xl">
              <section className={`${panel} p-6`}>
                <div className="flex items-end justify-between"><h2 className="font-serif text-2xl">Les mots pour vous</h2><span className="text-sm text-foreground/45">{guests.filter((g) => g.message).length}</span></div>
                <div className="mt-4 space-y-4">
                  {guests.filter((g) => g.message).map((g) => (
                    <blockquote key={g.id} className="rounded-2xl bg-[#f5f5f6] px-5 py-4">
                      <p className="font-serif text-lg italic leading-7">« {g.message} »</p>
                      <footer className="mt-3 flex items-center justify-between gap-3">
                        <button type="button" onClick={() => startEditingGuest(g)} className="text-[11px] uppercase tracking-[0.06em] text-[#6e1420] hover:underline">{g.firstName} {g.lastName} ↗</button>
                        <StatusBadge status={g.status} />
                      </footer>
                    </blockquote>
                  ))}
                  {!guests.some((g) => g.message) && <Empty title="Le livre des petits mots attend ses premières lignes." text="Les messages laissés dans les réponses seront rassemblés ici." />}
                </div>
              </section>

            </div>
          )}

          {view === "settings" && <AdminSettingsPanel />}
          {view === "account" && <AdminAccountPanel user={user} />}
        </main>
      </div>
    </div>
  );
}
