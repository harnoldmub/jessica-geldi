import type { Express, NextFunction, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminGuestSchema, insertRsvpSchema, updateGuestSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { sendRsvpConfirmationEmail } from "./email";
import { ensureAdminUser, setupAuth } from "./auth";

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
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replaceAll(`"`, `""`)}"`;
}

function buildInvitationLink(req: Request, token: string) {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
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
  setupAuth(app);
  await ensureAdminUser();
  
  // Public capacity endpoint
  const CIVIL_MAX = 250;
  const EVENING_MAX = 350;

  async function getCapacity(excludeGuestId?: number) {
    const all = await storage.getAllRsvps();
    const confirmed = all.filter(
      (g) => g.status === "confirmed" && g.id !== excludeGuestId,
    );
    const civil = confirmed
      .filter((g) => !g.ceremonyChoice || g.ceremonyChoice === "civil" || g.ceremonyChoice === "both")
      .reduce((sum, g) => sum + (g.guestCount || 1), 0);
    const evening = confirmed
      .filter((g) => !g.ceremonyChoice || g.ceremonyChoice === "evening" || g.ceremonyChoice === "both")
      .reduce((sum, g) => sum + (g.guestCount || 1), 0);
    return { civil, civilMax: CIVIL_MAX, evening, eveningMax: EVENING_MAX };
  }

  async function checkCapacity(
    data: { status?: string | null; ceremonyChoice?: string | null; guestCount?: number | null },
    excludeGuestId?: number,
  ): Promise<string | null> {
    if (data.status !== "confirmed") return null;
    const cap = await getCapacity(excludeGuestId);
    const count = data.guestCount || 1;
    const choice = data.ceremonyChoice || "both";
    if ((choice === "civil" || choice === "both") && cap.civil + count > cap.civilMax) {
      return "Le mariage civil est malheureusement complet.";
    }
    if ((choice === "evening" || choice === "both") && cap.evening + count > cap.eveningMax) {
      return "Le mariage religieux du 12 juillet est malheureusement complet.";
    }
    return null;
  }

  app.get("/api/capacity", asyncRoute(async (_req, res) => {
    res.json(await getCapacity());
  }));

  // Public RSVP Submission
  app.post("/api/rsvp", async (req, res) => {
    try {
      if (isRateLimited(rsvpRateLimitKey(req))) {
        return res.status(429).json({ message: "Trop de tentatives RSVP. Merci de réessayer dans un instant." });
      }

      const data = insertRsvpSchema.parse(req.body);

      const capacityError = await checkCapacity(data);
      if (capacityError) {
        return res.status(409).json({ message: capacityError });
      }

      // Generate a unique token for the guest
      const token = nanoid(10);
      
      const rsvp = await storage.createRsvp({
        ...data,
        token,
        status: data.status || 'confirmed',
      });

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
    res.json({
      ...guest,
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

      const capacityError = await checkCapacity(data, guest.id);
      if (capacityError) {
        return res.status(409).json({ message: capacityError });
      }

      const updatedGuest = await storage.updateGuest(guest.id, {
        ...data,
        ceremonyChoice: data.ceremonyChoice === null ? undefined : data.ceremonyChoice,
      });

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

      const updatedGuest = await storage.updateGuest(guest.id, { status });

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

  app.get("/api/admin/guests/export", requireAuth, asyncRoute(async (_req, res) => {
    const guests = await storage.getAllRsvps();

    const header = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "status",
      "guestCount",
      "ceremonyChoice",
      "beverageChoice",
      "message",
      "checkedInAt",
      "createdAt",
    ];

    const rows = guests.map((guest) =>
      [
        guest.firstName,
        guest.lastName,
        guest.email,
        guest.phone,
        guest.status,
        guest.guestCount,
        guest.ceremonyChoice,
        guest.beverageChoice,
        guest.message,
        guest.checkedInAt?.toISOString(),
        guest.createdAt?.toISOString(),
      ]
        .map(escapeCsvValue)
        .join(","),
    );

    res
      .status(200)
      .set({
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="glodie-samuel-rsvp.csv"',
      })
      .send([header.join(","), ...rows].join("\n"));
  }));

  // Admin: Bulk import guests (name only)
  app.post("/api/admin/guests/import", requireAuth, async (req, res) => {
    try {
      const { guests: names, guestCount = 1, ceremonyChoice = "both" } = req.body as {
        guests: { firstName: string; lastName: string }[];
        guestCount?: number;
        ceremonyChoice?: string;
      };

      if (!Array.isArray(names) || names.length === 0) {
        return res.status(400).json({ message: "Aucun invité à importer" });
      }

      const created = [];
      for (const { firstName, lastName } of names) {
        if (!firstName?.trim() || !lastName?.trim()) continue;
        const guest = await storage.createRsvp({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: null,
          phone: null,
          status: "pending",
          guestCount,
          ceremonyChoice: ceremonyChoice as "civil" | "evening" | "both",
          token: nanoid(10),
        });
        created.push({
          ...guest,
          invitationUrl: buildInvitationLink(req, guest.token),
          invitationStatus: getInvitationStatus(guest),
        });
      }

      return res.status(201).json(created);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Erreur lors de l'import" });
    }
  });

  app.post("/api/admin/guests", requireAuth, async (req, res) => {
    try {
      const data = adminGuestSchema.parse(req.body);
      const guest = await storage.createRsvp({
        ...data,
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
      const guest = await storage.updateGuest(id, data);

      return res.json({
        ...guest,
        invitationUrl: buildInvitationLink(req, guest.token),
        invitationStatus: getInvitationStatus(guest),
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Impossible de mettre à jour l'invité" });
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

  // Admin: Check-in (requires full admin auth)
  app.patch("/api/rsvp/:id/check-in", requireAuth, asyncRoute(async (req, res) => {
    const id = parseInt(req.params.id);
    const guest = await storage.checkInGuest(id);
    res.json(guest);
  }));

  // ── Check-in page endpoints (protected by a lighter code) ──────────────
  const CHECKIN_CODE = "GSCheckin2026";

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
    res.json(guests.filter((g) => g.status === "confirmed"));
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
