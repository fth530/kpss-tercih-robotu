import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Nitelik Kodları (e.g., 3249 - Bilgisayar Programcılığı, 6225 - MEB Onaylı Bilgisayar İşletmeni Sertifikası)
export const qualifications = pgTable("qualifications", {
  code: text("code").primaryKey(), // 3249, 7225, etc.
  description: text("description").notNull(),
  educationLevel: text("education_level"), // Ortaöğretim, Önlisans, Lisans, or 'Special' for conditions
});

// Kadrolar (Positions)
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  osymCode: text("osym_code").notNull().unique(), // e.g., 1010101
  institution: text("institution").notNull(), // e.g., Ankara Üniversitesi
  title: text("title").notNull(), // e.g., Memur, Bilgisayar İşletmeni
  city: text("city").notNull(),
  quota: integer("quota").notNull(), // Kaç kişi alınacağı
  educationLevel: text("education_level").notNull(), // Ortaöğretim, Önlisans, Lisans
  minScore: integer("min_score"), // Optional informational field
});

// Kadro - Nitelik İlişkisi (Many-to-Many)
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

// For the search results, we want the position + its qualification codes
export interface PositionWithQualifications extends Position {
  qualifications: Qualification[];
}

export type SearchPositionsRequest = {
  educationLevel: string;
  cities: string[]; // ["All"] or ["Ankara", "Izmir"]
  departmentCode?: string; // e.g. "3249" - Main qualification code for the user's major
};

export type FilterDataResponse = {
  cities: string[];
  educationLevels: string[];
  qualifications: Qualification[]; // For the autocomplete dropdown
};
