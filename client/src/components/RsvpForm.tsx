import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { insertRsvpSchema, type RsvpFormInput, type RsvpResponse } from "@shared/schema";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  status: "confirmed",
  guestCount: 1,
  mealChoice: "",
  message: "",
};

const MEAL_OPTIONS = [
  { value: "classique", label: "Classique" },
  { value: "vegetarien", label: "Végétarien" },
  { value: "halal", label: "Halal" },
];

export default function RsvpForm({
  variant = "section",
  submitEndpoint = "/api/rsvp",
  initialValues,
  title = "Confirmez votre présence",
  description = "Remplissez ce formulaire pour nous dire si vous serez des nôtres.",
  submitLabel = "Envoyer mon RSVP",
  successTitle = "Votre réponse est enregistrée",
  successDescription = "Merci, votre réponse a bien été prise en compte.",
  onSubmitted,
}: RsvpFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<RsvpFormInput>({
    resolver: zodResolver(insertRsvpSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });

  useEffect(() => {
    form.reset({ ...defaultValues, ...initialValues });
  }, [form, initialValues]);

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
      ? "border border-border bg-background p-8 md:p-12 editorial-shadow"
      : variant === "invitation"
        ? "border border-border bg-background p-8 md:p-10 editorial-shadow"
        : "border border-border bg-background/90 p-8 md:p-12 backdrop-blur-sm editorial-shadow";

  if (submitted) {
    return (
      <div className={`${cardClassName} text-center`}>
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
          <CheckCircle2 className="h-10 w-10 text-primary" strokeWidth={1.6} />
        </div>
        <p className="text-[11px] uppercase tracking-[0.45em] text-primary/60">Merci</p>
        <h3 className="mt-4 text-3xl font-serif text-foreground md:text-4xl">{successTitle}</h3>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-foreground/70">{successDescription}</p>
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
        <h3 className="text-3xl font-serif text-foreground md:text-4xl">{title}</h3>
        <p className="max-w-2xl text-sm leading-7 text-foreground/70">{description}</p>
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
                  <FormLabel className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">Prénom</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20" placeholder="Votre prénom" />
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
                  <FormLabel className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">Nom</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20" placeholder="Votre nom" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email & Téléphone */}
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" value={field.value || ""} className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20" placeholder="vous@email.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">Téléphone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20" placeholder="+243 ..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Présence & Nombre */}
          <div className="grid gap-5 md:grid-cols-[1.3fr_0.7fr]">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">Votre réponse</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid gap-3 md:grid-cols-2">
                      <FormItem className="flex items-center gap-3 border border-primary/10 p-4">
                        <FormControl>
                          <RadioGroupItem value="confirmed" className="border-primary/30 text-primary" />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm font-medium text-foreground">Je serai présent(e)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-3 border border-primary/10 p-4">
                        <FormControl>
                          <RadioGroupItem value="declined" className="border-primary/30 text-primary" />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm font-medium text-foreground">Je ne pourrai pas venir</FormLabel>
                      </FormItem>
                    </RadioGroup>
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
                  <FormLabel className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">Nombre de places</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={10}
                      value={field.value ?? 1}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value || "1", 10))}
                      className="h-12 rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Choix repas */}
          <FormField
            control={form.control}
            name="mealChoice"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">Préférence alimentaire</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value || ""} className="flex flex-wrap gap-3">
                    {MEAL_OPTIONS.map((opt) => (
                      <FormItem key={opt.value} className="flex items-center gap-3 border border-primary/10 px-5 py-3">
                        <FormControl>
                          <RadioGroupItem value={opt.value} className="border-primary/30 text-primary" />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm font-medium text-foreground">{opt.label}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Message */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">Un mot pour les mariés</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    className="min-h-[120px] rounded-none border-primary/15 bg-transparent focus-visible:ring-primary/20"
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
            className="w-full rounded-none bg-primary py-7 uppercase tracking-[0.4em] text-[10px] text-primary-foreground hover:bg-foreground"
          >
            {mutation.isPending ? "Envoi en cours..." : submitLabel}
          </Button>
        </form>
      </Form>
    </div>
  );
}
