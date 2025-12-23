import { db } from "./db";
import { 
  positions, qualifications, positionQualifications,
  type Position, type Qualification, type PositionWithQualifications, 
  type SearchPositionsRequest, type FilterDataResponse
} from "@shared/schema";
import { eq, ilike, and, inArray, sql, or } from "drizzle-orm";

export interface IStorage {
  getMeta(): Promise<FilterDataResponse>;
  searchPositions(filters: SearchPositionsRequest): Promise<PositionWithQualifications[]>;
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMeta(): Promise<FilterDataResponse> {
    const allQualifications = await db.select().from(qualifications);
    
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

    // Filter by Education Level
    if (filters.educationLevel) {
      conditions.push(eq(positions.educationLevel, filters.educationLevel));
    }

    // Filter by Cities
    const hasAllCities = filters.cities.some(c => c.toLowerCase() === 'all' || c === 'Tümü' || c === 'Tüm Şehirler');
    if (!hasAllCities && filters.cities.length > 0) {
      conditions.push(inArray(positions.city, filters.cities));
    }

    // Filter by Department Qualification Codes
    // Logic: User selects "Mekatronik (Code X)". We show positions that require Code X.
    // Also include generic codes (3001 etc) if they are applicable to the education level.
    if (filters.departmentCodes && filters.departmentCodes.length > 0) {
      const hasAllDepts = filters.departmentCodes.some(c => c.toLowerCase() === 'all' || c === 'Tümü');
      
      if (!hasAllDepts) {
        let codesToSearch = [...filters.departmentCodes];
        
        // Add Generic Codes automatically
        if (filters.educationLevel === "Ortaöğretim" && !codesToSearch.includes("2001")) codesToSearch.push("2001");
        if (filters.educationLevel === "Önlisans" && !codesToSearch.includes("3001")) codesToSearch.push("3001");
        if (filters.educationLevel === "Lisans" && !codesToSearch.includes("4001")) codesToSearch.push("4001");

        // Find positions that require ANY of the user's qualification codes OR the generic code
        // A position matches if ANY of its required qualifications is in the user's list.
        // Example: Position requires [3249, 6225]. User has [3249]. Match!
        // Example: Position requires [3001]. User has [3249]. Match (because 3001 is generic)!
        
        const matchingLinks = await db.select({ posId: positionQualifications.positionId })
          .from(positionQualifications)
          .where(inArray(positionQualifications.qualificationCode, codesToSearch));
          
        const matchingPositionIds = [...new Set(matchingLinks.map(l => l.posId))]; // Dedupe
        
        if (matchingPositionIds.length === 0) return [];
        
        conditions.push(inArray(positions.id, matchingPositionIds));
      }
    }

    const results = await db.select()
      .from(positions)
      .where(and(...conditions));

    const positionIds = results.map(r => r.id);
    if (positionIds.length === 0) return [];

    const quals = await db.select({
      posId: positionQualifications.positionId,
      qualification: qualifications
    })
    .from(positionQualifications)
    .innerJoin(qualifications, eq(positionQualifications.qualificationCode, qualifications.code))
    .where(inArray(positionQualifications.positionId, positionIds));

    const resultsWithQuals = results.map(pos => {
      const posQuals = quals
        .filter(q => q.posId === pos.id)
        .map(q => q.qualification);
      return { ...pos, qualifications: posQuals };
    });

    return resultsWithQuals;
  }

  async seedData(): Promise<void> {
    // Check if Mekatronik exists, if not, we re-seed or append
    const mekatronik = await db.select().from(qualifications).where(eq(qualifications.code, "3366")); // Common code for Mekatronik
    if (mekatronik.length > 0) return;

    console.log("Seeding extended data (Mekatronik & more)...");

    const qualsToInsert = [
      // === ÖNLİSANS (Associate Degree) ===
      // Mekatronik & Related
      { code: "3366", description: "Mekatronik, Mekatronik Teknolojisi Önlisans Programlarından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3290", description: "Elektrik, Elektrik Teknolojisi Önlisans Programlarından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3248", description: "Bilgisayar Destekli Tasarım ve Animasyon Önlisans Programından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3249", description: "Bilgisayar Programcılığı, İnternet ve Ağ Teknolojileri Önlisans Programlarından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3253", description: "Bilgi Yönetimi, Bilişim Yönetimi Önlisans Programlarından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3179", description: "Büro Yönetimi ve Yönetici Asistanlığı Önlisans Programından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3173", description: "Muhasebe ve Vergi Uygulamaları Önlisans Programından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3318", description: "Maliye Önlisans Programından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3319", description: "Sosyal Hizmetler Önlisans Programından mezun olmak.", educationLevel: "Önlisans" },
      
      // Health
      { code: "3005", description: "Acil Bakım Teknikerliği, Paramedik Önlisans Programlarından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3007", description: "Anestezi Önlisans Programından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3023", description: "Tıbbi Laboratuvar Teknikleri Önlisans Programından mezun olmak.", educationLevel: "Önlisans" },
      { code: "3037", description: "Tıbbi Görüntüleme Teknikleri Önlisans Programından mezun olmak.", educationLevel: "Önlisans" },

      // === ORTAÖĞRETİM (High School) ===
      { code: "2001", description: "Ortaöğretim Kurumlarının herhangi bir alanından mezun olmak.", educationLevel: "Ortaöğretim" },
      { code: "2023", description: "Ortaöğretim Kurumlarının Elektrik-Elektronik Teknolojisi Alanı ve Dallarından mezun olmak.", educationLevel: "Ortaöğretim" },
      { code: "2061", description: "Ortaöğretim Kurumlarının Makine Teknolojisi Alanı ve Dallarından mezun olmak.", educationLevel: "Ortaöğretim" },
      { code: "2111", description: "Ortaöğretim Kurumlarının Tesisat Teknolojisi ve İklimlendirme Alanı ve Dallarından mezun olmak.", educationLevel: "Ortaöğretim" },
      
      // === LİSANS (Bachelor's) ===
      { code: "4001", description: "Herhangi bir lisans programından mezun olmak.", educationLevel: "Lisans" },
      { code: "4531", description: "Bilgisayar Mühendisliği Lisans Programından mezun olmak.", educationLevel: "Lisans" },
      { code: "4611", description: "Elektrik-Elektronik Mühendisliği Lisans Programından mezun olmak.", educationLevel: "Lisans" },
      { code: "4619", description: "Elektronik ve Haberleşme Mühendisliği Lisans Programından mezun olmak.", educationLevel: "Lisans" },
      { code: "4639", description: "Makine Mühendisliği Lisans Programından mezun olmak.", educationLevel: "Lisans" },
      { code: "4747", description: "Mimarlık Lisans Programından mezun olmak.", educationLevel: "Lisans" },
      { code: "4421", description: "İktisat, Ekonomi Lisans Programlarından mezun olmak.", educationLevel: "Lisans" },
      { code: "4431", description: "İşletme Lisans Programından mezun olmak.", educationLevel: "Lisans" },
      { code: "4459", description: "Maliye Lisans Programından mezun olmak.", educationLevel: "Lisans" },
      
      // === SPECIAL CONDITIONS ===
      { code: "6225", description: "MEB onaylı Bilgisayar İşletmenliği Sertifikası sahibi olmak.", educationLevel: "Special" },
      { code: "7225", description: "Güvenlik Tahkikatının Olumlu Sonuçlanması.", educationLevel: "Special" },
      { code: "6506", description: "B Sınıfı Sürücü Belgesi sahibi olmak.", educationLevel: "Special" },
      { code: "6514", description: "D Sınıfı Sürücü Belgesi sahibi olmak.", educationLevel: "Special" },
      { code: "7300", description: "Bu kadroda görev yapacak personel vardiyalı çalışacaktır.", educationLevel: "Special" },
    ];

    // Insert all qualifications
    for (const q of qualsToInsert) {
      await db.insert(qualifications).values(q).onConflictDoUpdate({ target: qualifications.code, set: q });
    }

    // Positions (Updated with Mekatronik examples)
    const positionsData = [
      // Mekatronik / Technical Roles (Önlisans)
      { osymCode: "2910001", institution: "TÜRKİYE RAYLI SİSTEM ARAÇLARI SANAYİİ A.Ş.", title: "TEKNİKER", city: "SAKARYA", quota: 5, educationLevel: "Önlisans", quals: ["3366", "7225"] }, // Mekatronik
      { osymCode: "2910002", institution: "DEVLET HAVA MEYDANLARI İŞLETMESİ", title: "TEKNİKER", city: "İSTANBUL", quota: 2, educationLevel: "Önlisans", quals: ["3366", "7225", "6225"] }, // Mekatronik + Comp Cert
      { osymCode: "2910003", institution: "ETİ MADEN İŞLETMELERİ", title: "TEKNİKER", city: "ESKİŞEHİR", quota: 3, educationLevel: "Önlisans", quals: ["3366", "3290"] }, // Mekatronik OR Elektrik

      // Office / Administrative (Önlisans Generic 3001)
      { osymCode: "2910004", institution: "SOSYAL GÜVENLİK KURUMU", title: "MEMUR", city: "ANKARA", quota: 100, educationLevel: "Önlisans", quals: ["3001", "6225"] },
      { osymCode: "2910005", institution: "İÇİŞLERİ BAKANLIĞI", title: "VHKİ", city: "İZMİR", quota: 20, educationLevel: "Önlisans", quals: ["3001", "6225", "7225"] },

      // Computer / Informatics (Önlisans)
      { osymCode: "2910006", institution: "ANKARA ÜNİVERSİTESİ", title: "BİLGİSAYAR İŞLETMENİ", city: "ANKARA", quota: 4, educationLevel: "Önlisans", quals: ["3249", "6225"] },
      
      // Secondary (Ortaöğretim)
      { osymCode: "1910001", institution: "KARAYOLLARI GENEL MÜDÜRLÜĞÜ", title: "TEKNİSYEN", city: "VAN", quota: 2, educationLevel: "Ortaöğretim", quals: ["2023", "6506"] },
      { osymCode: "1910002", institution: "DEVLET SU İŞLERİ", title: "TEKNİSYEN", city: "ADANA", quota: 1, educationLevel: "Ortaöğretim", quals: ["2061"] },
      
      // License (Lisans)
      { osymCode: "3910001", institution: "TİCARET BAKANLIĞI", title: "MEMUR", city: "ANKARA", quota: 50, educationLevel: "Lisans", quals: ["4421", "4431", "4459"] }, // Econ/Bus/Finance
      { osymCode: "3910002", institution: "KÜLTÜR VE TURİZM BAKANLIĞI", title: "KÜTÜPHANECİ", city: "İSTANBUL", quota: 5, educationLevel: "Lisans", quals: ["4001", "7225"] }, // Generic Lisans
    ];

    for (const p of positionsData) {
      const [inserted] = await db.insert(positions).values({
        osymCode: p.osymCode,
        institution: p.institution,
        title: p.title,
        city: p.city,
        quota: p.quota,
        educationLevel: p.educationLevel,
      }).onConflictDoNothing().returning();

      if (inserted) {
        for (const qCode of p.quals) {
          await db.insert(positionQualifications).values({
            positionId: inserted.id,
            qualificationCode: qCode,
          }).onConflictDoNothing();
        }
      }
    }
  }
}

export const storage = new DatabaseStorage();
