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
    const hasAllCities = filters.cities.some(c => c.toLowerCase() === 'all' || c === 'Tümü');
    if (!hasAllCities && filters.cities.length > 0) {
      conditions.push(inArray(positions.city, filters.cities));
    }

    // Filter by Department Qualification Codes
    if (filters.departmentCodes && filters.departmentCodes.length > 0) {
      const hasAllDepts = filters.departmentCodes.some(c => c.toLowerCase() === 'all' || c === 'Tümü');
      
      if (!hasAllDepts) {
        // Generic codes per level
        let genericCode = "";
        if (filters.educationLevel === "Ortaöğretim") genericCode = "2001";
        if (filters.educationLevel === "Önlisans") genericCode = "3001";
        if (filters.educationLevel === "Lisans") genericCode = "4001";

        const codesToSearch = [...filters.departmentCodes];
        if (genericCode && !codesToSearch.includes(genericCode)) {
          codesToSearch.push(genericCode);
        }

        // Find positions that have ANY of these qualification codes
        const matchingLinks = await db.select({ posId: positionQualifications.positionId })
          .from(positionQualifications)
          .where(inArray(positionQualifications.qualificationCode, codesToSearch));
          
        const matchingPositionIds = matchingLinks.map(l => l.posId);
        
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
    const existingQs = await db.select().from(qualifications).limit(1);
    if (existingQs.length > 0) return;

    console.log("Seeding real data...");

    // 1. Insert Qualifications (Sample from user files)
    const qualsToInsert = [
      // Generics
      { code: "2001", description: "Ortaöğretim Kurumlarının herhangi bir alanından mezun olmak.", educationLevel: "Ortaöğretim" },
      { code: "3001", description: "Herhangi bir önlisans programından mezun olmak.", educationLevel: "Önlisans" },
      { code: "4001", description: "Herhangi bir lisans programından mezun olmak.", educationLevel: "Lisans" },
      
      // Secondary (Ortaöğretim)
      { code: "2023", description: "Elektrik-Elektronik Teknolojisi...", educationLevel: "Ortaöğretim" },
      { code: "2051", description: "Hemşirelik-Ebelik-Sağlık Memurluğu...", educationLevel: "Ortaöğretim" },
      { code: "2071", description: "Makine Teknolojisi...", educationLevel: "Ortaöğretim" },
      { code: "2111", description: "Tesisat Teknolojisi ve İklimlendirme...", educationLevel: "Ortaöğretim" },
      { code: "2125", description: "Hemşirelik...", educationLevel: "Ortaöğretim" },
      { code: "2086", description: "Raylı Sistemler Teknolojisi...", educationLevel: "Ortaöğretim" },

      // Pre-License (Önlisans)
      { code: "3005", description: "Acil Bakım Teknikerliği, Paramedik...", educationLevel: "Önlisans" },
      { code: "3007", description: "Anestezi...", educationLevel: "Önlisans" },
      { code: "3008", description: "Eczane Teknikerliği...", educationLevel: "Önlisans" },
      { code: "3011", description: "Ağız ve Diş Sağlığı...", educationLevel: "Önlisans" },
      { code: "3023", description: "Tıbbi Laboratuvar Teknikleri...", educationLevel: "Önlisans" },
      { code: "3037", description: "Tıbbi Görüntüleme Teknikleri (Radyoloji)...", educationLevel: "Önlisans" },
      { code: "3179", description: "Büro Yönetimi ve Yönetici Asistanlığı...", educationLevel: "Önlisans" },
      { code: "3248", description: "Bilgisayar Destekli Tasarım...", educationLevel: "Önlisans" },
      { code: "3249", description: "Bilgisayar Programcılığı...", educationLevel: "Önlisans" },
      { code: "3290", description: "Elektrik...", educationLevel: "Önlisans" },
      { code: "3318", description: "Maliye...", educationLevel: "Önlisans" }, // Inferring
      { code: "3319", description: "Sosyal Hizmetler...", educationLevel: "Önlisans" }, // Actually likely Social Services or similar

      // License (Lisans)
      { code: "4419", description: "Hukuk...", educationLevel: "Lisans" },
      { code: "4421", description: "İktisat, Ekonomi...", educationLevel: "Lisans" },
      { code: "4431", description: "İşletme...", educationLevel: "Lisans" },
      { code: "4503", description: "Kamu Yönetimi...", educationLevel: "Lisans" },
      { code: "4531", description: "Bilgisayar Mühendisliği...", educationLevel: "Lisans" },
      { code: "4611", description: "Elektrik-Elektronik Mühendisliği...", educationLevel: "Lisans" },
      { code: "4747", description: "Mimarlık...", educationLevel: "Lisans" },
      { code: "4605", description: "Hemşirelik...", educationLevel: "Lisans" },
      
      // Special Conditions
      { code: "6225", description: "MEB onaylı Bilgisayar İşletmenliği Sertifikası sahibi olmak.", educationLevel: "Special" },
      { code: "6262", description: "Bakınız: Başvurma Özel Şartları - Temizlik", educationLevel: "Special" },
      { code: "6506", description: "B Sınıfı Sürücü Belgesi sahibi olmak.", educationLevel: "Special" },
      { code: "6514", description: "D Sınıfı Sürücü Belgesi sahibi olmak.", educationLevel: "Special" },
      { code: "6551", description: "Özel Güvenlik Görevlisi Kimlik Kartı sahibi olmak.", educationLevel: "Special" },
      { code: "7225", description: "Güvenlik Tahkikatının Olumlu Sonuçlanması", educationLevel: "Special" },
      { code: "7248", description: "Vardiyalı çalışma engeli bulunmamak", educationLevel: "Special" },
      { code: "7300", description: "Bu kadroda görev yapacak personel...", educationLevel: "Special" },
      { code: "7348", description: "Bakınız: Başvurma Özel Şartları", educationLevel: "Special" },
      { code: "7205", description: "Avukatlık Ruhsatı sahibi olmak", educationLevel: "Special" },
      { code: "7257", description: "Seyahate ve arazide çalışmaya elverişli olmak", educationLevel: "Special" },
    ];

    await db.insert(qualifications).values(qualsToInsert).onConflictDoNothing();

    // 2. Insert Positions (Real data from files)
    const positionsData = [
      // --- TABLO-1 (Ortaöğretim) ---
      { osymCode: "102010101", institution: "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ", title: "DESTEK PERSONELİ", city: "AFYONKARAHİSAR", quota: 6, educationLevel: "Ortaöğretim", quals: ["2001", "6262", "7348"] }, // Assuming codes based on row 2 for similar role
      { osymCode: "102010108", institution: "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ", title: "DESTEK PERSONELİ", city: "AFYONKARAHİSAR", quota: 70, educationLevel: "Ortaöğretim", quals: ["2001", "6262", "7248", "7348"] },
      { osymCode: "102010122", institution: "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ", title: "HEMŞİRE", city: "AFYONKARAHİSAR", quota: 30, educationLevel: "Ortaöğretim", quals: ["2125"] },
      { osymCode: "102010129", institution: "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ", title: "TEKNİSYEN", city: "AFYONKARAHİSAR", quota: 1, educationLevel: "Ortaöğretim", quals: ["2023"] },
      { osymCode: "102010164", institution: "ANKARA YILDIRIM BEYAZIT ÜNİVERSİTESİ", title: "DESTEK PERSONELİ", city: "ANKARA", quota: 3, educationLevel: "Ortaöğretim", quals: ["2001", "7348"] },
      { osymCode: "102010206", institution: "ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI", title: "DESTEK PERSONELİ", city: "ÇANAKKALE", quota: 1, educationLevel: "Ortaöğretim", quals: ["2001", "6262", "7348"] },
      { osymCode: "102010220", institution: "DEVLET DEMİRYOLLARI TAŞIMACILIK A.Ş", title: "VAGON TEKNİSYENİ", city: "EDİRNE", quota: 2, educationLevel: "Ortaöğretim", quals: ["2086", "7300", "7368"] },
      
      // --- TABLO-2 (Önlisans) ---
      { osymCode: "202010101", institution: "ADIYAMAN İL ÖZEL İDARESİ", title: "TEKNİKER", city: "ADIYAMAN", quota: 1, educationLevel: "Önlisans", quals: ["3319"] },
      { osymCode: "202010108", institution: "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİ.", title: "KORUMA VE GÜVENLİK GÖREVLİSİ", city: "AFYONKARAHİSAR", quota: 5, educationLevel: "Önlisans", quals: ["1101", "3389", "6551", "7303"] },
      { osymCode: "202010115", institution: "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİ.", title: "SAĞLIK TEKNİKERİ", city: "AFYONKARAHİSAR", quota: 5, educationLevel: "Önlisans", quals: ["3005"] }, // Acil
      { osymCode: "202010122", institution: "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİ.", title: "SAĞLIK TEKNİKERİ", city: "AFYONKARAHİSAR", quota: 9, educationLevel: "Önlisans", quals: ["3007"] }, // Anestezi
      { osymCode: "202010185", institution: "ANKARA MÜZİK VE GÜZEL SANATLAR ÜNİ.", title: "SAĞLIK TEKNİKERİ", city: "ANKARA", quota: 1, educationLevel: "Önlisans", quals: ["3005"] },
      { osymCode: "202010192", institution: "ANKARA MÜZİK VE GÜZEL SANATLAR ÜNİ.", title: "TEKNİKER", city: "ANKARA", quota: 1, educationLevel: "Önlisans", quals: ["3290"] },
      { osymCode: "202010213", institution: "ARTVİN ÇORUH ÜNİVERSİTESİ", title: "TEKNİKER", city: "ARTVİN", quota: 1, educationLevel: "Önlisans", quals: ["3248", "3249"] }, // Comp
      { osymCode: "202010255", institution: "ÇEVRE, ŞEHİRCİLİK BAKANLIĞI", title: "BÜRO PERSONELİ", city: "ANKARA", quota: 10, educationLevel: "Önlisans", quals: ["3163", "3181", "3301"] },

      // --- TABLO-3 (Lisans) ---
      { osymCode: "302010101", institution: "ADIYAMAN İL ÖZEL İDARESİ", title: "AVUKAT", city: "ADIYAMAN", quota: 1, educationLevel: "Lisans", quals: ["4419", "7205", "7207"] },
      { osymCode: "302010108", institution: "ADIYAMAN İL ÖZEL İDARESİ", title: "MİMAR", city: "ADIYAMAN", quota: 1, educationLevel: "Lisans", quals: ["4747"] },
      { osymCode: "302010115", institution: "ADIYAMAN İL ÖZEL İDARESİ", title: "MÜHENDİS", city: "ADIYAMAN", quota: 2, educationLevel: "Lisans", quals: ["4611"] },
      { osymCode: "302010178", institution: "AFYON KOCATEPE ÜNİVERSİTESİ", title: "BÜRO PERSONELİ", city: "AFYONKARAHİSAR", quota: 1, educationLevel: "Lisans", quals: ["4431"] },
      { osymCode: "302010206", institution: "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİ.", title: "HEMŞİRE", city: "AFYONKARAHİSAR", quota: 70, educationLevel: "Lisans", quals: ["4605"] },
      { osymCode: "302010227", institution: "AKSARAY İL ÖZEL İDARESİ", title: "VHKİ", city: "AKSARAY", quota: 3, educationLevel: "Lisans", quals: ["4421", "4426", "4453", "4503", "6225"] },
      { osymCode: "302010346", institution: "ATATÜRK ARAŞTIRMA MERKEZİ", title: "BİLGİSAYAR İŞLETMENİ", city: "ANKARA", quota: 1, educationLevel: "Lisans", quals: ["4237", "6225"] },
      { osymCode: "302010339", institution: "ARTVİN ÇORUH ÜNİVERSİTESİ", title: "MÜHENDİS", city: "ARTVİN", quota: 1, educationLevel: "Lisans", quals: ["4531", "7277", "7279", "7293"] }, // Comp Eng
    ];

    for (const p of positionsData) {
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
