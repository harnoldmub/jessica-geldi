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
  
  // Public RSVP Submission
  app.post("/api/rsvp", async (req, res) => {
    try {
      if (isRateLimited(rsvpRateLimitKey(req))) {
        return res.status(429).json({ message: "Trop de tentatives RSVP. Merci de réessayer dans un instant." });
      }

      const data = insertRsvpSchema.parse(req.body);
      
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
  app.get("/api/invitation/:token", async (req, res) => {
    const guest = await storage.getRsvpByToken(req.params.token);
    if (!guest) {
      return res.status(404).json({ message: "Invitation introuvable" });
    }
    res.json({
      ...guest,
      invitationUrl: buildInvitationLink(req, guest.token),
      invitationStatus: getInvitationStatus(guest),
    });
  });

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
      const updatedGuest = await storage.updateGuest(guest.id, data);

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

  // Admin: Guest List
  app.get("/api/admin/guests", requireAuth, async (req, res) => {
    const guests = await storage.getAllRsvps();
    res.json(
      guests.map((guest) => ({
        ...guest,
        invitationUrl: buildInvitationLink(req, guest.token),
        invitationStatus: getInvitationStatus(guest),
      })),
    );
  });

  app.get("/api/admin/guests/export", requireAuth, async (_req, res) => {
    const guests = await storage.getAllRsvps();

    const header = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "status",
      "guestCount",
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
        "Content-Disposition": 'attachment; filename="mamisa-marylin-rsvp.csv"',
      })
      .send([header.join(","), ...rows].join("\n"));
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

  app.post("/api/admin/guests/:id/regenerate-link", requireAuth, async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const guest = await storage.regenerateGuestToken(id, nanoid(10));

    return res.json({
      ...guest,
      invitationUrl: buildInvitationLink(req, guest.token),
      invitationStatus: getInvitationStatus(guest),
    });
  });

  app.post("/api/admin/guests/:id/mark-sent", requireAuth, async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const guest = await storage.markInvitationSent(id);

    return res.json({
      ...guest,
      invitationUrl: buildInvitationLink(req, guest.token),
      invitationStatus: getInvitationStatus(guest),
    });
  });

  app.delete("/api/admin/guests/:id", requireAuth, async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    await storage.deleteGuest(id);
    res.sendStatus(204);
  });

  // Admin: Check-in
  app.patch("/api/rsvp/:id/check-in", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const guest = await storage.checkInGuest(id);
    res.json(guest);
  });

  const httpServer = createServer(app);
  return httpServer;
}
