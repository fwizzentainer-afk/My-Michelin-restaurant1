import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // hashed
  role: text("role").notNull().default("sala"), // sala | cozinha | admin
});

export const insertUserSchema = createInsertSchema(users, {
  role: z.enum(["sala", "cozinha", "admin"]).default("sala"),
}).pick({ username: true, password: true, role: true });

export const menus = pgTable("menus", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  moments: jsonb("moments").$type<string[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const tables = pgTable("tables", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull().unique(),
  menuId: uuid("menu_id")
    .references(() => menus.id)
    .$type<string | null>()
    .default(null),
  pairing: text("pairing"),
  pax: integer("pax"),
  language: text("language"),
  status: text("status").notNull().default("idle"),
  currentMoment: integer("current_moment").notNull().default(0),
  totalMoments: integer("total_moments").notNull().default(0),
  startTime: timestamp("start_time", { withTimezone: true }),
  lastMomentTime: timestamp("last_moment_time", { withTimezone: true }),
  restrictions: jsonb("restrictions").$type<{
    type: "alergia" | "intolerancia" | "gravidez" | null;
    description: string;
  }>(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const historicalServices = pgTable("historical_services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tableNumber: text("table_number").notNull(),
  menuName: text("menu_name"),
  pairing: text("pairing"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  momentsHistory: jsonb("moments_history").$type<
    Array<{
      momentNumber: number;
      momentName: string;
      startTime: number | null;
      readyTime: number | null;
      finishTime: number | null;
    }>
  >(),
});

export const insertMenuSchema = createInsertSchema(menus).pick({
  name: true,
  moments: true,
  isActive: true,
});

export const insertTableSchema = createInsertSchema(tables).pick({
  number: true,
  menuId: true,
  pairing: true,
  pax: true,
  language: true,
  status: true,
  currentMoment: true,
  totalMoments: true,
  startTime: true,
  lastMomentTime: true,
  restrictions: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type Menu = typeof menus.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;
export type Table = typeof tables.$inferSelect;
export type HistoricalService = typeof historicalServices.$inferSelect;
export type InsertHistoricalService = typeof historicalServices.$inferInsert;
