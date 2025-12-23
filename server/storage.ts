import { db } from "./db";
import { 
  positions, qualifications, positionQualifications,
  type Position, type Qualification, type PositionWithQualifications, 
  type SearchPositionsRequest, type FilterDataResponse
} from "@shared/schema";
import { eq, ilike, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  getMeta(): Promise<FilterDataResponse>;
  searchPositions(filters: SearchPositionsRequest): Promise<PositionWithQualifications[]>;
  // Seeding methods
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMeta(): Promise<FilterDataResponse> {
    const allQualifications = await db.select().from(qualifications);
    
    // Get distinct cities and education levels from positions to populate filters dynamically
    const distinctCities = await db
      .select({ city: positions.city })
      .from(positions)
      .groupBy(positions.city);
      
    const distinctEdLevels = await db
      .select({ level: positions.educationLevel })
      .from(positions)
      .groupBy(positions.educationLevel);

    return {
      cities: distinctCities.map(d => d.city).sort(),
      educationLevels: distinctEdLevels.map(d => d.level).sort(),
      qualifications: allQualifications.sort((a, b) => a.code.localeCompare(b.code)),
    };
  }

  async searchPositions(filters: SearchPositionsRequest): Promise<PositionWithQualifications[]> {
    const conditions = [];

    // Filter by Education Level (Exact match)
    conditions.push(eq(positions.educationLevel, filters.educationLevel));

    // Filter by Cities (if not "All" or empty)
    // Assuming frontend sends "All" or explicit list. If list contains "All", ignore city filter.
    const hasAll = filters.cities.some(c => c.toLowerCase() === 'all' || c === 'Tümü');
    if (!hasAll && filters.cities.length > 0) {
      conditions.push(inArray(positions.city, filters.cities));
    }

    // Filter by Department Qualification Code
    // If a department code is provided (e.g. 3249), we only show positions that REQUIRE this qualification
    // OR generic positions (3001, 2001, 4001) if we assume the robot logic works that way.
    // HOWEVER, typically "department" filter means "Show me positions I am eligible for with THIS degree".
    // So we search for positions that have (3249 OR 3001) in their requirements.
    // For simplicity in this robot: strict match on required qualification if provided.
    // But usually, positions have multiple codes: [3249, 6225]. 
    // We need to find positions where at least one of the required qualifications matches the user's input code,
    // OR matches the generic code for that education level (e.g. 3001 for Pre-License).
    
    // Let's implement a smarter filter:
    // 1. Find generic code for the level (2001, 3001, 4001).
    // 2. Filter positions that contain (UserCode OR GenericCode).
    
    let matchingPositionIds: number[] | null = null;
    
    if (filters.departmentCode) {
      // Basic mapping for generic codes
      let genericCode = "";
      if (filters.educationLevel === "Ortaöğretim") genericCode = "2001";
      if (filters.educationLevel === "Önlisans") genericCode = "3001";
      if (filters.educationLevel === "Lisans") genericCode = "4001";

      const codesToSearch = [filters.departmentCode];
      if (genericCode) codesToSearch.push(genericCode);

      const matchingLinks = await db.select({ posId: positionQualifications.positionId })
        .from(positionQualifications)
        .where(inArray(positionQualifications.qualificationCode, codesToSearch));
        
      matchingPositionIds = matchingLinks.map(l => l.posId);
      
      // If no positions match the qual codes, return empty early to save query
      if (matchingPositionIds.length === 0) return [];
      
      conditions.push(inArray(positions.id, matchingPositionIds));
    }

    const results = await db.select()
      .from(positions)
      .where(and(...conditions));

    // Now fetch qualifications for these positions to attach them
    const positionIds = results.map(r => r.id);
    if (positionIds.length === 0) return [];

    const quals = await db.select({
      posId: positionQualifications.positionId,
      qualification: qualifications
    })
    .from(positionQualifications)
    .innerJoin(qualifications, eq(positionQualifications.qualificationCode, qualifications.code))
    .where(inArray(positionQualifications.positionId, positionIds));

    // Map quals to positions
    const resultsWithQuals = results.map(pos => {
      const posQuals = quals
        .filter(q => q.posId === pos.id)
        .map(q => q.qualification);
      return { ...pos, qualifications: posQuals };
    });

    return resultsWithQuals;
  }

  async seedData(): Promise<void> {
    const existingQs = await db.select().from(qualifications).limit(1);
    if (existingQs.length > 0) return; // Already seeded

    console.log("Seeding data...");

    // Insert Qualifications
    await db.insert(qualifications).values([
      // Education Levels Generic
      { code: "2001", description: "Ortaöğretim Kurumlarının herhangi bir alanından mezun olmak.", educationLevel: "Ortaöğretim" },
      { code: "3001", description: "Meslek yüksekokullarının herhangi bir programından mezun olmak.", educationLevel: "Önlisans" },
      { code: "4001", description: "Herhangi bir lisans programından mezun olmak.", educationLevel: "Lisans" },
      
      // Departments
      { code: "3249", description: "Bilgisayar Programcılığı, Bilgisayar Programlama, Bilgisayar Teknolojisi ve Programlama...", educationLevel: "Önlisans" },
      { code: "3253", description: "Bilgi İşlem, Bilgisayar Operatörlüğü, Bilgisayar Teknikerliği...", educationLevel: "Önlisans" },
      { code: "3179", description: "Büro Yönetimi ve Yönetici Asistanlığı...", educationLevel: "Önlisans" },
      
      // Special Conditions
      { code: "6225", description: "M.E.B.'den Onaylı Bilgisayar İşletmeni Sertifikasına Sahip Olmak", educationLevel: "Special" },
      { code: "7225", description: "Güvenlik Tahkikatının Olumlu Sonuçlanması", educationLevel: "Special" },
      { code: "7113", description: "KPDS En Az D Seviyesinde İngilizce Bilmek", educationLevel: "Special" },
    ]);

    // Insert Positions
    const posList = [
      // 3249 Specific
      { osymCode: "1928374", institution: "ANKARA ÜNİVERSİTESİ", title: "Bilgisayar İşletmeni", city: "Ankara", quota: 5, educationLevel: "Önlisans", quals: ["3249", "6225"] },
      { osymCode: "1928375", institution: "İZMİR YÜKSEK TEKNOLOJİ ENSTİTÜSÜ", title: "Tekniker", city: "İzmir", quota: 2, educationLevel: "Önlisans", quals: ["3249", "7225"] },
      
      // 3001 Generic
      { osymCode: "2938475", institution: "İÇİŞLERİ BAKANLIĞI", title: "VHKİ", city: "Ankara", quota: 50, educationLevel: "Önlisans", quals: ["3001", "6225", "7225"] },
      { osymCode: "2938476", institution: "GÖÇ İDARESİ BAŞKANLIĞI", title: "Memur", city: "İstanbul", quota: 15, educationLevel: "Önlisans", quals: ["3001"] },

      // 2001 Secondary
      { osymCode: "1029384", institution: "KARAYOLLARI GENEL MÜDÜRLÜĞÜ", title: "Teknisyen Yardımcısı", city: "Mersin", quota: 10, educationLevel: "Ortaöğretim", quals: ["2001"] },
      { osymCode: "1029385", institution: "DEVLET SU İŞLERİ", title: "Bekçi", city: "Adana", quota: 3, educationLevel: "Ortaöğretim", quals: ["2001", "7225"] },

      // 4001 License
      { osymCode: "4827364", institution: "MALİYE BAKANLIĞI", title: "Vergi Müfettiş Yrd.", city: "Ankara", quota: 100, educationLevel: "Lisans", quals: ["4001", "7113"] },
    ];

    for (const p of posList) {
      const [inserted] = await db.insert(positions).values({
        osymCode: p.osymCode,
        institution: p.institution,
        title: p.title,
        city: p.city,
        quota: p.quota,
        educationLevel: p.educationLevel,
      }).returning();

      for (const qCode of p.quals) {
        await db.insert(positionQualifications).values({
          positionId: inserted.id,
          qualificationCode: qCode,
        });
      }
    }
  }
}

export const storage = new DatabaseStorage();
