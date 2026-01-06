import fs from "fs";
import path from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const ASSETS_DIR = "./attached_assets";
const OUTPUT_DIR = "./parsed_data";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function extractPdfText(filePath: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await getDocument({ data }).promise;
  let fullText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(" ") + "\n";
  }
  return fullText;
}

interface Position {
  osymCode: string;
  sbbCode: string;
  institution: string;
  employmentType: string;
  title: string;
  city: string;
  quota: number;
  qualificationCodes: string[];
  educationLevel: string;
}

interface Qualification {
  code: string;
  description: string;
  educationLevel: string;
}


function parseNitelikFile(text: string, educationLevel: string): Qualification[] {
  const qualifications: Qualification[] = [];
  const lines = text.split(/\s{2,}|\n/).filter(l => l.trim());
  let currentCode = "";
  let currentDesc = "";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const codeMatch = line.match(/^(\d{4})\s*(.*)/);
    if (codeMatch) {
      if (currentCode && currentDesc) {
        qualifications.push({ code: currentCode, description: currentDesc.trim(), educationLevel });
      }
      currentCode = codeMatch[1];
      currentDesc = codeMatch[2] || "";
    } else if (currentCode && !line.match(/^\d{4}/) && line.length > 3) {
      currentDesc += " " + line;
    }
  }
  if (currentCode && currentDesc) {
    qualifications.push({ code: currentCode, description: currentDesc.trim(), educationLevel });
  }
  return qualifications;
}

function parseOzelKosullar(text: string): Qualification[] {
  const qualifications: Qualification[] = [];
  const lines = text.split(/\s{2,}|\n/).filter(l => l.trim());
  let currentCode = "";
  let currentDesc = "";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const codeMatch = line.match(/^(\d{4})\s*(.*)/);
    if (codeMatch) {
      if (currentCode && currentDesc) {
        qualifications.push({ code: currentCode, description: currentDesc.trim(), educationLevel: "Special" });
      }
      currentCode = codeMatch[1];
      currentDesc = codeMatch[2] || "";
    } else if (currentCode && !line.match(/^\d{4}/) && line.length > 3) {
      currentDesc += " " + line;
    }
  }
  if (currentCode && currentDesc) {
    qualifications.push({ code: currentCode, description: currentDesc.trim(), educationLevel: "Special" });
  }
  return qualifications;
}


const CITIES = ["ADANA", "ADIYAMAN", "AFYONKARAHİSAR", "AĞRI", "AKSARAY", "AMASYA", "ANKARA", "ANTALYA", 
  "ARTVİN", "AYDIN", "BALIKESİR", "BARTIN", "BATMAN", "BAYBURT", "BİLECİK", "BİNGÖL", "BİTLİS", 
  "BOLU", "BURDUR", "BURSA", "ÇANAKKALE", "ÇANKIRI", "ÇORUM", "DENİZLİ", "DİYARBAKIR", "DÜZCE",
  "EDİRNE", "ELAZIĞ", "ERZİNCAN", "ERZURUM", "ESKİŞEHİR", "GAZİANTEP", "GİRESUN", "GÜMÜŞHANE",
  "HAKKARİ", "HATAY", "IĞDIR", "ISPARTA", "İSTANBUL", "İZMİR", "KAHRAMANMARAŞ", "KARABÜK",
  "KARAMAN", "KARS", "KASTAMONU", "KAYSERİ", "KIRIKKALE", "KIRKLARELİ", "KIRŞEHİR", "KİLİS",
  "KOCAELİ", "KONYA", "KÜTAHYA", "MALATYA", "MANİSA", "MARDİN", "MERSİN", "MUĞLA", "MUŞ",
  "NEVŞEHİR", "NİĞDE", "ORDU", "OSMANİYE", "RİZE", "SAKARYA", "SAMSUN", "SİİRT", "SİNOP",
  "SİVAS", "ŞANLIURFA", "ŞIRNAK", "TEKİRDAĞ", "TOKAT", "TRABZON", "TUNCELİ", "UŞAK", "VAN",
  "YALOVA", "YOZGAT", "ZONGULDAK"];

function parsePositionTable(text: string, educationLevel: string): Position[] {
  const positions: Position[] = [];
  const cleanText = text.replace(/Warning:.*?\n/g, "").replace(/\s+/g, " ");
  
  const osymPattern = /([123]\d{8})\s+(\d{5})/g;
  let match;
  const entries: { start: number; osymCode: string; sbbCode: string }[] = [];
  
  while ((match = osymPattern.exec(cleanText)) !== null) {
    entries.push({ start: match.index, osymCode: match[1], sbbCode: match[2] });
  }
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const nextStart = entries[i + 1]?.start || cleanText.length;
    const segment = cleanText.substring(entry.start, nextStart).trim();
    
    try {
      const position = parsePositionSegment(segment, educationLevel);
      if (position) positions.push(position);
    } catch (e) {}
  }
  return positions;
}


function parsePositionSegment(segment: string, educationLevel: string): Position | null {
  const codeMatch = segment.match(/^([123]\d{8})\s+(\d{5})\s+(.*)/);
  if (!codeMatch) return null;
  
  const osymCode = codeMatch[1];
  const sbbCode = codeMatch[2];
  let rest = codeMatch[3];
  
  const employmentTypes = ["MEMUR", "SÖZLEŞMELİ PERSONEL", "İŞÇİ", "KADROLU"];
  
  for (const et of employmentTypes) {
    if (rest.includes(et)) {
      const idx = rest.indexOf(et);
      const institution = rest.substring(0, idx).trim();
      rest = rest.substring(idx + et.length).trim();
      
      let city = "";
      for (const c of CITIES) {
        if (rest.includes(c)) { city = c; break; }
      }
      
      let title = "";
      if (city) {
        const cityIdx = rest.indexOf(city);
        title = rest.substring(0, cityIdx).trim();
      }
      
      const qualCodes: string[] = [];
      const qualPattern = /\b(\d{4})\b/g;
      let qualMatch;
      while ((qualMatch = qualPattern.exec(rest)) !== null) {
        const num = qualMatch[1];
        if (num.match(/^[234567]\d{3}$/)) qualCodes.push(num);
      }
      
      const quotaMatch = rest.match(/\s(\d{1,3})\s+\d{4}/);
      const quota = quotaMatch ? parseInt(quotaMatch[1]) : 1;
      
      if (institution && title && city) {
        return { osymCode, sbbCode, institution, employmentType: et, title, city, quota, qualificationCodes: qualCodes, educationLevel };
      }
      break;
    }
  }
  return null;
}


async function main() {
  console.log("🔄 PDF Parse işlemi başlıyor...\n");
  
  const allQualifications: Qualification[] = [];
  const allPositions: Position[] = [];
  
  console.log("📋 Nitelik dosyaları parse ediliyor...");
  const nitelikFiles = [
    { file: "ortaogr_nitelik18122025_(1)_1766511714001.pdf", level: "Ortaöğretim" },
    { file: "onlisans_nitelik_18122025_(1)_1766511733316.pdf", level: "Önlisans" },
    { file: "lisansnitelik_18122025_(1)_1766511751773.pdf", level: "Lisans" },
  ];
  
  for (const nf of nitelikFiles) {
    const filePath = path.join(ASSETS_DIR, nf.file);
    if (fs.existsSync(filePath)) {
      const text = await extractPdfText(filePath);
      const quals = parseNitelikFile(text, nf.level);
      allQualifications.push(...quals);
      console.log(`  ✅ ${nf.level}: ${quals.length} nitelik bulundu`);
    }
  }
  
  console.log("\n📋 Özel koşullar parse ediliyor...");
  const ozelKosullarFile = path.join(ASSETS_DIR, "ozel_kosullar18122025_(1)_1766511695454.pdf");
  if (fs.existsSync(ozelKosullarFile)) {
    const text = await extractPdfText(ozelKosullarFile);
    const specialQuals = parseOzelKosullar(text);
    allQualifications.push(...specialQuals);
    console.log(`  ✅ Özel Koşullar: ${specialQuals.length} koşul bulundu`);
  }
  
  console.log("\n📋 Kadro tabloları parse ediliyor...");
  const tableFiles = [
    { file: "tablo1_ort18122025_(1)_1766511617169.pdf", level: "Ortaöğretim" },
    { file: "tablo2_onlisans18122025_(1)_1766511639495.pdf", level: "Önlisans" },
    { file: "tablo3_lisans18122025_(1)_1766511669411.pdf", level: "Lisans" },
  ];
  
  for (const tf of tableFiles) {
    const filePath = path.join(ASSETS_DIR, tf.file);
    if (fs.existsSync(filePath)) {
      const text = await extractPdfText(filePath);
      const positions = parsePositionTable(text, tf.level);
      allPositions.push(...positions);
      console.log(`  ✅ ${tf.level}: ${positions.length} kadro bulundu`);
    }
  }
  
  console.log("\n💾 Sonuçlar kaydediliyor...");
  const uniqueQuals = Array.from(new Map(allQualifications.map(q => [q.code, q])).values());
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "qualifications.json"), JSON.stringify(uniqueQuals, null, 2), "utf-8");
  fs.writeFileSync(path.join(OUTPUT_DIR, "positions.json"), JSON.stringify(allPositions, null, 2), "utf-8");
  
  console.log(`\n✅ Parse tamamlandı!`);
  console.log(`   📊 Toplam ${uniqueQuals.length} benzersiz nitelik`);
  console.log(`   📊 Toplam ${allPositions.length} kadro`);
  
  console.log("\n📝 Örnek Nitelikler:");
  uniqueQuals.slice(0, 5).forEach(q => console.log(`   ${q.code}: ${q.description.substring(0, 60)}...`));
  
  console.log("\n📝 Örnek Kadrolar:");
  allPositions.slice(0, 5).forEach(p => console.log(`   ${p.osymCode}: ${p.institution} - ${p.title} (${p.city})`));
}

main().catch(console.error);
