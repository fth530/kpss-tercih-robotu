import express, { type Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { storage } from "../../server/storage";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS for Netlify
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// API Routes
app.get("/api/meta", async (_req: Request, res: Response) => {
  try {
    const meta = await storage.getMeta();
    res.json(meta);
  } catch (error: any) {
    console.error("Meta error:", error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/search", async (req: Request, res: Response) => {
  try {
    const { educationLevel, cities, departmentCodes } = req.body;
    
    if (!educationLevel) {
      return res.status(400).json({ message: "educationLevel is required" });
    }

    const results = await storage.searchPositions({
      educationLevel,
      cities: cities || [],
      departmentCodes: departmentCodes || [],
    });

    res.json(results);
  } catch (error: any) {
    console.error("Search error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Error:", status, message);
  res.status(status).json({ message });
});

export const handler = serverless(app);
