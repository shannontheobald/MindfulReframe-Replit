import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const intakeResponses = pgTable("intake_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  question1: text("question1").notNull(),
  question2: text("question2").notNull(),
  question3: text("question3").notNull(),
  question4: text("question4").notNull(),
  question5: text("question5").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const journalSessions = pgTable("journal_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  journalEntry: text("journal_entry").notNull(),
  detectedThoughts: text("detected_thoughts").array().notNull(),
  cognitiveDistortions: text("cognitive_distortions").array().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertIntakeResponseSchema = createInsertSchema(intakeResponses).omit({
  id: true,
  createdAt: true,
});

export const insertJournalSessionSchema = createInsertSchema(journalSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type IntakeResponse = typeof intakeResponses.$inferSelect;
export type InsertIntakeResponse = z.infer<typeof insertIntakeResponseSchema>;
export type JournalSession = typeof journalSessions.$inferSelect;
export type InsertJournalSession = z.infer<typeof insertJournalSessionSchema>;
