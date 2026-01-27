import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["farmer", "trader", "admin"] }).default("farmer").notNull(),
  state: text("state"),
  district: text("district"),
  // For farmers: list of crops they grow. For traders: list of crops they buy.
  crops: text("crops").array(), 
  // Store any additional role-specific data here
  metadata: jsonb("metadata").$type<{
    consentToShareContact?: boolean;
    phone?: string;
    location?: string;
  }>(),
});

export const marketPrices = pgTable("market_prices", {
  id: serial("id").primaryKey(),
  crop: text("crop").notNull(),
  state: text("state").notNull(),
  district: text("district").notNull(),
  market: text("market").notNull(),
  price: integer("price").notNull(), // Price per quintal
  currency: text("currency").default("INR"),
  date: timestamp("date").defaultNow().notNull(),
  source: text("source").notNull(), // e.g., "Agmarknet", "Manual"
  confidenceScore: doublePrecision("confidence_score").default(1.0),
});

export const simulations = pgTable("simulations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  crop: text("crop").notNull(),
  // Input parameters for the simulation
  inputs: jsonb("inputs").notNull(),
  // Result of the simulation
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "advisory", "price_alert", "system"
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),
  category: text("category").notNull(), // "fertilizer", "irrigation", "pest_check", "market"
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const simulationsRelations = relations(simulations, ({ one }) => ({
  user: one(users, {
    fields: [simulations.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertMarketPriceSchema = createInsertSchema(marketPrices).omit({ id: true });
export const insertSimulationSchema = createInsertSchema(simulations).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type MarketPrice = typeof marketPrices.$inferSelect;
export type InsertMarketPrice = z.infer<typeof insertMarketPriceSchema>;
export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
