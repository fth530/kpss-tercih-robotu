import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, cp } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  const startTime = Date.now();
  const isCI = process.env.CI === 'true' || process.env.NETLIFY === 'true';
  
  await rm("dist", { recursive: true, force: true });

  if (!isCI) console.log("🏗️  Building client...");
  const clientStart = Date.now();
  await viteBuild({ logLevel: isCI ? 'error' : 'info' });
  if (!isCI) console.log(`✅ Client built in ${Date.now() - clientStart}ms`);

  if (!isCI) console.log("🏗️  Building server...");
  const serverStart = Date.now();
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: isCI ? 'error' : 'info',
    sourcemap: false, // Disable sourcemaps for production
    treeShaking: true, // Enable tree shaking
    target: "node18", // Target Node.js 18+
  });
  
  // Copy parsed_data to dist for serverless functions
  if (!isCI) console.log("📦 Copying parsed_data...");
  await cp("parsed_data", "dist/parsed_data", { recursive: true });
  
  if (!isCI) console.log(`✅ Server built in ${Date.now() - serverStart}ms`);
  if (!isCI) console.log(`🎉 Total build time: ${Date.now() - startTime}ms`);
}

buildAll().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
