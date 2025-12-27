import { db } from "./db";
import { env } from "./env";
import {
  positions, qualifications, positionQualifications,
  type Position, type Qualification, type PositionWithQualifications,
  type SearchPositionsRequest, type FilterDataResponse, type SearchPositionsResponse
} from "@shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface IStorage {
  getMeta(): Promise<FilterDataResponse>;
  searchPositions(filters: SearchPositionsRequest): Promise<SearchPositionsResponse>;
  seedData(): Promise<void>;
}

// JSON-based storage for when no database is available
interface ParsedQualification {
  code: string;
  description: string;
  educationLevel: string;
}

interface ParsedPosition {
  osymCode: string;
  institution: string;
  title: string;
  city: string;
  quota: number;
  qualificationCodes: string[];
  educationLevel: string;
}

class JsonStorage implements IStorage {
  private qualifications: ParsedQualification[] = [];
  private positions: ParsedPosition[] = [];
  private loaded = false;

  private loadData() {
    if (this.loaded) return;

    // Try multiple possible paths for Netlify compatibility
    const possiblePaths = [
      path.join(process.cwd(), "parsed_data"),
      path.join(process.cwd(), "dist", "parsed_data"),
      path.join(__dirname, "..", "..", "parsed_data"),
      path.join(__dirname, "..", "..", "dist", "parsed_data"),
    ];

    let qualsPath = "";
    let posPath = "";

    for (const basePath of possiblePaths) {
      const qPath = path.join(basePath, "qualifications.json");
      const pPath = path.join(basePath, "positions.json");

      if (fs.existsSync(qPath) && fs.existsSync(pPath)) {
        qualsPath = qPath;
        posPath = pPath;
        break;
      }
    }

    if (!qualsPath || !posPath) {
      console.error("❌ JSON dosyaları bulunamadı! Aranan yollar:", possiblePaths);
      throw new Error("JSON data files not found");
    }

    this.qualifications = JSON.parse(fs.readFileSync(qualsPath, "utf-8"));
    this.positions = JSON.parse(fs.readFileSync(posPath, "utf-8"));

    this.loaded = true;
    console.log(`📊 JSON Storage: ${this.qualifications.length} nitelik, ${this.positions.length} kadro yüklendi`);
    console.log(`📁 Yol: ${path.dirname(qualsPath)}`);
  }

  async getMeta(): Promise<FilterDataResponse> {
    this.loadData();

    const cities = Array.from(new Set(this.positions.map(p => p.city))).sort();
    const educationLevels = Array.from(new Set(this.positions.map(p => p.educationLevel))).sort();

    return {
      cities,
      educationLevels,
      qualifications: this.qualifications.map(q => ({
        code: q.code,
        description: q.description,
        educationLevel: q.educationLevel
      }))
    };
  }

  async searchPositions(filters: SearchPositionsRequest): Promise<SearchPositionsResponse> {
    this.loadData();

    let results = this.positions;

    // Filter by education level
    if (filters.educationLevel) {
      results = results.filter(p => p.educationLevel === filters.educationLevel);
    }

    // Filter by cities
    const hasAllCities = filters.cities.some(c =>
      c.toLowerCase() === 'all' || c === 'Tümü' || c === 'Tüm Şehirler'
    );
    if (!hasAllCities && filters.cities.length > 0) {
      results = results.filter(p => filters.cities.includes(p.city));
    }

    // Filter by qualification codes
    if (filters.departmentCodes && filters.departmentCodes.length > 0) {
      const hasAllDepts = filters.departmentCodes.some(c =>
        c.toLowerCase() === 'all' || c === 'Tümü'
      );

      if (!hasAllDepts) {
        let codesToSearch = [...filters.departmentCodes];

        // Add generic codes
        if (filters.educationLevel === "Ortaöğretim" && !codesToSearch.includes("2001")) {
          codesToSearch.push("2001");
        }
        if (filters.educationLevel === "Önlisans" && !codesToSearch.includes("3001")) {
          codesToSearch.push("3001");
        }
        if (filters.educationLevel === "Lisans" && !codesToSearch.includes("4001")) {
          codesToSearch.push("4001");
        }

        results = results.filter(p =>
          p.qualificationCodes.some(qc => codesToSearch.includes(qc))
        );
      }
    }

    const total = results.length;
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const start = (page - 1) * limit;
    const paginatedResults = results.slice(start, start + limit);

    // Map to PositionWithQualifications format
    const qualMap = new Map(this.qualifications.map(q => [q.code, q]));

    const data = paginatedResults.map((p, idx) => ({
      id: idx + 1 + start,
      osymCode: p.osymCode,
      institution: p.institution,
      title: p.title,
      city: p.city,
      quota: p.quota,
      educationLevel: p.educationLevel,
      minScore: null,
      qualifications: p.qualificationCodes
        .map(code => qualMap.get(code))
        .filter((q): q is ParsedQualification => q !== undefined)
        .map(q => ({
          code: q.code,
          description: q.description,
          educationLevel: q.educationLevel
        }))
    }));

    return { data, total, page, limit };
  }

  async seedData(): Promise<void> {
    this.loadData();
  }
}

// Database storage (original implementation)
export class DatabaseStorage implements IStorage {
  async getMeta(): Promise<FilterDataResponse> {
    const allQualifications = await db.select().from(qualifications);
    const distinctCities = await db.select({ city: positions.city }).from(positions).groupBy(positions.city);
    const distinctEdLevels = await db.select({ level: positions.educationLevel }).from(positions).groupBy(positions.educationLevel);

    return {
      cities: distinctCities.map((d: { city: string }) => d.city).sort(),
      educationLevels: distinctEdLevels.map((d: { level: string }) => d.level).sort(),
      qualifications: allQualifications.sort((a: Qualification, b: Qualification) => a.code.localeCompare(b.code)),
    };
  }

  async searchPositions(filters: SearchPositionsRequest): Promise<SearchPositionsResponse> {
    const conditions = [];

    if (filters.educationLevel) {
      conditions.push(eq(positions.educationLevel, filters.educationLevel));
    }

    const hasAllCities = filters.cities.some(c => c.toLowerCase() === 'all' || c === 'Tümü');
    if (!hasAllCities && filters.cities.length > 0) {
      conditions.push(inArray(positions.city, filters.cities));
    }

    let matchingPositionIds: { id: number }[] = [];
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    if (filters.departmentCodes && filters.departmentCodes.length > 0) {
      const hasAllDepts = filters.departmentCodes.some(c => c.toLowerCase() === 'all' || c === 'Tümü');

      if (!hasAllDepts) {
        let codesToSearch = [...filters.departmentCodes];
        if (filters.educationLevel === "Ortaöğretim" && !codesToSearch.includes("2001")) codesToSearch.push("2001");
        if (filters.educationLevel === "Önlisans" && !codesToSearch.includes("3001")) codesToSearch.push("3001");
        if (filters.educationLevel === "Lisans" && !codesToSearch.includes("4001")) codesToSearch.push("4001");

        // First get total count
        const allMatchingIds = await db.select({ id: positions.id })
          .from(positions)
          .where(and(...conditions, sql`EXISTS (
            SELECT 1 FROM ${positionQualifications} 
            WHERE ${positionQualifications.positionId} = ${positions.id} 
            AND ${positionQualifications.qualificationCode} = ANY(${codesToSearch})
          )`));

        const total = allMatchingIds.length;
        if (total === 0) return { data: [], total: 0, page, limit };

        matchingPositionIds = allMatchingIds.slice(offset, offset + limit);

        const results = await db.select().from(positions)
          .where(inArray(positions.id, matchingPositionIds.map(p => p.id)));

        const quals = await db.select({
          posId: positionQualifications.positionId,
          qualification: qualifications
        })
          .from(positionQualifications)
          .innerJoin(qualifications, eq(positionQualifications.qualificationCode, qualifications.code))
          .where(inArray(positionQualifications.positionId, matchingPositionIds.map(p => p.id)));

        const qualsByPosition = new Map<number, Qualification[]>();
        quals.forEach((q: { posId: number; qualification: Qualification }) => {
          if (!qualsByPosition.has(q.posId)) qualsByPosition.set(q.posId, []);
          qualsByPosition.get(q.posId)!.push(q.qualification);
        });

        const data = results.map((pos: Position) => ({ ...pos, qualifications: qualsByPosition.get(pos.id) || [] }));
        return { data, total, page, limit };
      }
    }

    // No qualification filter
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(positions)
      .where(and(...conditions));
    const total = Number(totalResult[0].count);

    if (total === 0) return { data: [], total: 0, page, limit };

    const results = await db.select().from(positions)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    const positionIds = results.map((r: Position) => r.id);
    const quals = await db.select({
      posId: positionQualifications.positionId,
      qualification: qualifications
    })
      .from(positionQualifications)
      .innerJoin(qualifications, eq(positionQualifications.qualificationCode, qualifications.code))
      .where(inArray(positionQualifications.positionId, positionIds));

    const qualsByPosition = new Map<number, Qualification[]>();
    quals.forEach((q: { posId: number; qualification: Qualification }) => {
      if (!qualsByPosition.has(q.posId)) qualsByPosition.set(q.posId, []);
      qualsByPosition.get(q.posId)!.push(q.qualification);
    });

    const data = results.map((pos: Position) => ({ ...pos, qualifications: qualsByPosition.get(pos.id) || [] }));
    return { data, total, page, limit };
  }

  async seedData(): Promise<void> {
    // Database seeding handled by seed-db.ts script
  }
}

// Export appropriate storage based on database availability
export const storage: IStorage = db ? new DatabaseStorage() : new JsonStorage();
