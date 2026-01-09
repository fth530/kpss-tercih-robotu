import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = resolve(__dirname, "../client/public/sitemap.xml");

const today = new Date().toISOString().split("T")[0];

try {
  let content = readFileSync(SITEMAP_PATH, "utf-8");
  const updated = content.replace(/<lastmod>[\d-]+<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
  
  if (content !== updated) {
    writeFileSync(SITEMAP_PATH, updated, "utf-8");
    console.log(`[sitemap] Updated lastmod to ${today}`);
  } else {
    console.log(`[sitemap] Already up to date (${today})`);
  }
} catch (err) {
  console.error("[sitemap] Error:", err.message);
  process.exit(1);
}
