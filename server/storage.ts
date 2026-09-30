import {
  rsvpResponses,
  type InsertRsvpResponse,
  type RsvpResponse,
  type User,
  type InsertUser,
  type UpdateGuestInput,
  users,
  sessions,
} from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
import { and, ne, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // RSVP / Guest List
  getRsvp(id: number): Promise<RsvpResponse | undefined>;
  getRsvpByToken(token: string): Promise<RsvpResponse | undefined>;
  createRsvp(rsvp: InsertRsvpResponse & { token: string }): Promise<RsvpResponse>;
  getAllRsvps(): Promise<RsvpResponse[]>;
  updateGuest(id: number, guest: UpdateGuestInput, expectedRevision?: number): Promise<RsvpResponse>;
  regenerateGuestToken(id: number, token: string): Promise<RsvpResponse>;
  markInvitationSent(id: number): Promise<RsvpResponse>;
  deleteGuest(id: number): Promise<void>;
  checkInGuest(id: number): Promise<RsvpResponse>;
  uncheckInGuest(id: number): Promise<RsvpResponse>;
  resetAllCheckIns(): Promise<void>;
  
  // Auth / Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<User>;
  updateUserAccount(id: string, username: string, password?: string): Promise<User>;
  revokeOtherSessions(currentSid: string): Promise<void>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: "sessions",
    });
  }

  async getRsvp(id: number): Promise<RsvpResponse | undefined> {
    const [rsvp] = await db.select().from(rsvpResponses).where(eq(rsvpResponses.id, id));
    return rsvp;
  }

  async getRsvpByToken(token: string): Promise<RsvpResponse | undefined> {
    const [rsvp] = await db.select().from(rsvpResponses).where(eq(rsvpResponses.token, token));
    return rsvp;
  }

  async createRsvp(insertRsvp: InsertRsvpResponse & { token: string }): Promise<RsvpResponse> {
    const [rsvp] = await db.insert(rsvpResponses).values(insertRsvp).returning();
    return rsvp;
  }

  async getAllRsvps(): Promise<RsvpResponse[]> {
    return await db.select().from(rsvpResponses).orderBy(desc(rsvpResponses.createdAt));
  }

  async updateGuest(id: number, guest: UpdateGuestInput, expectedRevision?: number): Promise<RsvpResponse> {
    const { revision: _revision, ...changes } = guest;
    const condition = expectedRevision
      ? and(eq(rsvpResponses.id, id), eq(rsvpResponses.revision, expectedRevision))
      : eq(rsvpResponses.id, id);
    const [rsvp] = await db
      .update(rsvpResponses)
      .set({
        ...changes,
        revision: sql`${rsvpResponses.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(condition)
      .returning();

    if (!rsvp) {
      throw new Error("Cette fiche a été modifiée ailleurs. Actualisez la liste avant de réessayer.");
    }
    return rsvp;
  }

  async regenerateGuestToken(id: number, token: string): Promise<RsvpResponse> {
    const [rsvp] = await db
      .update(rsvpResponses)
      .set({
        token,
        revision: sql`${rsvpResponses.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(rsvpResponses.id, id))
      .returning();

    return rsvp;
  }

  async markInvitationSent(id: number): Promise<RsvpResponse> {
    const [rsvp] = await db
      .update(rsvpResponses)
      .set({
        invitationSentAt: new Date(),
        revision: sql`${rsvpResponses.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(rsvpResponses.id, id))
      .returning();

    return rsvp;
  }

  async deleteGuest(id: number): Promise<void> {
    await db.delete(rsvpResponses).where(eq(rsvpResponses.id, id));
  }

  async checkInGuest(id: number): Promise<RsvpResponse> {
    const [rsvp] = await db.update(rsvpResponses)
      .set({ checkedInAt: new Date(), revision: sql`${rsvpResponses.revision} + 1`, updatedAt: new Date() })
      .where(and(eq(rsvpResponses.id, id), eq(rsvpResponses.status, "confirmed")))
      .returning();
    if (!rsvp) throw new Error("Seuls les invités confirmés peuvent être enregistrés à l’accueil.");
    return rsvp;
  }

  async uncheckInGuest(id: number): Promise<RsvpResponse> {
    const [rsvp] = await db.update(rsvpResponses)
      .set({ checkedInAt: null, revision: sql`${rsvpResponses.revision} + 1`, updatedAt: new Date() })
      .where(eq(rsvpResponses.id, id))
      .returning();
    return rsvp;
  }

  async resetAllCheckIns(): Promise<void> {
    await db.update(rsvpResponses)
      .set({ checkedInAt: null, updatedAt: new Date() });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserAccount(id: string, username: string, password?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ username, ...(password ? { password } : {}) })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async revokeOtherSessions(currentSid: string): Promise<void> {
    await db.delete(sessions).where(ne(sessions.sid, currentSid));
  }
}

export const storage = new DatabaseStorage();
