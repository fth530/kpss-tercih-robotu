import fs from "fs";
import path from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const ASSETS_DIR = "./attached_assets";
const OUTPUT_DIR = "./parsed_data";

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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

interface Qualification {
  code: string;
  description: string;
  educationLevel: string;
}

interface Position {
  osymCode: string;
  institution: string;
  title: string;
  city: string;
  quota: number;
  qualificationCodes: string[];
  educationLevel: string;
}

function parseQualifications(text: string, educationLevel: string): Qualification[] {
  const qualifications: Qualification[] = [];
  const parts = text.split(/\s{2,}/).filter(p => p.trim());
  
  let currentCode = "";
  let currentDesc = "";
  
  for (const part of parts) {
    const trimmed = part.trim();
    const match = trimmed.match(/^(\d{4})\s*(.*)/);
    if (match) {
      if (currentCode && currentDesc) {
        qualifications.push({ code: currentCode, description: currentDesc.trim(), educationLevel });
      }
      currentCode = match[1];
      currentDesc = match[2] || "";
    } else if (currentCode && trimmed.length > 2 && !trimmed.match(/^\d+$/)) {
      currentDesc += " " + trimmed;
    }
  }
  if (currentCode && currentDesc) {
    qualifications.push({ code: currentCode, description: currentDesc.trim(), educationLevel });
  }
  return qualifications;
}


const CITIES = ["ADANA","ADIYAMAN","AFYONKARAHİSAR","AĞRI","AKSARAY","AMASYA","ANKARA","ANTALYA",
"ARTVİN","AYDIN","BALIKESİR","BARTIN","BATMAN","BAYBURT","BİLECİK","BİNGÖL","BİTLİS",
"BOLU","BURDUR","BURSA","ÇANAKKALE","ÇANKIRI","ÇORUM","DENİZLİ","DİYARBAKIR","DÜZCE",
"EDİRNE","ELAZIĞ","ERZİNCAN","ERZURUM","ESKİŞEHİR","GAZİANTEP","GİRESUN","GÜMÜŞHANE",
"HAKKARİ","HATAY","IĞDIR","ISPARTA","İSTANBUL","İZMİR","KAHRAMANMARAŞ","KARABÜK",
"KARAMAN","KARS","KASTAMONU","KAYSERİ","KIRIKKALE","KIRKLARELİ","KIRŞEHİR","KİLİS",
"KOCAELİ","KONYA","KÜTAHYA","MALATYA","MANİSA","MARDİN","MERSİN","MUĞLA","MUŞ",
"NEVŞEHİR","NİĞDE","ORDU","OSMANİYE","RİZE","SAKARYA","SAMSUN","SİİRT","SİNOP",
"SİVAS","ŞANLIURFA","ŞIRNAK","TEKİRDAĞ","TOKAT","TRABZON","TUNCELİ","UŞAK","VAN",
"YALOVA","YOZGAT","ZONGULDAK"];

function parsePositions(text: string, educationLevel: string): Position[] {
  const positions: Position[] = [];
  const cleanText = text.replace(/Warning:.*?(?=\d|[A-Z])/g, "").replace(/\s+/g, " ");
  
  // Find all ÖSYM codes (9 digits starting with 1, 2, or 3)
  const pattern = /([123]\d{8})\s+(\d{5})\s+/g;
  let match;
  const entries: {idx: number, osym: string, sbb: string}[] = [];
  
  while ((match = pattern.exec(cleanText)) !== null) {
    entries.push({ idx: match.index, osym: match[1], sbb: match[2] });
  }
  
  for (let i = 0; i < entries.length; i++) {
    const start = entries[i].idx;
    const end = entries[i + 1]?.idx || cleanText.length;
    const segment = cleanText.substring(start, end);
    
    const pos = parseSegment(segment, educationLevel);
    if (pos) positions.push(pos);
  }
  
  return positions;
}

function parseSegment(segment: string, educationLevel: string): Position | null {
  const codeMatch = segment.match(/^([123]\d{8})\s+\d{5}\s+(.*)/);
  if (!codeMatch) return null;
  
  const osymCode = codeMatch[1];
  let rest = codeMatch[2];
  
  // Find employment type
  const empTypes = ["SÖZLEŞMELİ PERSONEL", "MEMUR", "İŞÇİ"];
  let institution = "";
  let afterEmp = "";
  
  for (const et of empTypes) {
    const idx = rest.indexOf(et);
    if (idx > 0) {
      institution = rest.substring(0, idx).trim();
      afterEmp = rest.substring(idx + et.length).trim();
      break;
    }
  }
  if (!institution) return null;
  
  // Find city
  let city = "";
  let cityIdx = -1;
  for (const c of CITIES) {
    const idx = afterEmp.indexOf(c);
    if (idx > 0) {
      city = c;
      cityIdx = idx;
      break;
    }
  }
  if (!city) return null;
  
  // Title is between employment type and city
  const title = afterEmp.substring(0, cityIdx).trim();
  const afterCity = afterEmp.substring(cityIdx + city.length);
  
  // Extract qualification codes (4-digit numbers)
  const qualCodes: string[] = [];
  const qualPattern = /\b([234567]\d{3})\b/g;
  let qm;
  while ((qm = qualPattern.exec(afterCity)) !== null) {
    if (!qualCodes.includes(qm[1])) qualCodes.push(qm[1]);
  }
  
  // Extract quota
  const quotaMatch = afterCity.match(/\s(\d{1,3})\s+[234567]\d{3}/);
  const quota = quotaMatch ? parseInt(quotaMatch[1]) : 1;
  
  if (title && city) {
    return { osymCode, institution, title, city, quota, qualificationCodes: qualCodes, educationLevel };
  }
  return null;
}


async function main() {
  console.log("🔄 PDF Parse başlıyor...\n");
  
  const allQuals: Qualification[] = [];
  const allPositions: Position[] = [];
  
  // 1. Parse Nitelik files
  console.log("📋 NİTELİK DOSYALARI");
  const nitelikFiles = [
    { file: "ortaogr_nitelik18122025_(1)_1766511714001.pdf", level: "Ortaöğretim" },
    { file: "onlisans_nitelik_18122025_(1)_1766511733316.pdf", level: "Önlisans" },
    { file: "lisansnitelik_18122025_(1)_1766511751773.pdf", level: "Lisans" },
    { file: "ozel_kosullar18122025_(1)_1766511695454.pdf", level: "Special" },
  ];
  
  for (const nf of nitelikFiles) {
    const fp = path.join(ASSETS_DIR, nf.file);
    if (fs.existsSync(fp)) {
      const text = await extractPdfText(fp);
      const quals = parseQualifications(text, nf.level);
      allQuals.push(...quals);
      console.log(`  ✅ ${nf.level}: ${quals.length} nitelik`);
    } else {
      console.log(`  ❌ ${nf.file} bulunamadı`);
    }
  }
  
  // 2. Parse Position tables
  console.log("\n📋 KADRO TABLOLARI");
  const tableFiles = [
    { file: "tablo1_ort18122025_(1)_1766511617169.pdf", level: "Ortaöğretim" },
    { file: "tablo2_onlisans18122025_(1)_1766511639495.pdf", level: "Önlisans" },
    { file: "tablo3_lisans18122025_(1)_1766511669411.pdf", level: "Lisans" },
  ];
  
  for (const tf of tableFiles) {
    const fp = path.join(ASSETS_DIR, tf.file);
    if (fs.existsSync(fp)) {
      const text = await extractPdfText(fp);
      const positions = parsePositions(text, tf.level);
      allPositions.push(...positions);
      console.log(`  ✅ ${tf.level}: ${positions.length} kadro`);
    } else {
      console.log(`  ❌ ${tf.file} bulunamadı`);
    }
  }
  
  // Remove duplicate qualifications
  const uniqueQuals = Array.from(new Map(allQuals.map(q => [q.code, q])).values());
  
  // Save results
  fs.writeFileSync(path.join(OUTPUT_DIR, "qualifications.json"), JSON.stringify(uniqueQuals, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, "positions.json"), JSON.stringify(allPositions, null, 2));
  
  console.log(`\n✅ TAMAMLANDI!`);
  console.log(`   📊 ${uniqueQuals.length} benzersiz nitelik`);
  console.log(`   📊 ${allPositions.length} kadro`);
  console.log(`   📁 Dosyalar: ${OUTPUT_DIR}/`);
  
  // Sample output
  console.log("\n📝 Örnek Nitelikler:");
  uniqueQuals.slice(0, 3).forEach(q => console.log(`   ${q.code}: ${q.description.substring(0, 60)}...`));
  
  console.log("\n📝 Örnek Kadrolar:");
  allPositions.slice(0, 3).forEach(p => console.log(`   ${p.osymCode}: ${p.institution.substring(0, 30)} - ${p.title} (${p.city})`));
}

main().catch(console.error);
