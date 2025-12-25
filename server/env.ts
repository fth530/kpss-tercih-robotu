import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().transform(val => val.trim()).pipe(z.enum(["development", "production", "test"])).default("development"),
  PORT: z.string().transform(Number).default("5000"),
  DATABASE_URL: z.string().optional(), // Make optional for now
});

export const env = envSchema.parse(process.env);

// Validate environment on startup
if (!env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL environment variable is not set. Using in-memory storage.");
} else {
  console.log("✅ Database connection configured");
}

if (env.NODE_ENV === "development") {
  console.log("🔧 Running in development mode");
} else {
  console.log(`🚀 Running in ${env.NODE_ENV} mode`);
}