import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, KeyRound } from "lucide-react";
import type { SafeUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminAccountPanel({ user }: { user: SafeUser }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ username: user.username, currentPassword: "", newPassword: "" });
  useEffect(() => setForm((current) => ({ ...current, username: user.username })), [user.username]);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", "/api/admin/account", form);
      return (await response.json()) as SafeUser;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/user"], updated);
      setForm({ username: updated.username, currentPassword: "", newPassword: "" });
      toast({ title: "Compte mis à jour", description: "Les autres sessions administrateur ont été fermées." });
    },
    onError: (error: Error) => toast({ title: "Modification impossible", description: error.message, variant: "destructive" }),
  });

  return (
    <section id="account-backup" className="grid gap-6 lg:grid-cols-2">
      <div className="border border-primary/10 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-18px_rgba(0,0,0,0.14)] md:p-8">
        <div className="flex items-center gap-3 text-primary"><KeyRound className="h-5 w-5" aria-hidden="true" /><p className="text-[11px] uppercase tracking-[0.06em] text-primary/60">Sécurité</p></div>
        <h2 className="mt-4 font-serif text-3xl">Compte administrateur</h2>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
          <label className="block space-y-2"><span className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Identifiant</span><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="h-12 rounded-xl border-primary/15" autoComplete="username" /></label>
          <label className="block space-y-2"><span className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Mot de passe actuel</span><Input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="h-12 rounded-xl border-primary/15" autoComplete="current-password" required /></label>
          <label className="block space-y-2"><span className="text-[11px] uppercase tracking-[0.06em] text-foreground/60">Nouveau mot de passe</span><Input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="h-12 rounded-xl border-primary/15" autoComplete="new-password" minLength={10} placeholder="Laisser vide pour ne pas le changer" /></label>
          <Button type="submit" disabled={mutation.isPending || !form.currentPassword} className="rounded-full bg-primary text-primary-foreground">{mutation.isPending ? "Mise à jour…" : "Mettre à jour le compte"}</Button>
        </form>
      </div>
      <div className="border border-primary/10 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-18px_rgba(0,0,0,0.14)] md:p-8">
        <div className="flex items-center gap-3 text-primary"><Download className="h-5 w-5" aria-hidden="true" /><p className="text-[11px] uppercase tracking-[0.06em] text-primary/60">Archivage</p></div>
        <h2 className="mt-4 font-serif text-3xl">Sauvegarde complète</h2>
        <p className="mt-4 text-sm leading-7 text-foreground/60">Téléchargez une copie JSON des invités, réponses, tables et réglages publiés. Aucun mot de passe ni aucune session n’est inclus.</p>
        <Button type="button" variant="outline" onClick={() => window.open("/api/admin/backup", "_blank")} className="mt-6 rounded-full border-primary/15"><Download className="mr-2 h-4 w-4" aria-hidden="true" /> Télécharger la sauvegarde</Button>
      </div>
    </section>
  );
}
