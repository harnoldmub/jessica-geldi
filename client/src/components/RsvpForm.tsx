import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { insertRsvpSchema, type RsvpFormInput, type RsvpResponse } from "@shared/schema";
import { beverageOptions } from "@shared/laeticiaMaxime";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import PrettySelect from "@/components/PrettySelect";

type RsvpFormProps = {
  variant?: "section" | "page" | "invitation";
  submitEndpoint?: string;
  initialValues?: Partial<RsvpFormInput>;
  title?: string;
  description?: string;
  submitLabel?: string;
  successTitle?: string;
  successDescription?: string;
  onSubmitted?: (guest: RsvpResponse) => void;
};

const defaultValues: RsvpFormInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  status: undefined as any,
  guestCount: 0,
  ceremonyChoice: undefined as any,
  mealChoice: "",
  beverageChoice: "",
  message: "",
};

const COUNTRY_CODES_BASE = [
  { code: "+243", country: "RDC" },
  { code: "+242", country: "Congo" },
  { code: "+244", country: "Angola" },
  { code: "+1", country: "Canada" },
  { code: "+1", country: "Etats-Unis" },
  { code: "+33", country: "France" },
  { code: "+32", country: "Belgique" },
  { code: "+41", country: "Suisse" },
  { code: "+44", country: "Royaume-Uni" },
  { code: "+49", country: "Allemagne" },
  { code: "+34", country: "Espagne" },
  { code: "+39", country: "Italie" },
  { code: "+351", country: "Portugal" },
  { code: "+31", country: "Pays-Bas" },
  { code: "+352", country: "Luxembourg" },
  { code: "+43", country: "Autriche" },
  { code: "+353", country: "Irlande" },
  { code: "+45", country: "Danemark" },
  { code: "+46", country: "Suede" },
  { code: "+47", country: "Norvege" },
  { code: "+358", country: "Finlande" },
  { code: "+354", country: "Islande" },
  { code: "+372", country: "Estonie" },
  { code: "+371", country: "Lettonie" },
  { code: "+370", country: "Lituanie" },
  { code: "+48", country: "Pologne" },
  { code: "+420", country: "Tchequie" },
  { code: "+421", country: "Slovaquie" },
  { code: "+36", country: "Hongrie" },
  { code: "+40", country: "Roumanie" },
  { code: "+359", country: "Bulgarie" },
  { code: "+30", country: "Grece" },
  { code: "+385", country: "Croatie" },
  { code: "+386", country: "Slovenie" },
  { code: "+387", country: "Bosnie-Herzegovine" },
  { code: "+381", country: "Serbie" },
  { code: "+382", country: "Montenegro" },
  { code: "+389", country: "Macédoine du Nord" },
  { code: "+355", country: "Albanie" },
  { code: "+383", country: "Kosovo" },
  { code: "+373", country: "Moldavie" },
  { code: "+380", country: "Ukraine" },
  { code: "+375", country: "Bielorussie" },
  { code: "+7", country: "Russie" },
  { code: "+356", country: "Malte" },
  { code: "+357", country: "Chypre" },
  { code: "+376", country: "Andorre" },
  { code: "+377", country: "Monaco" },
  { code: "+378", country: "Saint-Marin" },
  { code: "+379", country: "Vatican" },
  { code: "+350", country: "Gibraltar" },
  { code: "+90", country: "Turquie" },
  { code: "+212", country: "Maroc" },
  { code: "+213", country: "Algerie" },
  { code: "+216", country: "Tunisie" },
  { code: "+218", country: "Libye" },
  { code: "+20", country: "Egypte" },
  { code: "+249", country: "Soudan" },
  { code: "+211", country: "Soudan du Sud" },
  { code: "+251", country: "Ethiopie" },
  { code: "+291", country: "Erythree" },
  { code: "+253", country: "Djibouti" },
  { code: "+252", country: "Somalie" },
  { code: "+254", country: "Kenya" },
  { code: "+255", country: "Tanzanie" },
  { code: "+256", country: "Ouganda" },
  { code: "+250", country: "Rwanda" },
  { code: "+257", country: "Burundi" },
  { code: "+260", country: "Zambie" },
  { code: "+265", country: "Malawi" },
  { code: "+258", country: "Mozambique" },
  { code: "+263", country: "Zimbabwe" },
  { code: "+267", country: "Botswana" },
  { code: "+264", country: "Namibie" },
  { code: "+27", country: "Afrique du Sud" },
  { code: "+266", country: "Lesotho" },
  { code: "+268", country: "Eswatini" },
  { code: "+261", country: "Madagascar" },
  { code: "+230", country: "Maurice" },
  { code: "+248", country: "Seychelles" },
  { code: "+269", country: "Comores" },
  { code: "+262", country: "Mayotte / Reunion" },
  { code: "+234", country: "Nigeria" },
  { code: "+233", country: "Ghana" },
  { code: "+225", country: "Cote d'Ivoire" },
  { code: "+221", country: "Senegal" },
  { code: "+223", country: "Mali" },
  { code: "+226", country: "Burkina Faso" },
  { code: "+227", country: "Niger" },
  { code: "+224", country: "Guinee" },
  { code: "+245", country: "Guinee-Bissau" },
  { code: "+240", country: "Guinee equatoriale" },
  { code: "+220", country: "Gambie" },
  { code: "+232", country: "Sierra Leone" },
  { code: "+231", country: "Liberia" },
  { code: "+228", country: "Togo" },
  { code: "+229", country: "Benin" },
  { code: "+237", country: "Cameroun" },
  { code: "+235", country: "Tchad" },
  { code: "+236", country: "Centrafrique" },
  { code: "+241", country: "Gabon" },
  { code: "+239", country: "Sao Tome-et-Principe" },
  { code: "+238", country: "Cap-Vert" },
  { code: "+222", country: "Mauritanie" },
  { code: "+290", country: "Sainte-Helene" },
];

const COUNTRY_CODES = COUNTRY_CODES_BASE
  .map((item) => ({ ...item, key: `${item.country}-${item.code}` }))
  .sort((a, b) => a.country.localeCompare(b.country, "fr"));

const FLAGS_BY_COUNTRY: Record<string, string> = {
  "Afrique du Sud": "🇿🇦",
  Albanie: "🇦🇱",
  Algerie: "🇩🇿",
  Allemagne: "🇩🇪",
  Andorre: "🇦🇩",
  Angola: "🇦🇴",
  Autriche: "🇦🇹",
  Belgique: "🇧🇪",
  Benin: "🇧🇯",
  Bielorussie: "🇧🇾",
  "Bosnie-Herzegovine": "🇧🇦",
  Botswana: "🇧🇼",
  Bulgarie: "🇧🇬",
  "Burkina Faso": "🇧🇫",
  Burundi: "🇧🇮",
  Cameroun: "🇨🇲",
  Canada: "🇨🇦",
  "Cap-Vert": "🇨🇻",
  Centrafrique: "🇨🇫",
  Chypre: "🇨🇾",
  Comores: "🇰🇲",
  Congo: "🇨🇬",
  "Cote d'Ivoire": "🇨🇮",
  Croatie: "🇭🇷",
  Danemark: "🇩🇰",
  Djibouti: "🇩🇯",
  Egypte: "🇪🇬",
  Erythree: "🇪🇷",
  Espagne: "🇪🇸",
  Estonie: "🇪🇪",
  "Etats-Unis": "🇺🇸",
  Eswatini: "🇸🇿",
  Ethiopie: "🇪🇹",
  Finlande: "🇫🇮",
  France: "🇫🇷",
  Gabon: "🇬🇦",
  Gambie: "🇬🇲",
  Ghana: "🇬🇭",
  Gibraltar: "🇬🇮",
  Grece: "🇬🇷",
  Guinee: "🇬🇳",
  "Guinee equatoriale": "🇬🇶",
  "Guinee-Bissau": "🇬🇼",
  Hongrie: "🇭🇺",
  Irlande: "🇮🇪",
  Islande: "🇮🇸",
  Italie: "🇮🇹",
  Kenya: "🇰🇪",
  Kosovo: "🇽🇰",
  Lesotho: "🇱🇸",
  Lettonie: "🇱🇻",
  Liberia: "🇱🇷",
  Libye: "🇱🇾",
  Lituanie: "🇱🇹",
  Luxembourg: "🇱🇺",
  Madagascar: "🇲🇬",
  Malawi: "🇲🇼",
  Mali: "🇲🇱",
  Malte: "🇲🇹",
  Maroc: "🇲🇦",
  Maurice: "🇲🇺",
  Mauritanie: "🇲🇷",
  "Mayotte / Reunion": "🇾🇹",
  "Macédoine du Nord": "🇲🇰",
  Moldavie: "🇲🇩",
  Monaco: "🇲🇨",
  Montenegro: "🇲🇪",
  Mozambique: "🇲🇿",
  Namibie: "🇳🇦",
  Niger: "🇳🇪",
  Nigeria: "🇳🇬",
  Norvege: "🇳🇴",
  Ouganda: "🇺🇬",
  "Pays-Bas": "🇳🇱",
  Pologne: "🇵🇱",
  Portugal: "🇵🇹",
  RDC: "🇨🇩",
  Roumanie: "🇷🇴",
  "Royaume-Uni": "🇬🇧",
  Russie: "🇷🇺",
  Rwanda: "🇷🇼",
  "Saint-Marin": "🇸🇲",
  "Sainte-Helene": "🇸🇭",
  "Sao Tome-et-Principe": "🇸🇹",
  Senegal: "🇸🇳",
  Serbie: "🇷🇸",
  Seychelles: "🇸🇨",
  "Sierra Leone": "🇸🇱",
  Slovaquie: "🇸🇰",
  Slovenie: "🇸🇮",
  Somalie: "🇸🇴",
  Soudan: "🇸🇩",
  "Soudan du Sud": "🇸🇸",
  Suede: "🇸🇪",
  Suisse: "🇨🇭",
  Tanzanie: "🇹🇿",
  Tchad: "🇹🇩",
  Tchequie: "🇨🇿",
  Togo: "🇹🇬",
  Tunisie: "🇹🇳",
  Turquie: "🇹🇷",
  Ukraine: "🇺🇦",
  Vatican: "🇻🇦",
  Zambie: "🇿🇲",
  Zimbabwe: "🇿🇼",
};

const OTHER_BEVERAGE_VALUE = "__other_beverage__";
const beverageSelectOptions = [
  ...beverageOptions.beers.map((drink) => ({ value: drink, label: drink, group: "Bières" })),
  ...beverageOptions.softDrinks.map((drink) => ({ value: drink, label: drink, group: "Boissons sucrées" })),
  { value: OTHER_BEVERAGE_VALUE, label: "Autre boisson", detail: "Préciser votre choix", group: "Autre" },
];

function getBeverageSelectValue(value?: string | null) {
  if (!value) return "";
  return beverageSelectOptions.some((option) => option.value === value) ? value : OTHER_BEVERAGE_VALUE;
}

function getOtherBeverageValue(value?: string | null) {
  if (!value || getBeverageSelectValue(value) !== OTHER_BEVERAGE_VALUE) return "";
  return value.startsWith("Autre: ") ? value.slice(7) : value;
}

const getFlag = (country: string) => FLAGS_BY_COUNTRY[country] || "🏳";

function splitPhone(value?: string | null) {
  const raw = (value || "").trim();
  const match = [...COUNTRY_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((item) => raw.startsWith(item.code));
  return {
    code: match?.code || "+243",
    key: match?.key || "RDC-+243",
    local: match ? raw.slice(match.code.length).trim() : raw.replace(/^\+/, ""),
  };
}

function formatPhone(code: string, local: string) {
  const cleanedLocal = local.replace(/[^\d\s().-]/g, "").trim();
  return cleanedLocal ? `${code} ${cleanedLocal}` : "";
}

export default function RsvpForm({
  variant = "section",
  submitEndpoint = "/api/rsvp",
  initialValues,
  title = "Confirmez votre présence",
  description = "Remplissez ce formulaire pour nous dire si vous serez des nôtres.",
  submitLabel = "Envoyer ma réponse",
  successTitle = "Votre réponse est enregistrée",
  successDescription = "Merci, votre réponse a bien été prise en compte.",
  onSubmitted,
}: RsvpFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [selectedCountryKey, setSelectedCountryKey] = useState(splitPhone(initialValues?.phone).key);
  const countrySelectorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: capacity } = useQuery<{ civil: number; civilMax: number; evening: number; eveningMax: number }>({
    queryKey: ["/api/capacity"],
    staleTime: 30_000,
  });
  const civilFull = capacity ? capacity.civil >= capacity.civilMax : false;
  const eveningFull = capacity ? capacity.evening >= capacity.eveningMax : false;

  const form = useForm<RsvpFormInput>({
    resolver: zodResolver(insertRsvpSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });
  const status = form.watch("status");
  const isAttending = status === "confirmed";

  useEffect(() => {
    form.reset({ ...defaultValues, ...initialValues });
    setSelectedCountryKey(splitPhone(initialValues?.phone).key);
    setCountryQuery("");
  }, [form, initialValues]);

  useEffect(() => {
    if (!isAttending) {
      form.setValue("guestCount", 1);
    }
  }, [form, isAttending]);

  const mutation = useMutation({
    mutationFn: async (data: RsvpFormInput) => {
      const response = await apiRequest(
        submitEndpoint === "/api/rsvp" ? "POST" : "PATCH",
        submitEndpoint,
        data,
      );
      return (await response.json()) as RsvpResponse;
    },
    onSuccess: (guest) => {
      setSubmitted(true);
      onSubmitted?.(guest);
      toast({ title: "RSVP enregistré", description: successDescription });
    },
    onError: (error: Error) => {
      toast({
        title: "Impossible d'envoyer le RSVP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cardClassName =
    variant === "page"
      ? "border border-[#dedede] bg-white p-6 text-[#111111] editorial-shadow md:p-10"
      : variant === "invitation"
        ? "border border-[#dedede] bg-white p-6 text-[#111111] editorial-shadow md:p-10"
        : "border border-[#dedede] bg-white p-6 text-[#111111] editorial-shadow md:p-10";
  const labelClassName = "text-[10px] uppercase tracking-[0.26em] text-[#111111]/70";
  const inputClassName = "h-12 rounded-none border-[#d7d7d7] bg-white text-[#111111] placeholder:text-[#777777] focus-visible:ring-[#111111]/20";
  const choiceClassName = "group border p-4 text-left text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg";
  const selectedChoiceClassName = "border-[#111111] bg-[#111111] text-white shadow-lg";
  const unselectedChoiceClassName = "border-[#d7d7d7] bg-white text-[#111111] hover:border-[#111111]/50";
  const selectedCountry = COUNTRY_CODES.find((item) => item.key === selectedCountryKey) || COUNTRY_CODES.find((item) => item.key === "RDC-+243") || COUNTRY_CODES[0];
  const countrySearch = countryQuery.trim().toLowerCase();
  const filteredCountryCodes = COUNTRY_CODES.filter((item) => {
    if (!countrySearch) return true;
    return `${item.country} ${item.code}`.toLowerCase().includes(countrySearch);
  }).slice(0, 12);

  if (submitted) {
    return (
      <div className={`${cardClassName} text-center`}>
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
          <CheckCircle2 className="h-10 w-10 text-primary" strokeWidth={1.6} />
        </div>
        <p className="text-[11px] uppercase tracking-[0.45em] text-primary/60">Merci</p>
        <h3 className="mt-4 text-3xl font-serif text-[#111111] md:text-4xl">{successTitle}</h3>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#111111]/70">{successDescription}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-8 rounded-none border-primary/20 px-8 py-6 uppercase tracking-[0.35em] text-[10px] text-primary"
          onClick={() => { form.reset({ ...defaultValues, ...initialValues }); setSubmitted(false); }}
        >
          Modifier ma réponse
        </Button>
      </div>
    );
  }

  return (
    <div className={cardClassName}>
      <div className="mb-10 space-y-4">
        <p className="text-[11px] uppercase tracking-[0.45em] text-primary/60">RSVP</p>
        <h3 className="text-3xl font-serif text-[#111111] md:text-4xl">{title}</h3>
        <p className="max-w-2xl text-sm leading-7 text-[#111111]/70">{description}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-7">

          {/* Nom & Prénom */}
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={labelClassName}>👤 Prénom</FormLabel>
                  <FormControl>
                    <Input {...field} className={inputClassName} placeholder="Votre prénom" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={labelClassName}>🪪 Nom</FormLabel>
                  <FormControl>
                    <Input {...field} className={inputClassName} placeholder="Votre nom" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Téléphone */}
          <div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={labelClassName}>📞 Téléphone</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-[minmax(96px,0.45fr)_1fr] gap-2 md:grid-cols-[minmax(180px,0.75fr)_1fr] md:gap-3">
                      <div
                        ref={countrySelectorRef}
                        className="relative"
                        onBlur={(event) => {
                          if (!countrySelectorRef.current?.contains(event.relatedTarget as Node | null)) {
                            setCountryOpen(false);
                          }
                        }}
                      >
                        <button
                          type="button"
                          aria-label="Choisir le pays"
                          aria-expanded={countryOpen}
                          onClick={() => {
                            setCountryOpen((open) => !open);
                            setCountryQuery("");
                          }}
                          className="flex h-12 w-full items-center justify-between gap-1 border border-[#d7d7d7] bg-white px-2 text-left text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/20 md:px-3 md:text-sm"
                        >
                          <span className="min-w-0 truncate">
                            <span className="md:hidden">{getFlag(selectedCountry.country)} {selectedCountry.code}</span>
                            <span className="hidden md:inline">{getFlag(selectedCountry.country)} {selectedCountry.country} ({selectedCountry.code})</span>
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 text-[#111111]/60" strokeWidth={1.6} />
                        </button>

                        {countryOpen && (
                          <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[min(82vw,320px)] border border-[#d7d7d7] bg-white shadow-xl">
                            <Input
                              autoFocus
                              value={countryQuery}
                              onChange={(event) => setCountryQuery(event.target.value)}
                              className="h-11 rounded-none border-0 border-b border-[#e4e4e4] bg-white text-sm text-[#111111] placeholder:text-[#777777] focus-visible:ring-0"
                              placeholder="Rechercher pays ou indicatif"
                            />
                            <div className="max-h-64 overflow-y-auto py-1">
                              {filteredCountryCodes.map((item) => (
                                <button
                                  key={item.key}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setSelectedCountryKey(item.key);
                                    field.onChange(formatPhone(item.code, splitPhone(field.value).local));
                                    setCountryOpen(false);
                                    setCountryQuery("");
                                  }}
                                  className={`flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm transition-colors hover:bg-[#f3f3f3] ${item.key === selectedCountryKey ? "bg-[#6f5427] text-white hover:bg-[#6f5427]" : "text-[#111111]"}`}
                                >
                                  <span className="truncate">{getFlag(item.country)} {item.country}</span>
                                  <span className="shrink-0 font-medium">{item.code}</span>
                                </button>
                              ))}
                              {filteredCountryCodes.length === 0 && (
                                <p className="px-3 py-3 text-sm text-[#777777]">Aucun pays trouvé</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Input
                        value={splitPhone(field.value).local}
                        onChange={(event) => field.onChange(formatPhone(selectedCountry.code, event.target.value))}
                        className={inputClassName}
                        placeholder="Numéro"
                        inputMode="tel"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Présence & Nombre */}
          <div className="grid gap-5">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={labelClassName}>💌 Votre réponse</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        aria-pressed={field.value === "confirmed"}
                        onClick={() => field.onChange("confirmed")}
                        className={`${choiceClassName} min-h-14 px-3 text-xs sm:text-sm ${field.value === "confirmed" ? selectedChoiceClassName : unselectedChoiceClassName}`}
                      >
                        <span className="mr-2 text-base">🥂</span> Je serai là
                      </button>
                      <button
                        type="button"
                        aria-pressed={field.value === "declined"}
                        onClick={() => field.onChange("declined")}
                        className={`${choiceClassName} min-h-14 px-3 text-xs sm:text-sm ${field.value === "declined" ? selectedChoiceClassName : unselectedChoiceClassName}`}
                      >
                        <span className="mr-2 text-base">🤍</span> Je serai absent(e)
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAttending && (
              <>
                <FormField
                  control={form.control}
                  name="ceremonyChoice"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className={labelClassName}>📅 Je participe à</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <button
                            type="button"
                            aria-pressed={field.value === "civil"}
                            onClick={() => !civilFull && field.onChange("civil")}
                            disabled={civilFull}
                            className={`${choiceClassName} min-h-14 px-3 text-xs sm:text-sm ${civilFull ? "opacity-40 cursor-not-allowed" : field.value === "civil" ? selectedChoiceClassName : unselectedChoiceClassName}`}
                          >
                            <span className="block font-medium">🌿 Civil & bénédiction</span>
                            {civilFull
                              ? <span className="block text-[10px] mt-0.5 text-rose-500 font-medium">Complet</span>
                              : <span className="block text-[10px] mt-0.5 opacity-70">27 août · à l'anglaise</span>
                            }
                          </button>
                          <button
                            type="button"
                            aria-pressed={field.value === "evening"}
                            onClick={() => !eveningFull && field.onChange("evening")}
                            disabled={eveningFull}
                            className={`${choiceClassName} min-h-14 px-3 text-xs sm:text-sm ${eveningFull ? "opacity-40 cursor-not-allowed" : field.value === "evening" ? selectedChoiceClassName : unselectedChoiceClassName}`}
                          >
                            <span className="block font-medium">🖤 Soirée dansante</span>
                            {eveningFull
                              ? <span className="block text-[10px] mt-0.5 text-rose-500 font-medium">Complet</span>
                              : <span className="block text-[10px] mt-0.5 opacity-70">29 août · thème noir</span>
                            }
                          </button>
                          <button
                            type="button"
                            aria-pressed={field.value === "both"}
                            onClick={() => !(civilFull || eveningFull) && field.onChange("both")}
                            disabled={civilFull || eveningFull}
                            className={`${choiceClassName} min-h-14 px-3 text-xs sm:text-sm ${(civilFull || eveningFull) ? "opacity-40 cursor-not-allowed" : field.value === "both" ? selectedChoiceClassName : unselectedChoiceClassName}`}
                          >
                            <span className="block font-medium">✨ Les deux</span>
                            {(civilFull || eveningFull)
                              ? <span className="block text-[10px] mt-0.5 text-rose-500 font-medium">Complet</span>
                              : <span className="block text-[10px] mt-0.5 opacity-70">27 août & 29 août</span>
                            }
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guestCount"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className={labelClassName}>👥 Je viens</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            aria-pressed={field.value === 1}
                            onClick={() => field.onChange(1)}
                            className={`${choiceClassName} min-h-14 px-3 text-xs sm:text-sm ${field.value === 1 ? selectedChoiceClassName : unselectedChoiceClassName}`}
                          >
                            <span className="mr-2 text-base">🙋</span> Seul(e)
                          </button>
                          <button
                            type="button"
                            aria-pressed={field.value === 2}
                            onClick={() => field.onChange(2)}
                            className={`${choiceClassName} min-h-14 px-3 text-xs sm:text-sm ${field.value === 2 ? selectedChoiceClassName : unselectedChoiceClassName}`}
                          >
                            <span className="mr-2 text-base">💑</span> En couple
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beverageChoice"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className={labelClassName}>🍹 Boisson souhaitée</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <PrettySelect
                            value={getBeverageSelectValue(field.value)}
                            onChange={(value) => {
                              field.onChange(value === OTHER_BEVERAGE_VALUE ? "Autre: " : value);
                            }}
                            options={beverageSelectOptions}
                            placeholder="Choisir une boisson"
                            buttonClassName="border-[#d7d7d7] text-[#111111] focus:ring-[#111111]/20"
                          />
                          {getBeverageSelectValue(field.value) === OTHER_BEVERAGE_VALUE && (
                            <Input
                              value={getOtherBeverageValue(field.value)}
                              onChange={(event) => field.onChange(event.target.value ? `Autre: ${event.target.value}` : "Autre: ")}
                              className={inputClassName}
                              placeholder="Précisez la boisson souhaitée"
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          {/* Message */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className={labelClassName}>✍️ Un mot pour les mariés</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    className="min-h-[110px] rounded-none border-[#d7d7d7] bg-white text-[#111111] placeholder:text-[#777777] focus-visible:ring-[#111111]/20"
                    placeholder="Une pensée, un mot doux, un message..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-none bg-[#111111] py-7 uppercase tracking-[0.32em] text-[10px] text-white transition-all hover:-translate-y-0.5 hover:bg-[#263629] hover:shadow-xl"
          >
            {mutation.isPending ? "Envoi en cours..." : submitLabel}
          </Button>
        </form>
      </Form>
    </div>
  );
}
