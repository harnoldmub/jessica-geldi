import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type RsvpResponse } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Loader2, UserCheck, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CHECKIN_CODE = "MMCheckin2026";
const PAGE_SIZE = 15;

export default function CheckIn() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // Reset page on search change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const { data: guests = [], isLoading } = useQuery<RsvpResponse[]>({
    queryKey: ["/api/checkin/guests"],
    queryFn: async () => {
      const res = await fetch("/api/checkin/guests", {
        headers: { "X-Checkin-Code": CHECKIN_CODE },
      });
      if (!res.ok) throw new Error("Accès refusé");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/checkin/${id}/check-in`, {
        method: "PATCH",
        headers: { "X-Checkin-Code": CHECKIN_CODE },
      });
      if (!res.ok) throw new Error("Erreur check-in");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkin/guests"] });
      toast({ title: "Entrée validée ✓" });
    },
  });

  const uncheckMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/checkin/${id}/uncheck`, {
        method: "PATCH",
        headers: { "X-Checkin-Code": CHECKIN_CODE },
      });
      if (!res.ok) throw new Error("Erreur annulation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkin/guests"] });
      toast({ title: "Check-in annulé" });
    },
  });

  const filteredGuests = guests
    .filter((g) =>
      `${g.firstName} ${g.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => (a.checkedInAt ? 1 : 0) - (b.checkedInAt ? 1 : 0));

  const totalPages = Math.ceil(filteredGuests.length / PAGE_SIZE);
  const paginatedGuests = filteredGuests.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  const CAPACITY = 250;
  const checkedInCount = guests.filter((g) => g.checkedInAt).length;
  const waitingCount = guests.length - checkedInCount;

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col pb-24">
      {/* Sticky header with live counters */}
      <header className="bg-white px-6 py-6 text-center border-b border-primary/5 editorial-shadow sticky top-0 z-30">
        <div className="flex items-center justify-center gap-2 text-primary/60 mb-2">
          <UserCheck className="w-4 h-4" strokeWidth={1.5} />
          <p className="text-[9px] font-sans tracking-[0.5em] uppercase">
            Accueil Invités · 25 Juillet 2026
          </p>
        </div>
        <p className="font-script text-2xl text-foreground/70 leading-none">
          Mamisa & Marylin
        </p>
        <div className="mt-4 flex justify-center gap-8">
          <div>
            <p className="font-serif text-3xl text-foreground">{checkedInCount}</p>
            <p className="text-[9px] uppercase tracking-[0.4em] text-foreground/40 mt-0.5">
              Arrivés
            </p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="font-serif text-3xl text-foreground">{waitingCount}</p>
            <p className="text-[9px] uppercase tracking-[0.4em] text-foreground/40 mt-0.5">
              Attendus
            </p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="font-serif text-3xl text-foreground">
              {checkedInCount}
              <span className="text-lg text-foreground/30"> / {CAPACITY}</span>
            </p>
            <p className="text-[9px] uppercase tracking-[0.4em] text-foreground/40 mt-0.5">
              Capacité
            </p>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 pt-4 sticky top-[148px] z-20">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30" />
          <Input
            placeholder="Rechercher un invité..."
            className="pl-12 h-14 rounded-none border-primary/10 bg-white/95 backdrop-blur-md text-lg font-serif italic editorial-shadow focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Guest list */}
      <div className="flex flex-col gap-3 px-4 mt-4">
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2
              className="animate-spin text-primary w-10 h-10"
              strokeWidth={1}
            />
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {paginatedGuests.map((guest) => (
            <motion.div
              layout
              key={guest.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: guest.checkedInAt ? 0.45 : 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35 }}
            >
              <div className="bg-white border border-primary/5 editorial-shadow p-5 flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="font-serif text-xl text-foreground leading-tight">
                    {guest.firstName} {guest.lastName}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-primary/40">
                      {guest.guestCount} place
                      {guest.guestCount > 1 ? "s" : ""}
                    </p>
                    {guest.checkedInAt && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-0 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-none"
                      >
                        Arrivé ✓
                      </Badge>
                    )}
                  </div>
                </div>

                {!guest.checkedInAt ? (
                  <Button
                    onClick={() => checkInMutation.mutate(guest.id)}
                    disabled={checkInMutation.isPending}
                    className="rounded-none h-16 w-16 p-0 bg-primary hover:bg-foreground text-white shrink-0 flex items-center justify-center transition-all duration-300"
                  >
                    <Check className="w-7 h-7" strokeWidth={1.5} />
                  </Button>
                ) : (
                  <button
                    onClick={() => uncheckMutation.mutate(guest.id)}
                    disabled={uncheckMutation.isPending}
                    title="Annuler le check-in"
                    className="w-16 h-16 flex flex-col items-center justify-center gap-1 border border-emerald-200 bg-emerald-50 hover:bg-rose-50 hover:border-rose-200 shrink-0 transition-colors duration-200 group"
                  >
                    <Check className="w-5 h-5 text-emerald-600 group-hover:hidden" strokeWidth={1.5} />
                    <X className="w-5 h-5 text-rose-500 hidden group-hover:block" strokeWidth={1.5} />
                    <span className="text-[8px] uppercase tracking-wider text-emerald-600 group-hover:text-rose-500 leading-none">
                      <span className="group-hover:hidden">OK</span>
                      <span className="hidden group-hover:inline">Annuler</span>
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!isLoading && filteredGuests.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 font-serif italic text-foreground/30 text-xl"
          >
            Aucun invité trouvé
          </motion.p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 mt-6 flex items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/40">
            Page {currentPage + 1} / {totalPages} · {filteredGuests.length} invités
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 0}
              className="rounded-none border-primary/15 px-3 py-5 text-primary hover:bg-primary/5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.6} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                size="sm"
                variant={i === currentPage ? "default" : "outline"}
                onClick={() => setCurrentPage(i)}
                className={`rounded-none px-4 py-5 text-[10px] uppercase tracking-[0.25em] ${
                  i === currentPage
                    ? "bg-primary text-primary-foreground hover:bg-foreground"
                    : "border-primary/15 text-primary hover:bg-primary/5"
                }`}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= totalPages - 1}
              className="rounded-none border-primary/15 px-3 py-5 text-primary hover:bg-primary/5 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.6} />
            </Button>
          </div>
        </div>
      )}

      <footer className="mt-auto py-8 text-center opacity-15 pointer-events-none">
        <p className="font-script text-3xl text-primary lowercase">m&m</p>
      </footer>
    </div>
  );
}
