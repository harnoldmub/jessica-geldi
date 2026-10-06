import type { Express, NextFunction, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminGuestSchema, insertRsvpSchema, publicRsvpSchema, updateGuestSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { sendRsvpConfirmationEmail } from "./email";
import { ensureAdminUser, setupAuth } from "./auth";
import { getEventKeys, getGuestEvent, isWeddingEventKey, weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";
import { siteSettingsSchema } from "@shared/siteSettings";
import { ensureApplicationSchema } from "./migrations";
import { ensureStoredSiteSettings, getStoredSiteSettings, saveStoredSiteSettings } from "./siteSettings";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createHash, timingSafeEqual } from "crypto";

declare module "express-session" {
  interface SessionData {
    siteAccessKey?: string;
  }
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const rateLimitBuckets = new Map<string, number[]>();

// Express 4 ne transmet pas les erreurs des handlers async au middleware
// d'erreur : ce wrapper s'en charge.
function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentification requise" });
  }

  return next();
}

function escapeCsvValue(value: unknown) {
  const rawValue = value == null ? "" : String(value);
  const stringValue = /^[=+\-@]/.test(rawValue) ? `'${rawValue}` : rawValue;
  return `"${stringValue.replaceAll(`"`, `""`)}"`;
}

function isLocalUrl(url?: string | null) {
  return !url || /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url);
}

function buildInvitationLink(req: Request, token: string) {
  const envUrl = process.env.APP_URL?.trim();
  // Origine réelle de la requête (https en prod grâce à "trust proxy").
  const requestUrl = `${req.protocol}://${req.get("host")}`;
  // On privilégie une APP_URL publique explicite ; sinon on retombe sur
  // l'origine de la requête (évite que les liens pointent vers localhost).
  const baseUrl = !isLocalUrl(envUrl) ? (envUrl as string) : requestUrl;
  return `${baseUrl.replace(/\/$/, "")}/invitation/${token}`;
}

function getInvitationStatus(guest: { invitationSentAt: Date | null }) {
  return guest.invitationSentAt ? "sent" : "draft";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const attempts = rateLimitBuckets.get(key) || [];
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recentAttempts.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitBuckets.set(key, recentAttempts);
    return true;
  }

  recentAttempts.push(now);
  rateLimitBuckets.set(key, recentAttempts);
  return false;
}

function rsvpRateLimitKey(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : req.ip || "unknown-ip";

  return `${ip}:${req.path}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureApplicationSchema();
  await ensureStoredSiteSettings();
  setupAuth(app);
  await ensureAdminUser();
  
  // Public capacity endpoint
  async function getCapacity(excludeGuestId?: number) {
    const all = await storage.getAllRsvps();
    const confirmed = all.filter(
      (g) => g.status === "confirmed" && g.id !== excludeGuestId,
    );
    const counts = (Object.keys(weddingEvents) as WeddingEventKey[]).reduce(
      (acc, key) => {
        acc[key] = confirmed
          .filter((g) => getEventKeys(g.ceremonyChoice).includes(key))
          .reduce((sum, g) => sum + (g.guestCount || 1), 0);
        acc[`${key}Max`] = weddingEvents[key].capacity;
        return acc;
      },
      {} as Record<string, number>,
    );
    return counts;
  }

  async function checkCapacity(
    data: { status?: string | null; ceremonyChoice?: string | null; guestCount?: number | null },
    excludeGuestId?: number,
  ): Promise<string | null> {
    if (data.status !== "confirmed") return null;
    const cap = await getCapacity(excludeGuestId);
    const count = data.guestCount || 1;
    for (const key of getEventKeys(data.ceremonyChoice)) {
      if ((cap[key] || 0) + count > weddingEvents[key].capacity) {
        return `${weddingEvents[key].label} est malheureusement complet.`;
      }
    }
    return null;
  }

  // Code d'accès de la page d'accueil (aiguillage vers les 3 événements), surchargeable par SITE_ACCESS_CODE.
  const SITE_ACCESS_CODE = process.env.SITE_ACCESS_CODE || "LoveJG2026";
  const siteAccessKey = createHash("sha256").update(SITE_ACCESS_CODE).digest("hex");

  app.get("/api/site-access", (req, res) => {
    return res.json({ granted: req.session.siteAccessKey === siteAccessKey });
  });

  app.post("/api/site-access", (req, res) => {
    if (isRateLimited(`${rsvpRateLimitKey(req)}:access`)) {
      return res.status(429).json({ message: "Trop de tentatives. Merci de réessayer dans un instant." });
    }
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    const candidate = Buffer.from(createHash("sha256").update(code).digest("hex"));
    const expected = Buffer.from(siteAccessKey);
    if (!timingSafeEqual(candidate, expected)) {
      return res.status(401).json({ message: "Code d'accès incorrect." });
    }
    req.session.siteAccessKey = siteAccessKey;
    return res.json({ ok: true });
  });

  app.get("/api/capacity", asyncRoute(async (_req, res) => {
    res.json(await getCapacity());
  }));

  // Public RSVP Submission
  app.post("/api/rsvp", async (req, res) => {
    try {
      if (isRateLimited(rsvpRateLimitKey(req))) {
        return res.status(429).json({ message: "Trop de tentatives RSVP. Merci de réessayer dans un instant." });
      }

      const data = publicRsvpSchema.parse(req.body);

      if (data.guestCount > 2) {
        return res.status(400).json({ message: "Une nouvelle réponse publique est limitée à 2 personnes." });
      }

      const capacityError = await checkCapacity(data);
      if (capacityError) {
        return res.status(409).json({ message: capacityError });
      }

      // Chaque événement a ses propres invités : une réponse couvrant plusieurs
      // célébrations crée une invitation (et un lien) par célébration.
      // Sans célébration explicite, getEventKeys renverrait les trois : on exige un choix.
      const events = data.ceremonyChoice ? getEventKeys(data.ceremonyChoice) : [];
      if (!events.length) {
        return res.status(400).json({ message: "Veuillez choisir au moins une célébration." });
      }
      const created = [];
      for (const event of events) {
        created.push(await storage.createRsvp({
          ...data,
          token: nanoid(10),
          ceremonyChoice: event,
          invitedCount: data.guestCount,
          invitedCeremonyChoice: event,
          respondedAt: data.status === "pending" ? null : new Date(),
          status: data.status || 'confirmed',
        }));
      }
      const rsvp = created[0];

      // Send confirmation email asynchronously
      if (rsvp.email) {
        sendRsvpConfirmationEmail(rsvp).catch(err => {
            console.error("Failed to send confirmation email:", err);
        });
      }

      res.status(201).json(rsvp);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Échec de l'enregistrement du RSVP" });
    }
  });

  // Fetch Guest by Token
  app.get("/api/invitation/:token", asyncRoute(async (req, res) => {
    const guest = await storage.getRsvpByToken(req.params.token);
    if (!guest) {
      return res.status(404).json({ message: "Invitation introuvable" });
    }
    const { notes: _notes, ...publicGuest } = guest;
    res.json({
      ...publicGuest,
      invitationUrl: buildInvitationLink(req, guest.token),
      invitationStatus: getInvitationStatus(guest),
    });
  }));

  app.patch("/api/invitation/:token/rsvp", async (req, res) => {
    try {
      if (isRateLimited(`${rsvpRateLimitKey(req)}:${req.params.token}`)) {
        return res.status(429).json({ message: "Trop de tentatives RSVP. Merci de réessayer dans un instant." });
      }

      const guest = await storage.getRsvpByToken(req.params.token);

      if (!guest) {
        return res.status(404).json({ message: "Invitation introuvable" });
      }

      const data = insertRsvpSchema.parse(req.body);

      if (data.guestCount > guest.invitedCount) {
        return res.status(400).json({ message: `Votre invitation prévoit ${guest.invitedCount} place(s).` });
      }
      const invitedEvents = getEventKeys(guest.invitedCeremonyChoice || guest.ceremonyChoice);
      const selectedEvents = getEventKeys(data.ceremonyChoice);
      if (data.status === "confirmed" && selectedEvents.some((key) => !invitedEvents.includes(key))) {
        return res.status(400).json({ message: "Cette célébration ne fait pas partie de votre invitation." });
      }

      const capacityError = await checkCapacity(data, guest.id);
      if (capacityError) {
        return res.status(409).json({ message: capacityError });
      }

      const updatedGuest = await storage.updateGuest(guest.id, {
        ...data,
        respondedAt: new Date(),
        checkedInAt: data.status === "confirmed" ? guest.checkedInAt : null,
        ceremonyChoice: data.ceremonyChoice === null ? undefined : data.ceremonyChoice,
      }, guest.revision);

      if (updatedGuest.email) {
        sendRsvpConfirmationEmail(updatedGuest).catch((err) => {
          console.error("Failed to send confirmation email:", err);
        });
      }

      return res.json(updatedGuest);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Impossible de mettre à jour le RSVP" });
    }
  });

  // RSVP simplifié : confirmer / décliner sa présence (modifiable à tout moment)
  app.patch("/api/invitation/:token/status", async (req, res) => {
    try {
      if (isRateLimited(`${rsvpRateLimitKey(req)}:${req.params.token}:status`)) {
        return res.status(429).json({ message: "Trop de tentatives. Merci de réessayer dans un instant." });
      }

      const guest = await storage.getRsvpByToken(req.params.token);
      if (!guest) {
        return res.status(404).json({ message: "Invitation introuvable" });
      }

      const status = (req.body?.status ?? "") as string;
      if (status !== "confirmed" && status !== "declined" && status !== "pending") {
        return res.status(400).json({ message: "Statut invalide" });
      }

      const capacityError = await checkCapacity(
        { status, ceremonyChoice: guest.ceremonyChoice, guestCount: guest.guestCount },
        guest.id,
      );
      if (capacityError) {
        return res.status(409).json({ message: capacityError });
      }

      const updatedGuest = await storage.updateGuest(guest.id, {
        status,
        respondedAt: status === "pending" ? null : new Date(),
        checkedInAt: status === "confirmed" ? guest.checkedInAt : null,
      }, guest.revision);

      if (status === "confirmed" && updatedGuest.email) {
        sendRsvpConfirmationEmail(updatedGuest).catch((err) => {
          console.error("Failed to send confirmation email:", err);
        });
      }

      return res.json(updatedGuest);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Impossible de mettre à jour la présence" });
    }
  });

  // Admin: Guest List
  app.get("/api/admin/guests", requireAuth, asyncRoute(async (req, res) => {
    const guests = await storage.getAllRsvps();
    res.json(
      guests.map((guest) => ({
        ...guest,
        invitationUrl: buildInvitationLink(req, guest.token),
        invitationStatus: getInvitationStatus(guest),
      })),
    );
  }));

  app.get("/api/admin/guests/export", requireAuth, asyncRoute(async (req, res) => {
    // Export UNIQUEMENT par événement — pas d'export général.
    const event = String(req.query.event || "") as WeddingEventKey;
    if (!event || !(event in weddingEvents)) {
      return res.status(400).json({ message: "Veuillez choisir une célébration à exporter." });
    }
    const allGuests = await storage.getAllRsvps();
    const guests = allGuests.filter((g) => getGuestEvent(g) === event);
    const sort = String(req.query.sort || "");
    const sortedGuests = [...guests].sort((a, b) => {
      if (sort === "table") {
        return (a.tableNumber ?? 9999) - (b.tableNumber ?? 9999)
          || a.lastName.localeCompare(b.lastName, "fr")
          || a.firstName.localeCompare(b.firstName, "fr");
      }
      if (sort === "name") {
        return a.lastName.localeCompare(b.lastName, "fr")
          || a.firstName.localeCompare(b.firstName, "fr");
      }
      return a.id - b.id;
    });

    const header = [
      "tableNumber",
      "firstName",
      "lastName",
      "email",
      "phone",
      "status",
      "guestCount",
      "invitedCount",
      "ceremonyChoice",
      "invitedCeremonyChoice",
      "party",
      "country",
      "city",
      "mealChoice",
      "beverageChoice",
      "allergies",
      "message",
      "notes",
      "checkedInAt",
      "respondedAt",
      "createdAt",
    ];

    const rows = sortedGuests.map((guest) =>
      [
        guest.tableNumber,
        guest.firstName,
        guest.lastName,
        guest.email,
        guest.phone,
        guest.status,
        guest.guestCount,
        guest.invitedCount,
        guest.ceremonyChoice,
        guest.invitedCeremonyChoice,
        guest.party,
        guest.country,
        guest.city,
        guest.mealChoice,
        guest.beverageChoice,
        guest.allergies,
        guest.message,
        guest.notes,
        guest.checkedInAt?.toISOString(),
        guest.respondedAt?.toISOString(),
        guest.createdAt?.toISOString(),
      ]
        .map(escapeCsvValue)
        .join(","),
    );

    res
      .status(200)
      .set({
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jessica-geldi-${event}${sort ? `-${sort}` : ""}.csv"`,
      })
      .send([header.join(","), ...rows].join("\n"));
  }));

  // Admin: CSV/structured bulk import with duplicate protection.
  app.post("/api/admin/guests/import", requireAuth, async (req, res) => {
    try {
      const payload = req.body as {
        guests?: unknown[];
        guestCount?: number;
        ceremonyChoice?: string;
        party?: "jessica" | "geldi" | "commun";
      } | unknown[];
      const names = Array.isArray(payload) ? payload : payload.guests;

      if (!Array.isArray(names) || names.length === 0) {
        return res.status(400).json({ message: "Aucun invité à importer" });
      }
      if (names.length > 500) {
        return res.status(400).json({ message: "L’import est limité à 500 invitations." });
      }

      const event = Array.isArray(payload) ? undefined : payload.ceremonyChoice;
      const party = Array.isArray(payload) ? undefined : payload.party;
      if (party !== "jessica" && party !== "geldi") {
        return res.status(400).json({ message: "Choisissez la liste (Jessica ou Geldi) de ces invités." });
      }
      if (!isWeddingEventKey(event)) {
        return res.status(400).json({ message: "Choisissez l'événement auquel rattacher ces invités." });
      }
      // Les doublons s'apprécient par événement : un même invité peut figurer sur plusieurs listes.
      const dedupeKey = (g: { firstName: string; lastName: string; email?: string | null; phone?: string | null }) =>
        `${event}|${g.firstName}|${g.lastName}|${g.email || g.phone || ""}`.toLocaleLowerCase("fr");
      const existing = await storage.getAllRsvps();
      const duplicateKeys = new Set(existing.filter((guest) => getGuestEvent(guest) === event).map(dedupeKey));
      const created = [];
      let skipped = 0;
      for (const rawGuest of names) {
        const defaults = Array.isArray(payload) ? {} : {
          guestCount: payload.guestCount ?? 1,
          invitedCount: payload.guestCount ?? 1,
          ceremonyChoice: payload.ceremonyChoice ?? "civil",
          invitedCeremonyChoice: payload.ceremonyChoice ?? "civil",
          party: payload.party ?? "commun",
        };
        const parsed = adminGuestSchema.parse({ ...defaults, ...(rawGuest as object), ceremonyChoice: event, invitedCeremonyChoice: event });
        const key = dedupeKey(parsed);
        if (duplicateKeys.has(key)) {
          skipped += 1;
          continue;
        }
        const guest = await storage.createRsvp({
          ...parsed,
          token: nanoid(10),
        });
        duplicateKeys.add(key);
        created.push({
          ...guest,
          invitationUrl: buildInvitationLink(req, guest.token),
          invitationStatus: getInvitationStatus(guest),
        });
      }

      return res.status(201).json({ added: created.length, skipped, guests: created });
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Erreur lors de l'import" });
    }
  });

  app.post("/api/admin/guests", requireAuth, async (req, res) => {
    try {
      const data = adminGuestSchema.parse(req.body);
      if (data.party !== "jessica" && data.party !== "geldi") {
        return res.status(400).json({ message: "Choisissez la liste de l'invité : Jessica ou Geldi." });
      }
      const event = getGuestEvent({ invitedCeremonyChoice: data.invitedCeremonyChoice });
      if (!event) {
        return res.status(400).json({ message: "Une invitation appartient à un seul événement." });
      }
      const guest = await storage.createRsvp({
        ...data,
        ceremonyChoice: event,
        invitedCeremonyChoice: event,
        token: nanoid(10),
      });

      return res.status(201).json({
        ...guest,
        invitationUrl: buildInvitationLink(req, guest.token),
        invitationStatus: getInvitationStatus(guest),
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Impossible de créer l'invité" });
    }
  });

  app.patch("/api/admin/guests/:id", requireAuth, async (req, res) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      const data = updateGuestSchema.parse(req.body);
      const { revision, ...changes } = data;
      if (changes.party !== undefined && changes.party !== "jessica" && changes.party !== "geldi") {
        return res.status(400).json({ message: "Choisissez la liste de l'invité : Jessica ou Geldi." });
      }
      if (changes.invitedCeremonyChoice !== undefined) {
        const event = getGuestEvent({ invitedCeremonyChoice: changes.invitedCeremonyChoice });
        if (!event) {
          return res.status(400).json({ message: "Une invitation appartient à un seul événement." });
        }
        changes.invitedCeremonyChoice = event;
        changes.ceremonyChoice = event;
      }
      const guest = await storage.updateGuest(id, changes, revision);

      return res.json({
        ...guest,
        invitationUrl: buildInvitationLink(req, guest.token),
        invitationStatus: getInvitationStatus(guest),
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Impossible de mettre à jour l'invité" });
    }
  });

  // Répartit une invitation héritée (plusieurs célébrations ou aucune) :
  // la fiche d'origine garde son lien pour le premier événement, une copie est créée pour chacun des autres.
  app.post("/api/admin/guests/:id/split", requireAuth, async (req, res) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      const events = z.array(z.enum(["customary", "civil", "evening"])).min(1).max(3).parse(req.body?.events);
      const unique = Array.from(new Set(events));
      const guest = await storage.getRsvp(id);
      if (!guest) {
        return res.status(404).json({ message: "Invité introuvable" });
      }
      const [first, ...others] = unique;
      const updated = await storage.updateGuest(id, { ceremonyChoice: first, invitedCeremonyChoice: first });
      const copies = [];
      for (const event of others) {
        const { id: _id, token: _token, createdAt: _createdAt, updatedAt: _updatedAt, revision: _revision, checkedInAt: _checkedInAt, invitationSentAt: _sent, tableNumber: _table, ...rest } = guest as typeof guest & Record<string, unknown>;
        copies.push(await storage.createRsvp({
          ...(rest as typeof guest),
          ceremonyChoice: event,
          invitedCeremonyChoice: event,
          tableNumber: null,
          token: nanoid(10),
        }));
      }
      return res.json({ guest: updated, copies: copies.length });
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Impossible de répartir l'invitation" });
    }
  });

  app.post("/api/admin/guests/:id/regenerate-link", requireAuth, asyncRoute(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const guest = await storage.regenerateGuestToken(id, nanoid(10));

    return res.json({
      ...guest,
      invitationUrl: buildInvitationLink(req, guest.token),
      invitationStatus: getInvitationStatus(guest),
    });
  }));

  app.post("/api/admin/guests/:id/mark-sent", requireAuth, asyncRoute(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const guest = await storage.markInvitationSent(id);

    return res.json({
      ...guest,
      invitationUrl: buildInvitationLink(req, guest.token),
      invitationStatus: getInvitationStatus(guest),
    });
  }));

  app.delete("/api/admin/guests/:id", requireAuth, asyncRoute(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    await storage.deleteGuest(id);
    res.sendStatus(204);
  }));

  app.get("/api/site-settings", asyncRoute(async (_req, res) => {
    const stored = await getStoredSiteSettings();
    res.json(stored.settings);
  }));

  app.get("/api/admin/settings", requireAuth, asyncRoute(async (_req, res) => {
    res.json(await getStoredSiteSettings());
  }));

  app.put("/api/admin/settings", requireAuth, async (req, res) => {
    try {
      const payload = z.object({ settings: siteSettingsSchema, revision: z.number().int().min(0) }).parse(req.body);
      res.json(await saveStoredSiteSettings(payload.settings, payload.revision));
    } catch (error: any) {
      res.status(409).json({ message: error.message || "Impossible d’enregistrer les réglages." });
    }
  });

  app.get("/api/admin/backup", requireAuth, asyncRoute(async (_req, res) => {
    const [guests, settings] = await Promise.all([
      storage.getAllRsvps(),
      getStoredSiteSettings(),
    ]);
    res
      .status(200)
      .set({
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="jessica-geldi-sauvegarde-${new Date().toISOString().slice(0, 10)}.json"`,
      })
      .send(JSON.stringify({ exportedAt: new Date().toISOString(), guests, site: settings }, null, 2));
  }));

  app.put("/api/admin/account", requireAuth, async (req, res) => {
    try {
      const payload = z.object({
        username: z.string().trim().min(3).max(80),
        currentPassword: z.string().min(1),
        newPassword: z.string().min(10).max(200).optional().or(z.literal("")),
      }).parse(req.body);
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser || !(await bcrypt.compare(payload.currentPassword, currentUser.password))) {
        return res.status(403).json({ message: "Le mot de passe actuel est incorrect." });
      }
      const password = payload.newPassword ? await bcrypt.hash(payload.newPassword, 10) : undefined;
      const user = await storage.updateUserAccount(currentUser.id, payload.username, password);
      await storage.revokeOtherSessions(req.sessionID);
      const { password: _password, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Impossible de modifier le compte." });
    }
  });

  // Admin: Check-in (requires full admin auth)
  app.patch("/api/rsvp/:id/check-in", requireAuth, asyncRoute(async (req, res) => {
    const id = parseInt(req.params.id);
    const guest = await storage.checkInGuest(id);
    res.json(guest);
  }));

  app.patch("/api/rsvp/:id/uncheck", requireAuth, asyncRoute(async (req, res) => {
    const id = parseInt(req.params.id);
    const guest = await storage.uncheckInGuest(id);
    res.json(guest);
  }));

  // ── Check-in page endpoints (protected by a lighter code) ──────────────
  const CHECKIN_CODE = "JGCheckin2027";

  function requireCheckinCode(req: Request, res: Response, next: NextFunction) {
    const code = req.headers["x-checkin-code"];
    if (code !== CHECKIN_CODE) {
      return res.status(401).json({ message: "Code d'accès check-in invalide" });
    }
    return next();
  }

  // Reset all check-ins (admin protected)
  app.post("/api/admin/reset-checkins", requireAuth, asyncRoute(async (_req, res) => {
    await storage.resetAllCheckIns();
    res.json({ message: "Tous les check-ins ont été réinitialisés." });
  }));

  // Get confirmed guests only (for the check-in page)
  app.get("/api/checkin/guests", requireCheckinCode, asyncRoute(async (_req, res) => {
    const guests = await storage.getAllRsvps();
    const event = isWeddingEventKey(_req.query.event) ? _req.query.event : null;
    res.json(guests.filter((g) => g.status === "confirmed" && (!event || getGuestEvent(g) === event)));
  }));

  // Check-in a guest via the check-in page
  app.patch("/api/checkin/:id/check-in", requireCheckinCode, asyncRoute(async (req, res) => {
    const id = parseInt(req.params.id);
    const guest = await storage.checkInGuest(id);
    res.json(guest);
  }));

  // Uncheck-in a guest via the check-in page
  app.patch("/api/checkin/:id/uncheck", requireCheckinCode, asyncRoute(async (req, res) => {
    const id = parseInt(req.params.id);
    const guest = await storage.uncheckInGuest(id);
    res.json(guest);
  }));

  const httpServer = createServer(app);
  return httpServer;
}
