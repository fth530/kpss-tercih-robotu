import fs from "fs";
import path from "path";
import https from "https";
import crypto from "crypto";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const ASSETS_DIR = "./attached_assets";
const OUTPUT_DIR = "./parsed_data";
const PUBLIC_DATA_DIR = "./client/public/data";
const STATE_FILE = "./parsed_data/.update-state.json";
const OSYM_BASE_URL = "https://www.osym.gov.tr";
const KPSS_2025_PAGE = "/TR,32935/2025.html";

fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });

// Güncelleme durumunu takip et
interface UpdateState {
  lastUpdate: string;
  lastKilavuzUrl: string;
  fileHashes: Record<string, string>;
}

function loadState(): UpdateState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    }
  } catch {}
  return { lastUpdate: "", lastKilavuzUrl: "", fileHashes: {} };
}

function saveState(state: UpdateState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function calculateHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(content).digest("hex");
}

// Türkçe karakterleri düzgün karşılaştırmak için
const turkishLower = (str: string) => str.toLocaleLowerCase('tr-TR');

// HTTPS ile sayfa çek
async function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith("http") ? url : `${OSYM_BASE_URL}${url}`;
    const isCI = process.env.CI === 'true' || process.env.NETLIFY === 'true';

    https.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          fetchPage(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }

      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", (err) => {
      if (!isCI) console.error("Fetch error:", err);
      reject(err);
    });
  });
}

// PDF linklerini sayfadan çıkar
function extractPdfLinks(html: string): { name: string; url: string }[] {
  const pdfLinks: { name: string; url: string }[] = [];

  // dokuman.osym.gov.tr linklerini bul
  const regex = /https?:\/\/dokuman\.osym\.gov\.tr\/[^"'\s]+\.pdf/gi;
  const matches = html.match(regex) || [];

  for (const url of matches) {
    const fileName = url.split('/').pop() || '';
    if (!pdfLinks.some(p => p.url === url)) {
      pdfLinks.push({ name: fileName, url });
    }
  }

  return pdfLinks;
}

// PDF dosyasını indir
async function downloadPdf(url: string, savePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(savePath);

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(savePath);
          downloadPdf(redirectUrl, savePath).then(resolve).catch(reject);
          return;
        }
      }

      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
      file.on("error", (err) => {
        fs.unlinkSync(savePath);
        reject(err);
      });
    }).on("error", (err) => {
      fs.unlinkSync(savePath);
      reject(err);
    });
  });
}

// PDF'den metin çıkar
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

// Interfaces
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

// Nitelik kodlarını parse et
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

// Şehir listesi
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

// Kadro pozisyonlarını parse et
function parsePositions(text: string, educationLevel: string): Position[] {
  const positions: Position[] = [];
  const cleanText = text.replace(/Warning:.*?(?=\d|[A-Z])/g, "").replace(/\s+/g, " ");

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

  const title = afterEmp.substring(0, cityIdx).trim();
  const afterCity = afterEmp.substring(cityIdx + city.length);

  const qualCodes: string[] = [];
  const qualPattern = /\b([234567]\d{3})\b/g;
  let qm;
  while ((qm = qualPattern.exec(afterCity)) !== null) {
    if (!qualCodes.includes(qm[1])) qualCodes.push(qm[1]);
  }

  const quotaMatch = afterCity.match(/\s(\d{1,3})\s+[234567]\d{3}/);
  const quota = quotaMatch ? parseInt(quotaMatch[1]) : 1;

  if (title && city) {
    return { osymCode, institution, title, city, quota, qualificationCodes: qualCodes, educationLevel };
  }
  return null;
}

// Dosya türünü belirle
function getFileType(fileName: string): { type: string; level: string } | null {
  const lower = turkishLower(fileName);

  if (lower.includes("tablo1") || lower.includes("_ort")) {
    if (lower.includes("nitelik")) return { type: "qualification", level: "Ortaöğretim" };
    if (lower.includes("tablo")) return { type: "position", level: "Ortaöğretim" };
  }
  if (lower.includes("tablo2") || lower.includes("onlisans")) {
    if (lower.includes("nitelik")) return { type: "qualification", level: "Önlisans" };
    if (lower.includes("tablo")) return { type: "position", level: "Önlisans" };
  }
  if (lower.includes("tablo3") || lower.includes("lisans")) {
    if (lower.includes("nitelik")) return { type: "qualification", level: "Lisans" };
    if (lower.includes("tablo") && !lower.includes("onlisans")) return { type: "position", level: "Lisans" };
  }
  if (lower.includes("ortaogr") && lower.includes("nitelik")) {
    return { type: "qualification", level: "Ortaöğretim" };
  }
  if (lower.includes("onlisans") && lower.includes("nitelik")) {
    return { type: "qualification", level: "Önlisans" };
  }
  if (lower.includes("lisans") && lower.includes("nitelik") && !lower.includes("onlisans")) {
    return { type: "qualification", level: "Lisans" };
  }
  if (lower.includes("ozel") && lower.includes("kosul")) {
    return { type: "qualification", level: "Special" };
  }

  return null;
}

// En son genel KPSS kılavuzunu otomatik bul
async function findLatestKilavuz(): Promise<string | null> {
  const isCI = process.env.CI === 'true' || process.env.NETLIFY === 'true';
  if (!isCI) console.log("🔍 En son KPSS kılavuzu aranıyor...");

  try {
    const html = await fetchPage(KPSS_2025_PAGE);

    // "Bazı Kamu Kurum ve Kuruluşları" içeren linkleri bul (genel kılavuzlar)
    const linkPattern = /\/TR,(\d+)\/[^"]*tercih[^"]*\.html/gi;
    const matches = [...html.matchAll(linkPattern)];

    // En yüksek ID'li linki bul (genelde en yeni)
    let bestMatch: { id: number; url: string } | null = null;

    for (const match of matches) {
      const id = parseInt(match[1]);
      const url = match[0];

      // Sağlık Bakanlığı, Çevre Bakanlığı gibi özel kılavuzları atla
      if (url.includes("saglik") || url.includes("cevre") || url.includes("bakanlig")) {
        continue;
      }

      if (!bestMatch || id > bestMatch.id) {
        bestMatch = { id, url };
      }
    }

    if (bestMatch) {
      if (!isCI) console.log(`   ✅ Bulunan kılavuz: ${bestMatch.url}`);
      return bestMatch.url;
    }

    return null;
  } catch (err) {
    if (!isCI) console.error("   ❌ Kılavuz arama hatası:", err);
    return null;
  }
}

// Ana fonksiyon
async function main() {
  const isCI = process.env.CI === 'true' || process.env.NETLIFY === 'true';
  
  if (!isCI) {
    console.log("🚀 KPSS Tercih Robotu - Otomatik Güncelleme\n");
    console.log("=".repeat(50));
  }

  const state = loadState();
  let hasChanges = false;
  const isCI = process.env.CI === 'true' || process.env.NETLIFY === 'true';

  // 1. En son kılavuzu otomatik bul
  const kilavuzUrl = await findLatestKilavuz();

  if (!kilavuzUrl) {
    if (!isCI) console.error("❌ Kılavuz bulunamadı!");
    process.exit(1);
  }

  // 2. ÖSYM sayfasından PDF linklerini çek
  if (!isCI) console.log("\n📡 ÖSYM sitesinden veriler çekiliyor...");

  let html: string;
  try {
    html = await fetchPage(kilavuzUrl);
    if (!isCI) console.log("   ✅ Sayfa başarıyla alındı");
  } catch (err) {
    if (!isCI) console.error("   ❌ Sayfa alınamadı:", err);
    process.exit(1);
  }

  const pdfLinks = extractPdfLinks(html);
  if (!isCI) console.log(`   📋 ${pdfLinks.length} PDF dosyası bulundu\n`);

  if (pdfLinks.length === 0) {
    if (!isCI) console.error("❌ PDF linki bulunamadı!");
    process.exit(1);
  }

  // Eski dosyaları temizle (sadece bizim indirdiklerimizi)
  if (!isCI) console.log("🧹 Eski PDF dosyaları temizleniyor...");
  const existingFiles = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.pdf'));
  for (const file of existingFiles) {
    const filePath = path.join(ASSETS_DIR, file);
    fs.unlinkSync(filePath);
  }
  if (!isCI) console.log(`   ✅ ${existingFiles.length} eski dosya temizlendi\n`);

  // 2. PDF'leri indir
  if (!isCI) console.log("📥 PDF dosyaları indiriliyor...");

  const downloadedFiles: { path: string; type: string; level: string }[] = [];

  for (const pdf of pdfLinks) {
    const fileInfo = getFileType(pdf.name);
    if (!fileInfo) {
      if (!isCI) console.log(`   ⏭️  Atlandı: ${pdf.name}`);
      continue;
    }

    const savePath = path.join(ASSETS_DIR, pdf.name);

    try {
      await downloadPdf(pdf.url, savePath);
      if (!isCI) console.log(`   ✅ ${pdf.name}`);
      downloadedFiles.push({ path: savePath, ...fileInfo });
    } catch (err) {
      if (!isCI) console.error(`   ❌ İndirilemedi: ${pdf.name}`, err);
    }
  }

  if (!isCI) console.log(`\n   📦 ${downloadedFiles.length} dosya indirildi\n`);

  // 3. PDF'leri parse et
  if (!isCI) console.log("🔄 PDF dosyaları işleniyor...");

  const allQuals: Qualification[] = [];
  const allPositions: Position[] = [];

  // Nitelikleri parse et
  if (!isCI) console.log("\n   📋 Nitelik kodları:");
  for (const file of downloadedFiles.filter(f => f.type === "qualification")) {
    try {
      const text = await extractPdfText(file.path);
      const quals = parseQualifications(text, file.level);
      allQuals.push(...quals);
      if (!isCI) console.log(`      ✅ ${file.level}: ${quals.length} nitelik`);
    } catch (err) {
      if (!isCI) console.error(`      ❌ ${file.level}: Hata`, err);
    }
  }

  // Kadroları parse et
  if (!isCI) console.log("\n   📋 Kadro tabloları:");
  for (const file of downloadedFiles.filter(f => f.type === "position")) {
    try {
      const text = await extractPdfText(file.path);
      const positions = parsePositions(text, file.level);
      allPositions.push(...positions);
      if (!isCI) console.log(`      ✅ ${file.level}: ${positions.length} kadro`);
    } catch (err) {
      if (!isCI) console.error(`      ❌ ${file.level}: Hata`, err);
    }
  }

  // 4. JSON dosyalarını kaydet
  const uniqueQuals = Array.from(new Map(allQuals.map(q => [q.code, q])).values());

  fs.writeFileSync(path.join(OUTPUT_DIR, "qualifications.json"), JSON.stringify(uniqueQuals, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, "positions.json"), JSON.stringify(allPositions, null, 2));

  // 4.5 Public klasörüne de kopyala (Vercel static deployment için)
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, "qualifications.json"), JSON.stringify(uniqueQuals, null, 2));
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, "positions.json"), JSON.stringify(allPositions, null, 2));
  if (!isCI) console.log(`   📁 Public klasörüne kopyalandı: ${PUBLIC_DATA_DIR}`);

  // 5. Hash kontrolü - değişiklik var mı?
  const newHashes: Record<string, string> = {};
  for (const file of downloadedFiles) {
    newHashes[path.basename(file.path)] = calculateHash(file.path);
  }

  const oldHashes = state.fileHashes;
  for (const [fileName, hash] of Object.entries(newHashes)) {
    if (oldHashes[fileName] !== hash) {
      hasChanges = true;
      if (!isCI) console.log(`   🔄 Değişiklik: ${fileName}`);
    }
  }

  // 6. State'i güncelle
  state.lastUpdate = new Date().toISOString();
  state.lastKilavuzUrl = kilavuzUrl;
  state.fileHashes = newHashes;
  saveState(state);

  // 7. Sonuç
  if (!isCI) {
    console.log("\n" + "=".repeat(50));
    console.log("✅ GÜNCELLEME TAMAMLANDI!\n");
    console.log(`   📊 ${uniqueQuals.length} benzersiz nitelik kodu`);
    console.log(`   📊 ${allPositions.length} kadro`);
    console.log(`   📁 Kayıt: ${OUTPUT_DIR}/`);
    console.log(`   🕐 Tarih: ${new Date().toLocaleString("tr-TR")}`);

    if (hasChanges) {
      console.log("\n   ⚠️  VERİLER GÜNCELLENDİ! Sunucuyu yeniden başlatın:");
      console.log("   npm run dev\n");
    } else {
      console.log("\n   ✅ Veriler zaten güncel.\n");
    }
  }
}

// Sadece yeni veri var mı kontrol et (hızlı mod)
async function checkForUpdates(): Promise<boolean> {
  const isCI = process.env.CI === 'true' || process.env.NETLIFY === 'true';
  if (!isCI) console.log("🔍 Güncellemeler kontrol ediliyor...\n");

  const state = loadState();
  const kilavuzUrl = await findLatestKilavuz();

  if (!kilavuzUrl) {
    if (!isCI) console.log("❌ Kılavuz bulunamadı");
    return false;
  }

  if (state.lastKilavuzUrl !== kilavuzUrl) {
    if (!isCI) {
      console.log("🆕 Yeni kılavuz bulundu!");
      console.log(`   Eski: ${state.lastKilavuzUrl || "(yok)"}`);
      console.log(`   Yeni: ${kilavuzUrl}`);
    }
    return true;
  }

  if (!isCI) {
    console.log("✅ Kılavuz güncel, değişiklik yok.");
    console.log(`   Son güncelleme: ${state.lastUpdate || "(hiç)"}`);
  }
  return false;
}

// CLI argümanlarını kontrol et
const args = process.argv.slice(2);

if (args.includes("--check")) {
  // Sadece kontrol et, güncelleme yapma
  checkForUpdates().catch(console.error);
} else {
  // Tam güncelleme yap
  main().catch(console.error);
}
