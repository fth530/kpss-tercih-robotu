import express, { type Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import fs from "fs";
import path from "path";

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

// Load JSON data
let qualifications: any[] = [];
let positions: any[] = [];
let dataLoaded = false;

function loadData() {
  if (dataLoaded) return;
  
  try {
    // Try multiple paths
    const possiblePaths = [
      path.join(process.cwd(), "parsed_data"),
      path.join(__dirname, "..", "..", "parsed_data"),
      path.join(__dirname, "..", "..", "..", "parsed_data"),
      "/var/task/parsed_data",
    ];
    
    let foundPath = "";
    for (const basePath of possiblePaths) {
      const qPath = path.join(basePath, "qualifications.json");
      if (fs.existsSync(qPath)) {
        foundPath = basePath;
        break;
      }
    }
    
    if (!foundPath) {
      console.error("❌ parsed_data not found. Tried:", possiblePaths);
      throw new Error("Data files not found");
    }
    
    qualifications = JSON.parse(
      fs.readFileSync(path.join(foundPath, "qualifications.json"), "utf-8")
    );
    positions = JSON.parse(
      fs.readFileSync(path.join(foundPath, "positions.json"), "utf-8")
    );
    
    dataLoaded = true;
    console.log(`✅ Loaded ${qualifications.length} qualifications, ${positions.length} positions from ${foundPath}`);
  } catch (error) {
    console.error("❌ Failed to load data:", error);
    throw error;
  }
}

// API Routes
app.get("/api/meta", async (_req: Request, res: Response) => {
  try {
    loadData();
    
    const cities = Array.from(new Set(positions.map((p: any) => p.city))).sort();
    const educationLevels = Array.from(new Set(positions.map((p: any) => p.educationLevel))).sort();
    
    res.json({
      cities,
      educationLevels,
      qualifications: qualifications.map((q: any) => ({
        code: q.code,
        description: q.description,
        educationLevel: q.educationLevel
      }))
    });
  } catch (error: any) {
    console.error("Meta error:", error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/positions/search", async (req: Request, res: Response) => {
  try {
    loadData();
    
    const { educationLevel, cities, departmentCodes } = req.body;
    
    if (!educationLevel) {
      return res.status(400).json({ message: "educationLevel is required" });
    }

    let results = positions;
    
    // Filter by education level
    if (educationLevel) {
      results = results.filter((p: any) => p.educationLevel === educationLevel);
    }
    
    // Filter by cities
    const hasAllCities = cities?.some((c: string) => 
      c.toLowerCase() === 'all' || c === 'Tümü' || c === 'Tüm Şehirler'
    );
    if (!hasAllCities && cities?.length > 0) {
      results = results.filter((p: any) => cities.includes(p.city));
    }
    
    // Filter by qualification codes
    if (departmentCodes && departmentCodes.length > 0) {
      const hasAllDepts = departmentCodes.some((c: string) => 
        c.toLowerCase() === 'all' || c === 'Tümü'
      );
      
      if (!hasAllDepts) {
        let codesToSearch = [...departmentCodes];
        
        // Add generic codes
        if (educationLevel === "Ortaöğretim" && !codesToSearch.includes("2001")) {
          codesToSearch.push("2001");
        }
        if (educationLevel === "Önlisans" && !codesToSearch.includes("3001")) {
          codesToSearch.push("3001");
        }
        if (educationLevel === "Lisans" && !codesToSearch.includes("4001")) {
          codesToSearch.push("4001");
        }
        
        results = results.filter((p: any) => 
          p.qualificationCodes.some((qc: string) => codesToSearch.includes(qc))
        );
      }
    }
    
    // Map to response format
    const qualMap = new Map(qualifications.map((q: any) => [q.code, q]));
    
    const response = results.map((p: any, idx: number) => ({
      id: idx + 1,
      osymCode: p.osymCode,
      institution: p.institution,
      title: p.title,
      city: p.city,
      quota: p.quota,
      educationLevel: p.educationLevel,
      minScore: null,
      qualifications: p.qualificationCodes
        .map((code: string) => qualMap.get(code))
        .filter((q: any) => q !== undefined)
        .map((q: any) => ({
          code: q.code,
          description: q.description,
          educationLevel: q.educationLevel
        }))
    }));

    res.json(response);
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
