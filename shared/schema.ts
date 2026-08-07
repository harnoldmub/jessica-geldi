import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const eventChoiceSchema = z
  .string({
    required_error: "Veuillez choisir votre participation",
    invalid_type_error: "Veuillez choisir votre participation",
  })
  .trim()
  .min(1, "Veuillez choisir au moins une célébration")
  .max(100, "Trop de célébrations sélectionnées")
  .refine(
    (value) =>
      value
        .split(",")
        .every((key) => ["customary", "civil", "religious", "reception", "all", "both", "evening"].includes(key.trim())),
    "Veuillez choisir une célébration valide",
  );

// Session storage for Passport.js
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Admin users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: text("password").notNull(), // Hashed
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// RSVP Responses / Guest List
export const rsvpResponses = pgTable("rsvp_responses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  
  // Status & Attendance
  status: varchar("status", { length: 50 }).notNull().default('pending'), // 'confirmed', 'declined', 'pending'
  guestCount: integer("guest_count").notNull().default(1),
  ceremonyChoice: varchar("ceremony_choice", { length: 100 }).default('civil'),
  mealChoice: varchar("meal_choice", { length: 100 }),
  beverageChoice: varchar("beverage_choice", { length: 100 }),
  message: text("message"), // Optional message from guest
  
  // Invitation & Check-in
  tableNumber: integer("table_number"),
  token: varchar("token").unique().notNull(), // For personalized invitation links
  invitationSentAt: timestamp("invitation_sent_at"),
  checkedInAt: timestamp("checked_in_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod Schemas for Validation
export const insertRsvpSchema = createInsertSchema(rsvpResponses, {
  email: () =>
    z
      .string()
      .trim()
      .email("Email invalide")
      .or(z.literal(""))
      .optional()
      .transform((value) => (value ? value : null)),
  phone: () =>
    z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null)),
  mealChoice: () =>
    z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null)),
  beverageChoice: () =>
    z
      .string()
      .trim()
      .max(100, "La boisson doit faire moins de 100 caractères")
      .or(z.literal(""))
      .optional()
      .transform((value) => (value ? value : null)),
  message: () =>
    z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null)),
  firstName: (schema) => schema.min(1, "Prénom requis"),
  lastName: (schema) => schema.min(1, "Nom requis"),
  status: () => z.enum(["pending", "confirmed", "declined"], {
    required_error: "Veuillez choisir votre réponse",
    invalid_type_error: "Veuillez choisir votre réponse",
  }),
  guestCount: (schema) => schema.min(1, "Veuillez choisir le nombre de personnes").max(2, "Maximum 2 personnes"),
  ceremonyChoice: () => eventChoiceSchema.optional(),
}).omit({
  token: true,
  invitationSentAt: true,
  checkedInAt: true,
  createdAt: true,
  updatedAt: true,
});

export const adminGuestSchema = insertRsvpSchema.extend({
  status: z.enum(["pending", "confirmed", "declined"]).default("pending"),
  ceremonyChoice: eventChoiceSchema.default("civil"),
  tableNumber: z.number().int().min(1).max(200).nullable().optional(),
});

export const updateGuestSchema = adminGuestSchema.partial();

export const insertUserSchema = createInsertSchema(users);

// Types
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, "password">;
export type InsertUser = typeof users.$inferInsert;
export type RsvpResponse = typeof rsvpResponses.$inferSelect;
export type InsertRsvpResponse = typeof rsvpResponses.$inferInsert;
export type RsvpFormInput = z.infer<typeof insertRsvpSchema>;
export type AdminGuestInput = z.infer<typeof adminGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
