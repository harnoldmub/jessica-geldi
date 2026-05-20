import { useQuery, useMutation } from "@tanstack/react-query";
import { type RsvpResponse } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, Loader2, UserCheck } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckIn() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: guests, isLoading } = useQuery<RsvpResponse[]>({
    queryKey: ["/api/admin/guests"],
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/rsvp/${id}/check-in`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guests"] });
      toast({ title: "Entrée validée avec joie" });
    },
  });

  const filteredGuests = guests?.filter(g => 
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (a.checkedInAt ? 1 : -1));

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background"><Loader2 className="animate-spin text-primary w-12 h-12" strokeWidth={1} /></div>;
  }

  return (
    <div className="min-h-screen bg-ivory/20 flex flex-col gap-8 pb-32">
      <header className="bg-white px-6 py-12 text-center border-b border-primary/5 editorial-shadow">
         <div className="flex items-center justify-center gap-2 text-primary/60 mb-4">
           <UserCheck className="w-5 h-5" strokeWidth={1.5} />
           <p className="text-[10px] font-sans tracking-[0.5em] uppercase">Private Reception</p>
         </div>
         <h1 className="text-4xl md:text-5xl font-serif text-foreground leading-tight italic">Bienvenue</h1>
         <p className="font-script text-2xl text-primary/40 lowercase mt-2">mamisa & marylin</p>
      </header>

      <div className="px-6 sticky top-0 z-20 pt-4">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-30 group-focus-within:opacity-100 transition-opacity duration-500" />
          <Input 
            placeholder="Rechercher un convive..." 
            className="pl-16 py-10 rounded-none border-primary/10 bg-white/90 backdrop-blur-md text-xl font-serif italic editorial-shadow focus-visible:ring-1 focus-visible:ring-primary/20" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6">
        <AnimatePresence mode="popLayout">
          {filteredGuests?.map((guest) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={guest.id}
            >
              <Card className={`rounded-none border-primary/5 editorial-shadow transition-all duration-1000 ${guest.checkedInAt ? 'opacity-30' : 'bg-white'}`}>
                <CardContent className="p-8 flex justify-between items-center gap-6">
                  <div className="space-y-2">
                    <p className="font-serif text-2xl text-foreground">{guest.firstName} {guest.lastName}</p>
                    <div className="flex items-center gap-4">
                       <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-primary/40">{guest.guestCount} places réservées</p>
                       {guest.checkedInAt && (
                         <Badge variant="outline" className="bg-primary/5 text-primary text-[9px] uppercase tracking-widest px-3 border-none">Enregistré</Badge>
                       )}
                    </div>
                  </div>

                  {!guest.checkedInAt ? (
                    <Button 
                      onClick={() => checkInMutation.mutate(guest.id)}
                      disabled={checkInMutation.isPending}
                      className="rounded-none h-16 w-16 p-0 bg-primary hover:bg-foreground text-white transition-all duration-1000 editorial-shadow flex items-center justify-center shrink-0"
                    >
                      <Check className="w-8 h-8" strokeWidth={1.5} />
                    </Button>
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center border border-primary/10 rounded-none">
                       <Check className="w-8 h-8 text-primary" strokeWidth={1} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredGuests?.length === 0 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 font-serif italic text-foreground/30 text-xl"
          >
            "Aucun convive ne semble correspondre à votre recherche"
          </motion.p>
        )}
      </div>
      
      {/* Footer Branding */}
      <footer className="mt-auto py-12 text-center opacity-20 pointer-events-none">
          <p className="font-script text-4xl text-primary lowercase">m&m</p>
      </footer>
    </div>
  );
}
