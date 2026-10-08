import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { defaultSiteSettings, type SiteSettings } from "@shared/siteSettings";
import { weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PrettySelect from "@/components/PrettySelect";

type StoredSettings = { settings: SiteSettings; revision: number };

const fieldClass = "h-12 rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20";
const textareaClass = "min-h-[110px] rounded-xl border-primary/15 bg-transparent focus-visible:ring-primary/20";
const labelClass = "text-[11px] uppercase tracking-[0.06em] text-foreground/60";
const eventKeys = Object.keys(weddingEvents) as WeddingEventKey[];

export default function AdminSettingsPanel() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<StoredSettings>({ queryKey: ["/api/admin/settings"] });
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [revision, setRevision] = useState(0);
  const [baseline, setBaseline] = useState("");

  useEffect(() => {
    if (!data) return;
    setSettings(data.settings);
    setRevision(data.revision);
    setBaseline(JSON.stringify(data.settings));
  }, [data]);

  const dirty = useMemo(() => baseline !== "" && JSON.stringify(settings) !== baseline, [baseline, settings]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", "/api/admin/settings", { settings, revision });
      return (await response.json()) as StoredSettings;
    },
    onSuccess: (saved) => {
      setSettings(saved.settings);
      setRevision(saved.revision);
      setBaseline(JSON.stringify(saved.settings));
      queryClient.setQueryData(["/api/admin/settings"], saved);
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({ title: "Informations publiées", description: "Le site public est maintenant à jour." });
    },
    onError: (error: Error) => toast({ title: "Enregistrement impossible", description: error.message, variant: "destructive" }),
  });

  const move = (collection: "program" | "practical", index: number, direction: number) => {
    const next = [...settings[collection]];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSettings((current) => ({ ...current, [collection]: next }));
  };

  if (isLoading) return <section id="site-settings" className="border border-primary/10 bg-white p-8">Chargement des réglages…</section>;

  return (
    <section id="site-settings" className="border border-primary/10 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-18px_rgba(0,0,0,0.14)] md:p-8">
      <div className="flex flex-col gap-4 border-b border-primary/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.06em] text-primary/60">Publication</p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Informations du mariage</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground/60">Les textes, lieux et rubriques enregistrés ici sont immédiatement utilisés sur le site public.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={!dirty || saveMutation.isPending} onClick={() => data && setSettings(data.settings)} className="rounded-full border-primary/15">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" /> Annuler
          </Button>
          <Button type="button" disabled={!dirty || saveMutation.isPending} onClick={() => saveMutation.mutate()} className="rounded-full bg-primary text-primary-foreground">
            <Save className="mr-2 h-4 w-4" aria-hidden="true" /> {saveMutation.isPending ? "Publication…" : "Publier"}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <label className="space-y-2"><span className={labelClass}>Sous-titre principal</span><Input className={fieldClass} value={settings.heroSubtitle} onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })} /></label>
        <label className="space-y-2"><span className={labelClass}>Texte du pied de page</span><Textarea className={textareaClass} value={settings.footerText} onChange={(e) => setSettings({ ...settings, footerText: e.target.value })} /></label>
        <label className="space-y-2 lg:col-span-2"><span className={labelClass}>Texte d’invitation</span><Textarea className={textareaClass} value={settings.invitationText} onChange={(e) => setSettings({ ...settings, invitationText: e.target.value })} /></label>
        <label className="space-y-2 lg:col-span-2"><span className={labelClass}>Notre histoire</span><Textarea className={textareaClass} value={settings.storyText} onChange={(e) => setSettings({ ...settings, storyText: e.target.value })} /></label>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {eventKeys.map((key) => {
          const details = settings.events[key];
          return (
            <fieldset key={key} className="border border-primary/10 p-5">
              <legend className="px-2 font-serif text-xl">{weddingEvents[key].label}</legend>
              <div className="space-y-4">
                <label className="block space-y-2"><span className={labelClass}>Lieu</span><Input className={fieldClass} value={details.venue} onChange={(e) => setSettings({ ...settings, events: { ...settings.events, [key]: { ...details, venue: e.target.value } } })} /></label>
                <label className="block space-y-2"><span className={labelClass}>Adresse</span><Input className={fieldClass} value={details.address} onChange={(e) => setSettings({ ...settings, events: { ...settings.events, [key]: { ...details, address: e.target.value } } })} /></label>
                <label className="block space-y-2"><span className={labelClass}>Lien Maps</span><Input type="url" className={fieldClass} value={details.mapsUrl} onChange={(e) => setSettings({ ...settings, events: { ...settings.events, [key]: { ...details, mapsUrl: e.target.value } } })} /></label>
                <label className="block space-y-2"><span className={labelClass}>Note</span><Textarea className={textareaClass} value={details.note} onChange={(e) => setSettings({ ...settings, events: { ...settings.events, [key]: { ...details, note: e.target.value } } })} /></label>
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="mt-10 border-t border-primary/10 pt-8">
        <div className="flex items-center justify-between gap-4"><h3 className="font-serif text-2xl">Programme</h3><Button type="button" variant="outline" disabled={settings.program.length >= 12} onClick={() => setSettings({ ...settings, program: [...settings.program, { event: "civil", time: "À venir", title: "Nouvelle étape", text: "" }] })} className="rounded-full border-primary/15"><Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Ajouter</Button></div>
        <div className="mt-5 space-y-4">
          {settings.program.map((item, index) => (
            <div key={`${item.event}-${index}`} className="grid gap-3 border border-primary/10 p-4 lg:grid-cols-[170px_1fr_1fr_auto]">
              <PrettySelect value={item.event} onChange={(value) => setSettings({ ...settings, program: settings.program.map((row, i) => i === index ? { ...row, event: value as WeddingEventKey } : row) })} options={eventKeys.map((key) => ({ value: key, label: weddingEvents[key].shortLabel }))} />
              <Input aria-label={`Horaire de l’étape ${index + 1}`} className={fieldClass} value={item.time} onChange={(e) => setSettings({ ...settings, program: settings.program.map((row, i) => i === index ? { ...row, time: e.target.value } : row) })} />
              <div className="space-y-2"><Input aria-label={`Titre de l’étape ${index + 1}`} className={fieldClass} value={item.title} onChange={(e) => setSettings({ ...settings, program: settings.program.map((row, i) => i === index ? { ...row, title: e.target.value } : row) })} /><Input aria-label={`Description de l’étape ${index + 1}`} className={fieldClass} value={item.text} onChange={(e) => setSettings({ ...settings, program: settings.program.map((row, i) => i === index ? { ...row, text: e.target.value } : row) })} /></div>
              <div className="flex gap-1 lg:flex-col">
                <Button type="button" variant="ghost" size="sm" aria-label={`Monter l’étape ${index + 1}`} disabled={index === 0} onClick={() => move("program", index, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" aria-label={`Descendre l’étape ${index + 1}`} disabled={index === settings.program.length - 1} onClick={() => move("program", index, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" aria-label={`Supprimer l’étape ${index + 1}`} disabled={settings.program.length === 1} onClick={() => setSettings({ ...settings, program: settings.program.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 border-t border-primary/10 pt-8 lg:grid-cols-2">
        <div>
          <label className="flex min-h-12 items-center gap-3 border border-primary/10 px-4 text-sm"><input type="checkbox" checked={settings.contribution.enabled} onChange={(e) => setSettings({ ...settings, contribution: { ...settings.contribution, enabled: e.target.checked } })} /> Afficher la section contribution</label>
          <label className="mt-4 block space-y-2"><span className={labelClass}>Titre</span><Input className={fieldClass} value={settings.contribution.title} onChange={(e) => setSettings({ ...settings, contribution: { ...settings.contribution, title: e.target.value } })} /></label>
          <label className="mt-4 block space-y-2"><span className={labelClass}>Message</span><Textarea className={textareaClass} value={settings.contribution.message} onChange={(e) => setSettings({ ...settings, contribution: { ...settings.contribution, message: e.target.value } })} /></label>
        </div>
        <div>
          <div className="flex items-center justify-between"><h3 className="font-serif text-2xl">Informations pratiques</h3><Button type="button" variant="outline" disabled={settings.practical.length >= 12} onClick={() => setSettings({ ...settings, practical: [...settings.practical, { title: "Nouvelle rubrique", text: "Informations à venir." }] })} className="rounded-full border-primary/15"><Plus className="mr-2 h-4 w-4" /> Ajouter</Button></div>
          <div className="mt-4 space-y-4">{settings.practical.map((item, index) => <div key={index} className="border border-primary/10 p-4"><Input aria-label={`Titre de la rubrique ${index + 1}`} className={fieldClass} value={item.title} onChange={(e) => setSettings({ ...settings, practical: settings.practical.map((row, i) => i === index ? { ...row, title: e.target.value } : row) })} /><Textarea aria-label={`Texte de la rubrique ${index + 1}`} className={`${textareaClass} mt-3`} value={item.text} onChange={(e) => setSettings({ ...settings, practical: settings.practical.map((row, i) => i === index ? { ...row, text: e.target.value } : row) })} /><div className="mt-2 flex justify-end gap-1"><Button type="button" variant="ghost" size="sm" aria-label={`Monter la rubrique ${index + 1}`} disabled={index === 0} onClick={() => move("practical", index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="sm" aria-label={`Descendre la rubrique ${index + 1}`} disabled={index === settings.practical.length - 1} onClick={() => move("practical", index, 1)}><ArrowDown className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="sm" aria-label={`Supprimer la rubrique ${index + 1}`} onClick={() => setSettings({ ...settings, practical: settings.practical.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>
        </div>
      </div>
    </section>
  );
}
