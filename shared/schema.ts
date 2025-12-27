import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const qualifications = pgTable("qualifications", {
  code: text("code").primaryKey(), // 3249, 7225, etc.
  description: text("description").notNull(),
  educationLevel: text("education_level"), // Ortaöğretim, Önlisans, Lisans, or 'Special' for conditions
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  osymCode: text("osym_code").notNull().unique(),
  institution: text("institution").notNull(),
  title: text("title").notNull(),
  city: text("city").notNull(),
  quota: integer("quota").notNull(),
  educationLevel: text("education_level").notNull(),
  minScore: integer("min_score"),
});

export const positionQualifications = pgTable("position_qualifications", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").notNull(),
  qualificationCode: text("qualification_code").notNull(),
});

// === RELATIONS ===
export const positionQualificationsRelations = relations(positionQualifications, ({ one }) => ({
  position: one(positions, {
    fields: [positionQualifications.positionId],
    references: [positions.id],
  }),
  qualification: one(qualifications, {
    fields: [positionQualifications.qualificationCode],
    references: [qualifications.code],
  }),
}));

export const positionsRelations = relations(positions, ({ many }) => ({
  qualifications: many(positionQualifications),
}));

// === BASE SCHEMAS ===
export const insertPositionSchema = createInsertSchema(positions).omit({ id: true });
export const insertQualificationSchema = createInsertSchema(qualifications);

// === EXPLICIT API CONTRACT TYPES ===

export type Position = typeof positions.$inferSelect;
export type Qualification = typeof qualifications.$inferSelect;

export interface PositionWithQualifications extends Position {
  qualifications: Qualification[];
}

export type SearchPositionsRequest = {
  educationLevel: string;
  cities: string[];
  departmentCodes: string[]; // Changed to array
  page: number;
  limit: number;
};

export type SearchPositionsResponse = {
  data: PositionWithQualifications[];
  total: number;
  page: number;
  limit: number;
};

export type FilterDataResponse = {
  cities: string[];
  educationLevels: string[];
  qualifications: Qualification[];
};
