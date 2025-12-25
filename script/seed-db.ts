import fs from "fs";
import { db } from "../server/db";
import { qualifications, positions, positionQualifications } from "../shared/schema";
import { sql } from "drizzle-orm";

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

async function main() {
  console.log("🔄 Veritabanı seed işlemi başlıyor...\n");
  
  // Load parsed data
  const qualsData: ParsedQualification[] = JSON.parse(
    fs.readFileSync("./parsed_data/qualifications.json", "utf-8")
  );
  const positionsData: ParsedPosition[] = JSON.parse(
    fs.readFileSync("./parsed_data/positions.json", "utf-8")
  );
  
  console.log(`📊 Yüklenecek veri: ${qualsData.length} nitelik, ${positionsData.length} kadro\n`);
  
  // Clear existing data
  console.log("🗑️  Mevcut veriler temizleniyor...");
  await db.delete(positionQualifications);
  await db.delete(positions);
  await db.delete(qualifications);
  
  // Insert qualifications
  console.log("📋 Nitelikler ekleniyor...");
  let qualCount = 0;
  for (const q of qualsData) {
    try {
      await db.insert(qualifications).values({
        code: q.code,
        description: q.description.substring(0, 1000), // Truncate if too long
        educationLevel: q.educationLevel
      }).onConflictDoNothing();
      qualCount++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`   ✅ ${qualCount} nitelik eklendi`);
  
  // Insert positions
  console.log("📋 Kadrolar ekleniyor...");
  let posCount = 0;
  let qualLinkCount = 0;
  
  for (const p of positionsData) {
    try {
      const [inserted] = await db.insert(positions).values({
        osymCode: p.osymCode,
        institution: p.institution,
        title: p.title,
        city: p.city,
        quota: p.quota,
        educationLevel: p.educationLevel
      }).onConflictDoNothing().returning();
      
      if (inserted) {
        posCount++;
        // Insert qualification links
        for (const qCode of p.qualificationCodes) {
          try {
            await db.insert(positionQualifications).values({
              positionId: inserted.id,
              qualificationCode: qCode
            }).onConflictDoNothing();
            qualLinkCount++;
          } catch (e) {
            // Skip if qualification doesn't exist
          }
        }
      }
    } catch (e) {
      // Skip duplicates
    }
  }
  
  console.log(`   ✅ ${posCount} kadro eklendi`);
  console.log(`   ✅ ${qualLinkCount} kadro-nitelik ilişkisi eklendi`);
  
  console.log("\n✅ Seed işlemi tamamlandı!");
  
  // Verify
  const totalQuals = await db.select({ count: sql<number>`count(*)` }).from(qualifications);
  const totalPos = await db.select({ count: sql<number>`count(*)` }).from(positions);
  
  console.log(`\n📊 Veritabanı durumu:`);
  console.log(`   Nitelikler: ${totalQuals[0].count}`);
  console.log(`   Kadrolar: ${totalPos[0].count}`);
  
  process.exit(0);
}

main().catch(err => {
  console.error("Hata:", err);
  process.exit(1);
});
