import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

let qualifications: any[] = [];
let positions: any[] = [];
let dataLoaded = false;

function loadData() {
  if (dataLoaded) return;
  
  const possiblePaths = [
    path.join(process.cwd(), "parsed_data"),
    path.join(__dirname, "..", "..", "parsed_data"),
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
    throw new Error("Data files not found");
  }
  
  qualifications = JSON.parse(
    fs.readFileSync(path.join(foundPath, "qualifications.json"), "utf-8")
  );
  positions = JSON.parse(
    fs.readFileSync(path.join(foundPath, "positions.json"), "utf-8")
  );
  
  dataLoaded = true;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    loadData();
    
    const { educationLevel, cities, departmentCodes } = req.body;
    
    if (!educationLevel) {
      return res.status(400).json({ message: "educationLevel is required" });
    }

    let results = positions;
    
    // Filter by education level
    results = results.filter((p: any) => p.educationLevel === educationLevel);
    
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

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Search error:", error);
    res.status(500).json({ message: error.message });
  }
}
